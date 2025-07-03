import amqp from "amqplib";
import {User} from "../models/userModel";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import {getRedisClient} from "../config/redis";

const env = process.env.NODE_ENV;
dotenv.config({path: `.env.${env}`});
const RABBITMQ_URL = process.env.RABBITMQ_URL as string;

const BATCH_SIZE = 50; // Number of users processed at once
const batch: any[] = [];

async function connectRabbitMQ() {
    let attempts = 10;
    while (attempts > 0) {
        try {
            const connection = await amqp.connect(RABBITMQ_URL);
            const channel = await connection.createChannel();
            await channel.assertQueue("authQueue", {durable: true});
            await channel.purgeQueue("authQueue");
            return channel;
        } catch (err) {
            console.log(`RabbitMQ consumer connection failed. Retrying in 3s... (${11 - attempts}/10)`);
            attempts--;
            await new Promise(res => setTimeout(res, 3000));
        }
    }
    throw new Error('Failed to connect to RabbitMQ in authConsumer after 10 attempts');
}

async function processSignups(channel: amqp.Channel) {
    await channel.consume("authQueue", async (msg) => {
        if (!msg) {
            console.error("No such message in authQueue");
            return;
        }
        const {name, email, password} = JSON.parse(msg.content.toString());
        if (!name || !email || !password) {
            console.error("Invalid message data:", {name, email, password});
            channel.ack(msg);
            return;
        }

        const redisClient = getRedisClient();
        // Check Redis cache for duplicate prevention
        if (await redisClient.get(email)) return channel.ack(msg);

        // Set a temporary flag in Redis to prevent duplicate processing
        await redisClient.set(email, "processing", {EX: 10});

        const hashedPassword = await bcrypt.hash(password, 10);

        batch.push({
            name,
            email,
            password: hashedPassword
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
        await User.insertMany(batch, {ordered: false});
        console.log(`Inserted ${batch.length} users`);

        // Clean up Redis keys for processed emails
        const redisClient = getRedisClient();
        for (const user of batch) {
            await redisClient.del(user.email);
        }
    } catch (error) {
        console.error("Batch insert error:", error);
    }
    batch.length = 0;
}


export const authConsumer = async (): Promise<void> => {
    const channel = await connectRabbitMQ();
    await processSignups(channel);
    setInterval(insertBatch, 10000); // Process any remaining batch users every 10 sec
};
