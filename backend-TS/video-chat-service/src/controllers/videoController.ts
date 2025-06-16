import { Request, Response } from "express";
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import dotenv from "dotenv";
import { Video } from "../models/videoModel";
import { Room } from "../models/roomModel";

dotenv.config();

const s3Client = new S3Client({
    region: process.env.AWS_REGION as string,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
    },
});

// Generate a signed URL for accessing S3 objects
async function getObjectURL(key: string) {
    const command = new GetObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME as string,
        Key: key,
    });
    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour
    return url;
}

// Upload file stream directly to S3
async function uploadToS3(fileStream: Buffer, s3Key: string, contentType: string) {
    try {
        const uploadParams = {
            Bucket: process.env.AWS_BUCKET_NAME as string,
            Key: s3Key,
            Body: fileStream,
            ContentType: contentType,
        };
        await s3Client.send(new PutObjectCommand(uploadParams));
        console.log(`Successfully uploaded ${s3Key} to S3`);
    } catch (err) {
        console.error(`Error uploading ${s3Key} to S3:`, err);
        throw err;
    }
}

// Delete object from S3
async function deleteFromS3(key: string) {
    const command = new DeleteObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME as string,
        Key: key,
    });
    await s3Client.send(command);
}

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
            uploadDate: new Date(),
        });

        await video.save();

        res.status(200).json({ video: video.toObject() });
    } catch (err) {
        console.error("Error uploading video:", err);
        res.status(500).json({ error: "Server error while uploading video" });
    }
};

// Stream video via S3 signed URL
export const streamVideoById = async (req: Request, res: Response): Promise<void> => {
    try {
        const video = await Video.findById(req.params.id);
        if (!video) {
            res.status(404).json({ error: "Video not found" });
            return;
        }

        const signedUrl = await getObjectURL(video.filePath);
        res.redirect(signedUrl); // Client streams directly from S3
    } catch (error) {
        console.error("Error streaming video:", error);
        res.status(500).json({ error: "Internal Server Error" });
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
        res.status(200).json({ videos });
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