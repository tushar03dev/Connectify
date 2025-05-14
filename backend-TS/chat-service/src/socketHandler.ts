import { Server } from "socket.io";
import http from "http";
import { createClient } from "redis";
import { createAdapter } from "@socket.io/redis-adapter";
import dotenv from "dotenv";

dotenv.config();

const API_GATEWAY_URL = process.env.API_GATEWAY_URL as string;
const SOCKET_PORT = process.env.SOCKET_PORT as string;
const REDIS_URL = process.env.REDIS_URL as string;

export const activeUsers = new Map<string, string>(); // Maps userId -> socketId
const server = http.createServer();

export const io = new Server(server, {
    cors: { origin: `${API_GATEWAY_URL}` },
});

const pubClient = createClient({ url:`${REDIS_URL}` });
const subClient = pubClient.duplicate();

Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
    io.adapter(createAdapter(pubClient, subClient));
    console.log("WebSocket server started with Redis Adapter.");
});

export function startSocketServer() {
    io.on("connection", (socket) => {
        console.log(`Socket connected: ${socket.id}`);

        socket.on("connectUser", ({ userId }) => {
            console.log(`User ${userId} authenticated with socket ${socket.id}`);

            activeUsers.set(userId, socket.id);
            socket.join(userId);

            socket.emit("authenticated", { success: true });
        });

        socket.on("disconnect", () => {
            console.log(`Socket disconnected: ${socket.id}`);
            activeUsers.forEach((value, key) => {
                if (value === socket.id) {
                    activeUsers.delete(key);
                }
            });
        });
    });

    server.listen(SOCKET_PORT, () => {
        console.log(`WebSocket server running on port ${SOCKET_PORT}`);
    });
}
