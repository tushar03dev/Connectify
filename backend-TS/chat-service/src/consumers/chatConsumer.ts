import amqp from "amqplib";
import { Room } from "../models/roomModel";
import dotenv from "dotenv";

dotenv.config();
const RABBITMQ_URL = process.env.RABBITMQ_URL as string;

const BATCH_SIZE = 50; // Number of messages processed at once
const messageBatch: any[] = [];

async function connectRabbitMQ() {
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();
    await channel.assertQueue("chatQueue", { durable: true });
    return channel;
}

async function processMessages(channel: amqp.Channel) {
    await channel.consume("chatQueue", async (msg) => {
        if (!msg) {
            console.error("No message received in chatQueue");
            return;
        }

        const messageContent = JSON.parse(msg.content.toString());
        messageBatch.push(messageContent);
        channel.ack(msg);

        if (messageBatch.length >= BATCH_SIZE) {
            await insertBatch();
        }
    });
}

async function insertBatch() {
    if (messageBatch.length === 0) return;

    try {
        console.log(`[Batch Processor] Saving ${messageBatch.length} messages to DB...`);
        const groupedMessages: { [key: string]: any[] } = {};

        // Group messages by roomId
        messageBatch.forEach((msg) => {
            if (!groupedMessages[msg.roomId]) {
                groupedMessages[msg.roomId] = [];
            }
            groupedMessages[msg.roomId].push({
                sender: msg.sender,
                timestamps: msg.timestamps, // Ensure correct property name
                dataType: msg.dataType,
                encryptedContent: msg.encryptedContent,
                iv: msg.iv,
                ...(msg.dataType !== "text" ? { tag: msg.tag } : {}), // Add tag if not text
                readBy: [], // Default empty array
            });
        });

        // Save all messages to their respective rooms
        for (const roomId in groupedMessages) {
            await Room.findOneAndUpdate(
                { _id: roomId }, // Use _id instead of roomId
                { $push: { chats: { $each: groupedMessages[roomId] } } },
                { upsert: true, new: true }
            );
        }

        console.log(`[Batch Processor] Successfully saved ${messageBatch.length} messages.`);
    } catch (error) {
        console.error("[Batch Processor] Batch insert error:", error);
    }

    messageBatch.length = 0; // Clear the batch after processing
}


export const chatConsumer = async (): Promise<void> => {
    const channel = await connectRabbitMQ();
    await processMessages(channel);
    setInterval(insertBatch, 1000); // Process any remaining messages every 1 sec
};
