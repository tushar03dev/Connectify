import dotenv from "dotenv";
import connectDB from "./config/db.js";
import otpRoutes from "./routes/otpRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import roomRoutes from "./routes/roomRoutes.js";
import {createServer} from "http";
import { Server } from "socket.io";
import express from 'express';
import cors from 'cors';
import bodyParser from "body-parser";
import multer from "multer";
dotenv.config(); // Load environment variables from .env file

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const server = createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

// Middleware to handle form-data
const upload = multer();

// Middleware to parse form-data
app.use(upload.none());

// Connect to MongoDB, then start the server
connectDB();

// Use the auth routes
app.use('/auth', authRoutes); // Mounts the auth routes

// Use the auth routes
app.use('/otp',otpRoutes); // Mounts the auth routes

// use the room routes
app.use('/rooms', roomRoutes); // Mount the room routes

// Start the server
const PORT = process.env.PORT || 5200;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

