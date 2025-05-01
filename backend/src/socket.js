import jwt from "jsonwebtoken";
import { Room } from "./models/roomModel.js";

export const setupSocketIO = (io) => {
    // Middleware: verify JWT
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token;
        if (!token) return next(new Error("Authentication error"));

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log("decoded", decoded);
            socket.userId = decoded.userId;
            socket.userName = decoded.userName;
            next();
        } catch (err) {
            return next(new Error("Authentication error"));
        }
    });

    io.on("connection", (socket) => {
        console.log("A user connected:", socket.userId);

        socket.on("joinRoom", async ({ roomId }) => {
            const userId = socket.userId;

            let room = await Room.findOne({ code: roomId });

            if (!room) {
                room = new Room({ code: roomId, members: [userId] });
            } else {
                if (!room.members.includes(userId)) {
                    room.members.push(userId);
                }
            }

            await room.save();
            socket.join(roomId);

            io.to(roomId).emit("roomUsers", room.members);
            io.to(roomId).emit("message", {
                userName: socket.userName || "User",
                message: `${socket.userName || "A user"} has joined the room.`,
            });
        });

        socket.on("sendMessage", ({ roomId, message }) => {
            if (!roomId || !message) return; // Avoid errors

            console.log("Message received in room:", roomId, message);

            io.to(roomId).emit("receiveMessage", {
                userName: socket.userName || "User",
                message,
            });
        });

        socket.on("leaveRoom", async ({ roomId }) => {
            const userId = socket.userId;
            const room = await Room.findOne({ code: roomId });

            if (room) {
                room.members = room.members.filter((u) => u !== userId);
                await room.save();

                socket.leave(roomId);
                io.to(roomId).emit("roomUsers", room.members);
                io.to(roomId).emit("message", {
                    userName: socket.userName || "User",
                    message: `${socket.userName || "A user"} has left the room.`,
                });
            }
        });

        socket.on('video-selected', ({ roomId, videoUrl }) => {
            if (roomId && videoUrl) {
                io.to(roomId).emit('video-selected', { videoUrl });
            } else {
                console.error('Invalid video-selected payload:', { roomId, videoUrl });
            }
        });

        socket.on('vid-state', ({ roomId, isPlaying, videoUrl, currentTime }) => {
            if (roomId && typeof isPlaying === 'boolean' && videoUrl && typeof currentTime === 'number') {
                io.to(roomId).emit('vid-state', { isPlaying, videoUrl, currentTime });
            } else {
                console.error('Invalid vid-state payload:', { roomId, isPlaying, videoUrl, currentTime });
            }
        });

        socket.on('progress-bar-clicked', ({ roomId, newTime, videoUrl }) => {
            if (roomId && typeof newTime === 'number' && videoUrl) {
                io.to(roomId).emit('progress-bar-clicked', { newTime, videoUrl });
            } else {
                console.error('Invalid progress-bar-clicked payload:', { roomId, newTime, videoUrl });
            }
        });

        socket.on("disconnect", () => {
            console.log("User disconnected:", socket.id);
            // Optional cleanup
        });
    });
};
