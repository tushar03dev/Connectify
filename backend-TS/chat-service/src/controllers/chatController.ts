import {Request, Response, NextFunction} from "express";
import fs from "fs";
import {Room} from "../models/roomModel";
import {publishToQueue} from "../config/rabbitmq"; // RabbitMQ publisher
import {decryptText, encryptText} from "../utils/textEncryption";
import {encryptMedia, encryptAudio, decryptAudio, decryptMedia} from "../utils/avEncryption";
import {decryptImage, encryptImage} from "../utils/imageEncryption";
import mongoose from "mongoose";
import {activeUsers, io} from "../socketHandler";
import axios from "axios";
import {IUser, User} from "../models/userModel";

const API_GATEWAY_URL = process.env.API_GATEWAY_URL as string;

export const saveMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {

        // Extract user email from headers
        const userEmail = req.headers["user-id"];
        if (!userEmail || typeof userEmail !== "string") {
            res.status(400).send({success: false, error: "Unauthorized: Email not provided."});
            return;
        }

        // Fetch sender (user) ID from the database using email
        const user = await User.findOne({email: userEmail}) as IUser;
        if (!user) {
            res.status(404).send({success: false, error: "User not found."});
            return;
        }

        const userId = user._id;

        const {receiverId: receiverEmail, roomId, type, data} = req.body;

        if (!data) {
            res.status(400).send("No message found!");
            return;
        }

        // Fetch receiver ID using email
        const receiver = await User.findOne({email: receiverEmail});
        if (!receiver) {
            res.status(404).send({success: false, error: "Receiver not found."});
            return;
        }
        const receiverId = receiver._id; // MongoDB ID of receiver

        let room;

        // **🔹 Handle First DM Message: Check if DM Room Exists or Create One**
        if (!roomId && receiverId) {
            room = await Room.findOne({
                members: {$all: [userId, receiverId]},
                isGroup: false
            });

            if (!room) {
                room = new Room({
                    members: [userId, receiverId],
                    isGroup: false
                });
                await room.save();

                // **Update both users to include the new room ID**
                await User.updateMany(
                    {_id: {$in: [userId, receiverId]}},
                    {$addToSet: {rooms: room._id}} // Ensures no duplicate room IDs
                );
            }
        } else {
            room = await Room.findById(roomId);
            if (!room) {
                res.status(404).send("No room found!");
                return;
            }
        }


        // **🔹 Validate Sender (Ensure user is part of the chat)**
        if (!room.members.includes(userId)) {
            res.status(403).send("You don't have access to this chat!");
            return;
        }

        // Define Encryption Functions
        const encryptFunctions = {
            text: encryptText,
            video: encryptMedia,
            audio: encryptAudio,
            image: encryptImage,
        } as const;

        // Perform Encryption
        if (type in encryptFunctions) {
            const encryptFn = encryptFunctions[type as keyof typeof encryptFunctions];
            const content = type === "text" ? data : fs.readFileSync(data);

            const encryptionResult = encryptFn(content);

            // Construct Message Object
            const chatMessage = {
                roomId: room._id as mongoose.Types.ObjectId,
                timestamps: Date.now(),
                sender: userId as mongoose.Types.ObjectId,
                dataType: type,
                encryptedContent: encryptionResult.encryptedData,
                iv: encryptionResult.iv,
                ...(type !== "text" ? {
                    tag: (encryptionResult as {
                        encryptedData: string;
                        iv: string;
                        tag: string
                    }).tag
                } : {}),
            };
            console.log(chatMessage);

            // Save Message to Database ->
            // Publish Message to RabbitMQ (chatQueue)
            await publishToQueue("chatQueue", chatMessage);

            // Send message to API Gateway for notification processing
            // Determine which users are online and offline
            const memberIds = room.members.map((id) => id.toString());
            const offlineUserIds: string[] = [];

            memberIds.forEach((memberId) => {
                const socketId = activeUsers.get(memberId) as string;
                if (socketId) {
                    // Online → emit real-time message via socket
                    io.to(socketId).emit("newMessage", chatMessage);
                } else if (memberId !== userId.toString()) {
                    // Collect only *other* offline users (exclude sender)
                    offlineUserIds.push(memberId);
                }
            });

            //  Notify offline users via notification service
            if (offlineUserIds.length > 0) {
                try {
                    await axios.post(`${API_GATEWAY_URL}/notify`, {
                        to: offlineUserIds, // array of offline userIds
                        message: {
                            sender: userId,
                            roomId: room._id,
                            type,
                            timestamp: chatMessage.timestamps
                        }
                    });
                    console.log("Notification sent to offline users");
                } catch (error) {
                    console.error("Failed to notify offline users:", error);
                }
            }

            // Send Response
            res.status(200).json({
                success: true,
                message: `${type.charAt(0).toUpperCase() + type.slice(1)} message saved & queued!`
            });
        } else {
            res.status(400).send("Invalid message type!");
        }
    } catch (error) {
        next(error);
    }
};

export const getChatMessages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        // Extract user email from headers
        const userEmail = req.headers["user-id"];
        if (!userEmail || typeof userEmail !== "string") {
            res.status(400).send({success: false, error: "Unauthorized: Email not provided."});
            return;
        }

        // Fetch sender (user) ID from the database using email
        const user = await User.findOne({email: userEmail});
        if (!user) {
            res.status(404).send({success: false, error: "User not found."});
            return;
        }

        const userId = user._id as mongoose.Types.ObjectId; // MongoDB ID of sender
        if (!userId) {
            res.status(400).json({error: "User ID is required"});
        }

        const {roomId, limit, skip} = req.body;
        if (!roomId) {
            res.status(400).json({error: "Room ID is required"});
        }
        const LIMIT = parseInt(limit);
        const SKIP = parseInt(skip);

        const room = await Room.findById(roomId).populate("chats");
        if (!room) {
            res.status(400).json({error: "Room not found"});
            return;
        }
        if (!room.members.includes(userId)) {
            res.status(400).json({error: "User does not belong to this group"});
            return;
        }
        const chats = await Room.aggregate([
            {$match: {_id: room._id}},
            {$unwind: "$chats"},
            {$sort: {"chats.timestamps": -1}}, // Sort by latest messages
            {$skip: SKIP},
            {$limit: LIMIT + 1}
        ]);

        const hasMore = chats.length > LIMIT; // If extra message exists, there are more

        // Remove the extra message before returning
        const trimmedChats = hasMore ? chats.slice(0, LIMIT) : chats;

        const decryptedChats = trimmedChats.map(chat => {
            try {
                let decryptedContent;
                switch (chat.chats.dataType) {
                    case "text":
                        decryptedContent = decryptText(chat.chats.encryptedContent, chat.chats.iv);
                        break;
                    case "image":
                        decryptedContent = decryptImage(chat.chats.encryptedContent, chat.chats.iv, chat.chats.tag);
                        break;
                    case "audio":
                        decryptedContent = decryptAudio(chat.chats.encryptedContent, chat.chats.iv, chat.chats.tag);
                        break;
                    case "video":
                        decryptedContent = decryptMedia(chat.chats.encryptedContent, chat.chats.iv, chat.chats.tag);
                        break;
                    default:
                        decryptedContent = chat.chats.encryptedContent;
                }

                return {...chat.chats, decryptedContent}; // Attach decrypted content
            } catch (error) {
                console.error("Decryption failed:", error);
                return {...chat.chats, decryptedContent: "Decryption failed"};
            }
        });

        res.status(200).json({success: true, chats: decryptedChats, hasMore: hasMore});

    } catch (error) {
        next(error);
    }
}

export const readMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const {userId, roomId, messageIds} = req.body;

    if (!userId || !roomId || !messageIds || !Array.isArray(messageIds)) {
        res.status(400).json({error: "User ID, Room ID, and message IDs are required"});
        return;
    }

    try {
        await Room.updateOne(
            {_id: roomId},
            {
                $addToSet: {"chats.$[chat].readBy": userId} // Add userId to readBy array
            },
            {arrayFilters: [{"chat._id": {$in: messageIds}, "chat.readBy": {$ne: userId}}]} // Only update unread messages
        );

        res.status(200).json({success: true, message: "Messages marked as read"});
    } catch (error) {
        next(error);
    }
}
