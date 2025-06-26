import { createClient } from 'redis';
import dotenv from "dotenv";

dotenv.config();

const REDIS_URL = process.env.REDIS_URL

export const connectRedis = async () => {
    let attempts = 10;
    while (attempts > 0) {
        try {
            const client = createClient({ url: REDIS_URL });
            client.on('error', err => console.error('Redis Client Error', err));
            await client.connect();
            console.log('Connected to Redis');
            return client;
        } catch (err) {
            console.log(`Redis connection failed. Retrying in 3s... (${11 - attempts}/10)`);
            attempts--;
            await new Promise(res => setTimeout(res, 3000));
        }
    }
    throw new Error('Failed to connect to Redis after 10 attempts');
};
