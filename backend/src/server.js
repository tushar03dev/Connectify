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
import { setupSocketIO } from "./controllers/roomController.js";  // Import WebSocket logic

dotenv.config();

const app = express();
const server = http.createServer(app);  // ✅ Attach Express to HTTP Server

const io = new Server(server, {
    cors: { origin: "*" },
    transports: ["websocket", "polling"],  // ✅ Ensure correct transport
});

// ✅ Setup WebSocket Properly
setupSocketIO(io);

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const upload = multer();
app.use(upload.none());

// Database Connection
connectDB();

// Routes
app.use("/auth", authRoutes);
app.use("/otp", otpRoutes);
app.use("/rooms", roomRoutes);

// ✅ Keep a basic route to verify HTTP works
app.get("/", (req, res) => {
    res.send("WebSocket Server Running");
});

// ✅ Handle WebSocket Connection Directly
io.on("connection", (socket) => {
    console.log("New WebSocket Connection:", socket.id);

    socket.on("joinRoom", ({ roomId, username }) => {
        console.log(`${username} joined room: ${roomId}`);
        socket.join(roomId);
        io.to(roomId).emit("roomUsers", { message: `${username} joined!` });
    });

    socket.on("disconnect", () => {
        console.log("User Disconnected:", socket.id);
    });
});

// Start Server
const PORT = process.env.PORT || 5200;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
