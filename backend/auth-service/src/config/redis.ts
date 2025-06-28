import {createClient, RedisClientType} from 'redis';
import dotenv from "dotenv";
const env = process.env.NODE_ENV;
dotenv.config({ path: `.env.${env}` });

const REDIS_URL = process.env.REDIS_URL

let redisClient : RedisClientType;

export const connectRedis = async (): Promise<void> => {
    let attempts = 10;
    while (attempts > 0) {
        try {
            redisClient = createClient({ url: REDIS_URL });
            redisClient.on('error', err => console.error('Redis Client Error', err));
            await redisClient.connect();
            console.log('Connected to Redis');
            return;
        } catch (err) {
            console.log(`Redis connection failed. Retrying in 3s... (${11 - attempts}/10)`);
            attempts--;
            await new Promise(res => setTimeout(res, 3000));
        }
    }
    throw new Error('Failed to connect to Redis after 10 attempts');
};

export const getRedisClient = (): RedisClientType => {
    if (!redisClient) throw new Error('Redis client is not connected yet!');
    return redisClient;
};
