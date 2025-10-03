import { Request, Response } from "express";
import dotenv from "dotenv";
import { Video } from "../models/videoModel";
import { Room } from "../models/roomModel";
import {deleteFromS3, getObjectURL, uploadToS3} from "../utils/s3Utils";
import axios from "axios";
import {User} from "../models/userModel";

const env = process.env.NODE_ENV;
dotenv.config({ path: `.env.${env}` });

// Upload video directly to S3
export const uploadVideo = async (req: Request, res: Response): Promise<void> => {
    try {
        console.log("Uploading video");
        const file = req.file;
        const { roomCode } = req.body;

        if (!file || !roomCode) {
            res.status(400).json({ error: "Missing file or roomCode" });
            return;
        }

        const room = await Room.findOne({ code: roomCode });
        if (!room) {
            res.status(404).json({ error: "Room not found" });
            return;
        }

        const user = await User.findOne({email: req.body.userId});
        if (!user) {
            res.status(404).json({ error: "User not found" });
            return;
        }

        const s3Key = `${Date.now()}-${file.originalname}`; // Unique key with timestamp
        const contentType = file.mimetype;

        // Use memory buffer directly from multer (requires `multer` with memoryStorage)
        await uploadToS3(file.buffer, s3Key, contentType);

        // Save video metadata to MongoDB
        const video = new Video({
            filename: file.originalname,
            originalName: file.originalname,
            filePath: s3Key, // Store S3 key
            roomId: room._id,
            contentType: contentType,
            size: file.size,
            username: user.name,
            uploadDate: new Date(),
        });

        await video.save();

        res.status(200).json({ video: video.toObject() });
    } catch (err) {
        console.error("Error uploading video:", err);
        res.status(500).json({ error: "Server error while uploading video" });
    }
};

export const streamVideoById = async (req: Request, res: Response): Promise<void> => {
    try {
        const videoId = req.params.id;
        console.log(`Fetching video with ID: ${videoId}`);
        const video = await Video.findById(videoId);
        if (!video) {
            console.error(`Video not found for ID: ${videoId}`);
            res.status(404).json({ error: `Video not found for ID: ${videoId}` });
            return;
        }
        console.log(`Video found: ${video.originalName}, filePath: ${video.filePath}`);
        const signedUrl = await getObjectURL(video.filePath);
        console.log(`Generated S3 signed URL: ${signedUrl}`);

        // Set headers and return the signed URL
        res.set({
            "Content-Type": video.contentType || "video/mp4",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Expose-Headers": "Content-Length,Content-Type,Accept-Ranges",
        });
        res.status(200).json({ url: signedUrl });
    } catch (error: any) {
        console.error("Error fetching video URL:", {
            message: error.message,
            stack: error.stack,
            videoId: req.params.id,
            method: req.method,
        });
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
};

// Get all videos in a room
export const getVideos = async (req: Request, res: Response) => {
    try {
        const roomCode = req.params.roomCode;
        const room = await Room.findOne({ code: roomCode });
        if (!room) {
            res.status(404).json({ error: "Room not found" });
            return;
        }

        const videos = await Video.find({ roomId: room._id });
        res.status(200).json({ room, videos });
    } catch (error) {
        console.error("Error fetching videos:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// Delete video from S3 and MongoDB
export const deleteVideo = async (req: Request, res: Response) => {
    try {
        const videoId = req.params.id;
        const video = await Video.findByIdAndDelete(videoId);

        if (!video) {
            res.status(404).json({ error: "Video not found" });
            return;
        }

        await deleteFromS3(video.filePath);
        res.status(200).json({ message: "Video deleted successfully" });
    } catch (error) {
        console.error("Error deleting video:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};