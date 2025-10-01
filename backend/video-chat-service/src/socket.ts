import { Server, Socket } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import createClient from "ioredis";
import jwt from "jsonwebtoken";
import { Room } from "./models/roomModel";
import { User } from "./models/userModel";
import mongoose from "mongoose";
import dotenv from "dotenv";
const env = process.env.NODE_ENV;
dotenv.config({ path: `.env.${env}` });

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

export const setupSocketIO = async (io: Server) => {
    console.debug("Setting up Socket.IO server");

    // 🔥 Connect to Redis
    const pubClient = new createClient({host: "redis", port: 6379});
    const subClient = new createClient({host: "redis", port: 6379});

    await pubClient.connect();
    await subClient.connect();

    io.adapter(createAdapter(pubClient, subClient));

    io.use((socket: AuthenticatedSocket, next) => {
        console.debug("Authenticating socket connection", { socketId: socket.id });
        const token = socket.handshake.auth?.token;
        if (!token) {
            console.error('No token provided for socket', { socketId: socket.id });
            return next(new Error("Authentication error"));
        }

        try {
            console.debug("Verifying JWT token");
            const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as jwt.JwtPayload;
            socket.email = decoded.email;
            socket.userName = decoded.email || "User";
            console.debug("JWT verification successful", { email: decoded.email });
            next();
        } catch (err) {
            console.error("JWT verification failed:", { error: err, socketId: socket.id });
            return next(new Error("Authentication error"));
        }
    });

    io.on("connection", async (socket: AuthenticatedSocket) => {
        console.debug("New socket connection established", { socketId: socket.id, email: socket.email });

        const email = socket.email;
        if (!email) {
            console.error("No email found in socket", { socketId: socket.id });
            return;
        }

        console.debug("Looking up user in database", { email });
        const user = await User.findOne({ email });
        if (!user) {
            console.error("User not found for email", { email, socketId: socket.id });
            return;
        }

        console.debug("User found", { userId: user._id, email });
        const userObjectId = user._id instanceof mongoose.Types.ObjectId
            ? user._id
            : new mongoose.Types.ObjectId(user._id as string);
        console.debug("Converted user ID to ObjectId", { userObjectId });

        socket.on("joinRoom", async ({ roomId }: JoinRoomPayload) => {
            console.debug("joinRoom event received", { roomId, socketId: socket.id });
            try {
                if (!roomId) {
                    console.error("Invalid roomId", { roomId, socketId: socket.id });
                    socket.emit("joinRoomResponse", { success: false, error: "Invalid roomId" });
                    return;
                }
                console.debug("Looking up room in database", { roomId });
                let room = await Room.findOne({ code: roomId });
                if (!room) {
                    console.debug("Room not found, creating new room", { roomId });
                    room = new Room({ code: roomId, members: [userObjectId] });
                } else {
                    console.debug("Room found", { roomId, members: room.members });
                    if (Array.isArray(room.members)) {
                        if (!room.members.some(member => member.equals(userObjectId))) {
                            console.debug("Adding user to room members", { userObjectId });
                            room.members.push(userObjectId);
                        } else {
                            console.debug("User already in room members", { userObjectId });
                        }
                    }
                }
                console.debug("Saving room to database", { roomId });
                await room.save();
                console.debug("Joining socket to room", { roomId, socketId: socket.id });
                socket.join(roomId);
                const socketsInRoom = await io.in(roomId).allSockets();
                console.debug("Sockets in room after join", { roomId, sockets: Array.from(socketsInRoom) });
                console.debug("Emitting roomUsers event", { roomId, members: room.members });
                io.to(roomId).emit("roomUsers", room.members);
                console.debug("Emitting join message", { roomId, userName: socket.userName });
                io.to(roomId).emit("message", {
                    userName: socket.userName || "User",
                    message: `${socket.userName || "A user"} has joined the room.`,
                });
                console.debug("Emitting joinRoomResponse", { roomId, success: true });
                socket.emit("joinRoomResponse", { success: true, roomId });
            } catch (error: unknown) {
                const err = error as Error;
                console.error("Join room error", { roomId, error: err.message, stack: err.stack, socketId: socket.id });
                socket.emit("joinRoomResponse", { success: false, error: "Failed to join room: " + err.message });
            }
        });

        socket.on("sendMessage", ({ roomId, message }: MessagePayload) => {
            console.debug("sendMessage event received", { roomId, message });
            if (!roomId || !message) {
                console.error("Invalid message payload", { roomId, message, socketId: socket.id });
                return;
            }
            io.to(roomId).emit("receiveMessage", {
                id: message.id,
                userName: message.user|| "User",
                text: message.text,
                timestamp: message.timestamp,
            });
            io.in(roomId).allSockets().then(sockets => {
                console.debug("Emitted receiveMessage to sockets", { roomId, sockets: Array.from(sockets) });
            });
        });

        socket.on("leaveRoom", async ({ roomId }: JoinRoomPayload) => {
            console.debug("leaveRoom event received", { roomId, socketId: socket.id });
            console.debug("Looking up room in database", { roomId });
            const room = await Room.findOne({ code: roomId });

            if (room) {
                console.debug("Room found", { roomId, members: room.members });
                if (Array.isArray(room.members)) {
                    console.debug("Removing user from room members", { userObjectId });
                    room.members = room.members.filter((member) => !member.equals(userObjectId));
                    console.debug("Saving updated room", { roomId });
                    await room.save();

                    console.debug("Socket leaving room", { roomId, socketId: socket.id });
                    socket.leave(roomId);
                    console.debug("Emitting roomUsers event", { roomId, members: room.members });
                    io.to(roomId).emit("roomUsers", room.members);
                    console.debug("Emitting leave message", { roomId, userName: socket.userName });
                    io.to(roomId).emit("message", {
                        userName: socket.userName || "User",
                        message: `${socket.userName || "A user"} has left the room.`,
                    });
                }
            } else {
                console.debug("Room not found for leaveRoom", { roomId });
            }
        });

        // socket.on("videoUploaded", async ({ roomId }: VideoUploadedPayload) => {
        //     console.debug("videoUploaded event received", { roomId, socketId: socket.id });
        //     if (!roomId) {
        //         console.error("Invalid roomId for videoUploaded", { roomId, socketId: socket.id });
        //         return;
        //     }
        //     try {
        //         console.debug("Looking up room by code", { roomId });
        //         const room = await Room.findOne({ code: roomId });
        //         if (!room) {
        //             console.error("Room not found", { roomId, socketId: socket.id });
        //             return;
        //         }
        //         console.debug("Fetching videos for room", { roomId, roomObjectId: room._id });
        //         const videos = await Video.find({ roomId: room._id });
        //         console.debug("Videos found", { roomId, videoCount: videos.length });
        //         io.to(roomId).emit("videoListUpdated", { roomId });
        //         console.debug("Emitted videoListUpdated to room", { roomId });
        //     } catch (error: unknown) {
        //         const err = error as Error;
        //         console.error("Error handling videoUploaded", {
        //             roomId,
        //             error: err.message,
        //             stack: err.stack,
        //             socketId: socket.id,
        //         });
        //     }
        // });

        // socket.on("request-video-state", async ({ roomId }: { roomId: string }) => {
        //     console.debug("request-video-state event received", { roomId, socketId: socket.id });
        //     try {
        //         console.debug("Looking up room for video state", { roomId });
        //         const room = await Room.findOne({ code: roomId });
        //
        //         if (room && room.currentVideo) {
        //             console.debug("Room and current video found", { roomId, videoId: room.currentVideo.videoId });
        //             const video = await Video.findById(room.currentVideo.videoId);
        //             if (video) {
        //                 console.debug("Video found, generating URL", { videoId: video._id });
        //                 const videoUrl = await getObjectURL(video.filePath);
        //
        //                 console.debug("Emitting vid-state event", { roomId, isPlaying: room.currentVideo.isPlaying });
        //                 socket.emit("vid-state", {
        //                     roomId,
        //                     isPlaying: room.currentVideo.isPlaying,
        //                     videoUrl,
        //                     currentTime: room.currentVideo.currentTime,
        //                     serverTimestamp: Date.now(),
        //                 });
        //             } else {
        //                 console.debug("Video not found", { videoId: room.currentVideo.videoId });
        //             }
        //         } else {
        //             console.debug("Room or current video not found", { roomId });
        //         }
        //     } catch (error) {
        //         console.error("Error fetching video state", { roomId, error, socketId: socket.id });
        //     }
        // });

        // socket.on("refresh-url", async ({ roomId, videoId }: { roomId: string; videoId: string }) => {
        //     console.debug("refresh-url event received", { roomId, videoId, socketId: socket.id });
        //     if (!roomId || !videoId) {
        //         console.error("Invalid refresh-url payload", { roomId, videoId, socketId: socket.id });
        //         return;
        //     }
        //
        //     try {
        //         console.debug("Looking up video", { videoId });
        //         const video = await Video.findById(videoId);
        //         if (!video) {
        //             console.debug("Video not found", { videoId });
        //             return;
        //         }
        //
        //         console.debug("Generating new video URL", { videoId });
        //         const newUrl = await getObjectURL(video.filePath);
        //         console.debug("Emitting refresh-url event", { roomId, videoId, newUrl });
        //         io.to(roomId).emit("refresh-url", { roomId, videoId, newUrl });
        //     } catch (error) {
        //         console.error("Error refreshing video URL", { roomId, videoId, error, socketId: socket.id });
        //     }
        // });

        socket.on("video-selected", ({ roomId, videoUrl }: VideoSelectedPayload) => {
            console.debug("video-selected event received", { roomId, videoUrl, socketId: socket.id });
            if (roomId && videoUrl) {
                console.debug("Emitting video-selected event", { roomId, videoUrl });
                io.to(roomId).emit("video-selected", { videoUrl });
            } else {
                console.error("Invalid video-selected payload", { roomId, videoUrl, socketId: socket.id });
            }
        });

        socket.on("vid-state", ({ roomId, isPlaying, videoUrl, currentTime }: VidStatePayload) => {
            console.debug("vid-state event received", { roomId, isPlaying, videoUrl, currentTime, socketId: socket.id });
            if (roomId && videoUrl) {
                console.debug("Emitting vid-state event", { roomId, isPlaying, videoUrl, currentTime });
                io.to(roomId).emit("vid-state", { isPlaying, videoUrl, currentTime });
            } else {
                console.error("Invalid vid-state payload", { roomId, isPlaying, videoUrl, currentTime, socketId: socket.id });
            }
        });

        socket.on("progress-bar-clicked", ({ roomId, newTime, videoUrl }: ProgressBarClickedPayload) => {
            console.debug("progress-bar-clicked event received", { roomId, newTime, videoUrl, socketId: socket.id });
            if (roomId && videoUrl) {
                console.debug("Emitting progress-bar-clicked event", { roomId, newTime, videoUrl });
                io.to(roomId).emit("progress-bar-clicked", { newTime, videoUrl });
            } else {
                console.error("Invalid progress-bar-clicked payload", { roomId, newTime, videoUrl, socketId: socket.id });
            }
        });

        socket.on("disconnect", () => {
            console.debug("User disconnected", { socketId: socket.id, email: socket.email });
        });
    });
};