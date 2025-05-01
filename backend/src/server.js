import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import bodyParser from "body-parser";
import multer from "multer";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import otpRoutes from "./routes/otpRoutes.js";
import roomRoutes from "./routes/roomRoutes.js";
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
const upload = multer();
app.use(upload.none());

// Routes
app.use("/auth", authRoutes);
app.use("/otp", otpRoutes);
app.use("/rooms", roomRoutes);
app.use('/video', videoRoutes);

// Start Server
const PORT = process.env.PORT || 5200;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
