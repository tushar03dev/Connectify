import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { Room } from "./models/roomModel";
import mongoose from "mongoose";

interface AuthenticatedSocket extends Socket {
    userId?: string;
    userName?: string;
}

interface JoinRoomPayload {
    roomId: string;
}

interface MessagePayload {
    roomId: string;
    message: string;
}

interface VideoSelectedPayload {
    roomId: string;
    videoUrl: string;
}

interface VidStatePayload {
    roomId: string;
    isPlaying: boolean;
    videoUrl: string;
    currentTime: number;
}

interface ProgressBarClickedPayload {
    roomId: string;
    newTime: number;
    videoUrl: string;
}

export const setupSocketIO = (io: Server) => {
    // Middleware: verify JWT
    io.use((socket: AuthenticatedSocket, next) => {
        const token = socket.handshake.auth?.token;
        if (!token) return next(new Error("Authentication error"));

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as jwt.JwtPayload;
            socket.userId = decoded.userId;
            socket.userName = decoded.userName;
            next();
        } catch (err) {
            return next(new Error("Authentication error"));
        }
    });

    io.on("connection", (socket: AuthenticatedSocket) => {
        console.log("A user connected:", socket.userId);

        socket.on("joinRoom", async ({ roomId }: JoinRoomPayload) => {
            const userId = socket.userId;
            if (!userId) return;

            let room = await Room.findOne({ code: roomId });

            if (!room) {
                room = new Room({ code: roomId, members: [new mongoose.Types.ObjectId(userId)] });
            } else {
                if (Array.isArray(room.members)) {
                    const userObjectId = new mongoose.Types.ObjectId(userId);
                    if (!room.members.some(id => id.equals(userObjectId))) {
                        room.members.push(userObjectId);
                    }
                } else {
                    // fallback in case room.members is undefined or corrupted
                    room.members = [new mongoose.Types.ObjectId(userId)];
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

        socket.on("sendMessage", ({ roomId, message }: MessagePayload) => {
            if (!roomId || !message) return;

            io.to(roomId).emit("receiveMessage", {
                userName: socket.userName || "User",
                message,
            });
        });

        socket.on("leaveRoom", async ({ roomId }: JoinRoomPayload) => {
            const userId = socket.userId;
            if (!userId) return;

            const room = await Room.findOne({ code: roomId });

            if (room) {
                if (Array.isArray(room.members)) {
                    room.members = room.members.filter((u) => u.toString() !== userId);
                    await room.save();

                    socket.leave(roomId);
                    io.to(roomId).emit("roomUsers", room.members);
                    io.to(roomId).emit("message", {
                        userName: socket.userName || "User",
                        message: `${socket.userName || "A user"} has left the room.`,
                    });
                }
            }
        });

        socket.on("video-selected", ({ roomId, videoUrl }: VideoSelectedPayload) => {
            if (roomId && videoUrl) {
                io.to(roomId).emit("video-selected", { videoUrl });
            } else {
                console.error("Invalid video-selected payload:", { roomId, videoUrl });
            }
        });

        socket.on("vid-state", ({ roomId, isPlaying, videoUrl, currentTime }: VidStatePayload) => {
            if (roomId && videoUrl) {
                io.to(roomId).emit("vid-state", { isPlaying, videoUrl, currentTime });
            } else {
                console.error("Invalid vid-state payload:", { roomId, isPlaying, videoUrl, currentTime });
            }
        });

        socket.on("progress-bar-clicked", ({ roomId, newTime, videoUrl }: ProgressBarClickedPayload) => {
            if (roomId && videoUrl) {
                io.to(roomId).emit("progress-bar-clicked", { newTime, videoUrl });
            } else {
                console.error("Invalid progress-bar-clicked payload:", { roomId, newTime, videoUrl });
            }
        });

        socket.on("disconnect", () => {
            console.log("User disconnected:", socket.id);
        });
    });
};
