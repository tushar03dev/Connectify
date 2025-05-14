import { v4 as uuidv4 } from "uuid";
import { connectRabbitMQ } from "./rabbitmq";

const pendingResponses = new Map<string, (data: any) => void>();

export async function sendRPCRequest(queueName: string, payload: any, timeoutMs = 5000): Promise<any> {
    const channel = await connectRabbitMQ();
    const correlationId = uuidv4();
    const replyQueue = "apigateway-responses";

    // Ensure replyQueue exists
    await channel.assertQueue(replyQueue, { durable: false });

    // Send the request
    channel.sendToQueue(queueName, Buffer.from(JSON.stringify(payload)), {
        replyTo: replyQueue,
        correlationId,
        persistent: true,
    });

    // Return a Promise that resolves when reply comes or rejects on timeout
    return new Promise((resolve, reject) => {
        pendingResponses.set(correlationId, resolve);

        // Timeout handler
        setTimeout(() => {
            if (pendingResponses.has(correlationId)) {
                pendingResponses.delete(correlationId);
                reject(new Error("Timeout: No response received."));
            }
        }, timeoutMs);
    });
}

// Consume from replyQueue
async function ReplyConsumer() {
    const channel = await connectRabbitMQ();
    const replyQueue = "apigateway-responses";

    await channel.assertQueue(replyQueue, { durable: false });

    channel.consume(replyQueue, (msg) => {
        if (msg !== null) {
            const correlationId = msg.properties.correlationId;
            const content = JSON.parse(msg.content.toString());

            const resolver = pendingResponses.get(correlationId);
            if (resolver) {
                resolver(content);
                pendingResponses.delete(correlationId);
            }
            channel.ack(msg);
        }
    });

    console.log(`Listening for replies on ${replyQueue}`);
}

ReplyConsumer();
