import amqp from "amqplib";
import { User } from "../models/userModel";
import { Session } from "../models/sessionModel";
import Redis from "ioredis";
import dotenv from "dotenv";
import {generateName} from "../utils/nameGenerator";
import bcrypt from "bcryptjs";
import {encryptImage} from "../utils/imageEncryption";

dotenv.config();
const RABBITMQ_URL = process.env.RABBITMQ_URL as string;

const BATCH_SIZE = 50; // Number of users processed at once
const batch: any[] = [];
const redisClient = new Redis();

async function connectRabbitMQ() {
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();
    await channel.assertQueue("signupQueue", { durable: true });
    await channel.assertQueue("authQueue", { durable: true });
    return channel;
}

async function processSignups(channel: amqp.Channel) {
    await channel.consume("signupQueue", async (msg) => {
        if (!msg) {
            console.error("No such message in signupQueue");
            return;
        }
        const { email, password, photo } = JSON.parse(msg.content.toString());

        let encryptedPhoto = null;
        let photoIV = null;
        let photoTag = null;

        // Encrypt the photo if it exists
        if (photo) {
            const imageBuffer = Buffer.from(photo, "base64"); // Convert Base64 to Buffer
            const { encryptedData, iv, tag } = encryptImage(imageBuffer);

            encryptedPhoto = encryptedData;
            photoIV = iv;
            photoTag = tag;
        }

        // Check Redis cache for duplicate prevention
        if (await redisClient.get(email)) return channel.ack(msg);

        // Set a temporary flag in Redis to prevent duplicate processing
        await redisClient.set(email, "processing", "EX", 10);

        const hashedPassword = await bcrypt.hash(password, 10);
        const name = await generateName();

        batch.push({
            name,
            email,
            password:hashedPassword,
            photo: encryptedPhoto,
            photoIV,
            photoTag
        });

        channel.ack(msg);

        if (batch.length >= BATCH_SIZE) {
            await insertBatch();
        }
    });
}

async function insertBatch() {
    if (batch.length === 0) return;
    try {
        await User.insertMany(batch, { ordered: false });
        console.log(`Inserted ${batch.length} users`);
    } catch (error) {
        console.error("Batch insert error:", error);
    }
    batch.length = 0;
}

async function processAuth(channel: amqp.Channel) {
    await channel.consume("authQueue", async (msg) => {
        if (!msg) {
            console.error("No such message in authQueue");
            return;
        }

        const {userId, token} = JSON.parse(msg.content.toString());

        try{
            await Session.updateOne(
                {userId:userId},
                {$set: {token, updatedAt: new Date()}},
                {upsert: true}
            );
            console.log(`Authenticated User Stored: ${userId}`);
        } catch (error) {
            console.error(" Session Store Error:", error);
        }

        channel.ack(msg);
    });
}

export const authConsumer = async(): Promise<void> => {
    const channel = await connectRabbitMQ();
    await processSignups(channel);
    await processAuth(channel);
    setInterval(insertBatch, 1000); // Process any remaining batch users every 1 sec
};
