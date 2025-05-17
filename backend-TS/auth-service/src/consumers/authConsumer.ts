import amqp from "amqplib";
import { User } from "../models/userModel";
import Redis from "ioredis";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";

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
        const { name, email, password } = JSON.parse(msg.content.toString());

        // Check Redis cache for duplicate prevention
        if (await redisClient.get(email)) return channel.ack(msg);

        // Set a temporary flag in Redis to prevent duplicate processing
        await redisClient.set(email, "processing", "EX", 10);

        const hashedPassword = await bcrypt.hash(password, 10);

        batch.push({
            name,
            email,
            password:hashedPassword
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


export const authConsumer = async(): Promise<void> => {
    const channel = await connectRabbitMQ();
    await processSignups(channel);
    setInterval(insertBatch, 1000); // Process any remaining batch users every 1 sec
};
