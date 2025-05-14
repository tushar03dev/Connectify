import amqp from "amqplib";
import dotenv from "dotenv";

dotenv.config();

const RABBITMQ_URL = process.env.RABBITMQ_URL as string;

let connection: amqp.Connection | null = null;
let channel: amqp.Channel | null = null;
let isConnecting = false;

async function createConnection(): Promise<void> {
    if (isConnecting) return; // Prevent multiple simultaneous connects
    isConnecting = true;

    try {
        connection = await amqp.connect(RABBITMQ_URL);
        channel = await connection.createChannel();

        console.log("Connected to RabbitMQ");

        // Handle connection close
        connection.on("close", async () => {
            console.error("RabbitMQ connection closed. Reconnecting...");
            await reconnect();
        });

        // Handle connection error
        connection.on("error", async (err) => {
            console.error("RabbitMQ connection error:", err);
            await reconnect();
        });

    } catch (error) {
        console.error("Initial RabbitMQ connection failed. Retrying in 5 seconds...");
        setTimeout(() => createConnection(), 5000);
    } finally {
        isConnecting = false;
    }
}

async function reconnect(): Promise<void> {
    connection = null;
    channel = null;
    await createConnection();
}

export async function connectRabbitMQ(): Promise<amqp.Channel> {
    if (!channel) {
        await createConnection();
    }
    return channel as amqp.Channel;
}
