import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { Room } from "./models/roomModel";
import mongoose from "mongoose";
import { User } from "./models/userModel";
import { Video } from "./models/videoModel"; // Assuming Video model exists
import { getObjectURL } from "./s3Utils"; // Assuming getObjectURL is in a utils file

interface AuthenticatedSocket extends Socket {
    email?: string;
    userName?: string;
}

interface JoinRoomPayload {
    roomId: string;
}

interface MessagePayload {
    roomId: string;
    message: {
        id: string;
        user: string;
        text: string;
        timestamp: Date | string;
    };
}

interface VideoSelectedPayload {
    roomId: string;
    videoUrl: string;
    videoId: string; // Added to identify video for refresh
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

interface RefreshUrlPayload {
    roomId: string;
    videoId: string;
    newUrl: string;
}

export const setupSocketIO = (io: Server) => {
    io.use((socket: AuthenticatedSocket, next) => {
        const token = socket.handshake.auth?.token;
        console.log('Token received:', token);
        if (!token) {
            console.error('No token provided');
            return next(new Error("Authentication error"));
        }
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as jwt.JwtPayload;
            console.log('Decoded JWT:', decoded);
            socket.email = decoded.email;
            socket.userName = decoded.email || "User";
            next();
        } catch (err) {
            console.error('JWT verification failed:', err);
            return next(new Error("Authentication error"));
        }
    });

    io.on("connection", async (socket: AuthenticatedSocket) => {
        console.log("A user connected:", socket.email, socket.id);

        const email = socket.email;
        if (!email) {
            console.error('No email found in socket token payload');
            return;
        }

        const user = await User.findOne({ email });
        if (!user) {
            console.error('No user found');
            return;
        }

        socket.on("joinRoom", async ({ roomId }: JoinRoomPayload) => {
            try {
                let room = await Room.findOne({ code: roomId });
                if (!room) {
                    room = new Room({ code: roomId, members: [new mongoose.Types.ObjectId(user._id as mongoose.Types.ObjectId)] });
                } else {
                    if (Array.isArray(room.members)) {
                        const userObjectId = new mongoose.Types.ObjectId(user._id as mongoose.Types.ObjectId);
                        if (!room.members.some(id => id.equals(userObjectId))) {
                            room.members.push(userObjectId);
                        }
                    } else {
                        room.members = [new mongoose.Types.ObjectId(user._id as mongoose.Types.ObjectId)];
                    }
                }
                await room.save();
                socket.join(roomId);
                io.to(roomId).emit("roomUsers", room.members);
                io.to(roomId).emit("message", {
                    userName: socket.userName || "User",
                    message: `${socket.userName || "A user"} has joined the room.`,
                });
                socket.emit("joinRoomResponse", { success: true, roomId });
            } catch (error) {
                console.error("Join room error:", error);
                socket.emit("joinRoomResponse", { success: false, error: "Failed to join room" });
            }
        });

        socket.on("sendMessage", ({ roomId, message }: MessagePayload) => {
            if (!roomId || !message) {
                console.error("Invalid sendMessage payload:", { roomId, message });
                return;
            }
            console.log("Received sendMessage:", { roomId, message });
            io.to(roomId).emit("receiveMessage", {
                userName: socket.userName || "User",
                message: {
                    id: message.id,
                    text: message.text,
                    timestamp: message.timestamp,
                },
            });
        });

        socket.on("leaveRoom", async ({ roomId }: JoinRoomPayload) => {
            const room = await Room.findOne({ code: roomId });
            if (room && Array.isArray(room.members)) {
                room.members = room.members.filter((u) => u.toString() !== user._id);
                await room.save();
                socket.leave(roomId);
                io.to(roomId).emit("roomUsers", room.members);
                io.to(roomId).emit("message", {
                    userName: socket.userName || "User",
                    message: `${socket.userName || "A user"} has left the room.`,
                });
            }
        });

        socket.on("video-selected", async ({ roomId, videoUrl, videoId }: VideoSelectedPayload) => {
            if (!roomId || !videoUrl || !videoId) {
                console.error("Invalid video-selected payload:", { roomId, videoUrl, videoId });
                return;
            }
            try {
                const video = await Video.findById(videoId);
                if (!video) {
                    console.error("Video not found:", videoId);
                    return;
                }
                const freshUrl = await getObjectURL(video.filePath); // Refresh URL
                io.to(roomId).emit("video-selected", { videoUrl: freshUrl, videoId });
            } catch (error) {
                console.error("Error validating video:", error);
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

        socket.on("refresh-url", async ({ roomId, videoId }: { roomId: string; videoId: string }) => {
            if (!roomId || !videoId) {
                console.error("Invalid refresh-url payload:", { roomId, videoId });
                return;
            }
            try {
                const video = await Video.findById(videoId);
                if (!video) {
                    console.error("Video not found:", videoId);
                    return;
                }
                const newUrl = await getObjectURL(video.filePath);
                io.to(roomId).emit("refresh-url", { roomId, videoId, newUrl });
            } catch (error) {
                console.error("Error refreshing URL:", error);
            }
        });

        socket.on("disconnect", () => {
            console.log("User disconnected:", socket.id);
        });
    });
};