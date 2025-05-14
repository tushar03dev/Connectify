import express from "express";
import { createServer } from "http";
import { startSocketServer } from "./socketHandler";
import connectDB from "./config/db";
import chatRoutes from "./routes/chatRoutes";
import dotenv from "dotenv";
import multer from "multer";
import {chatConsumer} from "./consumers/chatConsumer";
import adminRoutes from "./routes/adminRoutes";
import socketRoutes from "./routes/socketRoutes";

dotenv.config();
const app = express();
const server = createServer(app); // Create an HTTP server

// Setup WebSocket and RabbitMQ consumer
connectDB().then(() => {
    chatConsumer();
    startSocketServer();
});

// Middleware
app.use(express.json());

// Middleware to handle form-data
const upload = multer();
app.use(upload.none());

app.use('/admin',adminRoutes);
app.use('/chat', chatRoutes);
app.use("/socket", socketRoutes);

server.listen(process.env.PORT, () => {
    console.log(`Chat Server running on http://localhost:${process.env.PORT}`);
});
