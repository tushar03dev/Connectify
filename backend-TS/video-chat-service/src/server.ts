import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import bodyParser from "body-parser";
import connectDB from "./config/db";
import roomRoutes from "./routes/roomRoutes";
import {setupSocketIO} from "./socket.js";


dotenv.config();

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});

// Initialize your socket logic
setupSocketIO(io);

// Database Connection
connectDB();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use("/rooms", roomRoutes);

// Start Server
const PORT = process.env.PORT || 5200;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
