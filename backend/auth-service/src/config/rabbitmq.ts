import amqp from 'amqplib';
import dotenv from 'dotenv';

const env = process.env.NODE_ENV;
dotenv.config({ path: `.env.${env}` });

const RABBITMQ_URL = process.env.RABBITMQ_URL as string;
console.log('RABBITMQ_URL used in auth-service:', RABBITMQ_URL);

let connection: amqp.Connection | null = null;
let channel: amqp.Channel | null = null;

async function setupRabbitMQ(): Promise<amqp.Channel> {
    if (!connection) {
        let attempts = 10;
        while (attempts > 0) {
            try {
                connection = await amqp.connect(RABBITMQ_URL);
                channel = await connection.createChannel();
                console.log('RabbitMQ Connected & Channel Created for Auth Service');
                return channel;
            } catch (err) {
                console.log(`RabbitMQ connection failed. Retrying in 3s... (${11 - attempts}/10)`);
                attempts--;
                await new Promise((res) => setTimeout(res, 3000));
            }
        }
        throw new Error('Failed to connect to RabbitMQ after 10 attempts');
    }

    if (!channel) {
        channel = await connection.createChannel();
    }

    return channel;
}

export async function publishToQueue(queue: string, message: object): Promise<void> {
    try {
        console.log(`Publishing to queue: ${queue}`);
        if (!channel) {
            channel = await setupRabbitMQ();
        }

        await channel.assertQueue(queue, { durable: true });
        channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)));
        console.log(`Sent message to ${queue}:`, message);
    } catch (error) {
        console.error('RabbitMQ Publish Error for Auth Service:', error);
        throw error;
    }
}

export { connection, channel };
