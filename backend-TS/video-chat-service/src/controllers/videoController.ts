import fs from "node:fs";
import {Video} from "../models/videoModel";
import {Request, Response} from "express";
import {Room} from "../models/roomModel";
import {DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client} from "@aws-sdk/client-s3";
import dotenv from "dotenv";
import {getSignedUrl} from "@aws-sdk/s3-request-presigner";


dotenv.config();

const s3Client = new S3Client({
    region: process.env.AWS_REGION as string,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
    }
});

async function getObjectURL(key: string) {
    const command = new GetObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME as string,
        Key: key,
    });

    return await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour
}

async function uploadToS3(filePath: string, s3Key: string, contentType: string) {
    const fileStream = fs.createReadStream(filePath);
    const uploadParams = {
        Bucket: process.env.AWS_BUCKET_NAME as string,
        Key: s3Key,
        Body: fileStream,
        ContentType: contentType,
    };

    await s3Client.send(new PutObjectCommand(uploadParams));
}

async function deleteFromS3(key: string) {
    const command = new DeleteObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME as string,
        Key: key,
    });

    await s3Client.send(command);
}

// Upload Video and store it in S3
export const uploadVideo = async (req: Request, res: Response): Promise<void> => {
    try {
        const file = req.file;
        const { roomCode } = req.body;

        if (!file || !roomCode) {
            res.status(400).json({ error: "Missing file or roomCode" });
            return;
        }

        const room = await Room.findOne({ code: roomCode });
        if (!room) {
            res.status(404).send("Room not found");
            return;
        }

        const s3Key = `uploads/user-uploads/${file.filename}`;
        const contentType = file.mimetype;

        await uploadToS3(file.path, s3Key, contentType);

        const video = new Video({
            filename: file.filename,
            originalName: file.originalname,
            filePath: s3Key, // Store S3 key, not local path
            roomId: room._id,
        });

        await video.save();

        // Optional: delete the file locally after upload
        fs.unlinkSync(file.path);

        res.status(200).json({ video: video.toObject() });
    } catch (err) {
        console.error("Error uploading video:", err);
        res.status(500).json({ error: "Server error while uploading video" });
    }
};

// Stream Video via S3 signed URL
export const streamVideoById = async (req: Request, res: Response): Promise<void> => {
    const range = req.headers.range;
    if (!range) {
        res.status(400).send("Requires Range header");
        return;
    }

    try {
        const video = await Video.findById(req.params.id);
        if (!video) {
            res.status(404).send("Video not found");
            return;
        }

        const s3Key = video.filePath;
        const signedUrl = await getObjectURL(s3Key);

        res.redirect(signedUrl); // Client streams directly from S3 via signed URL
    } catch (error) {
        console.error("Error streaming video:", error);
        res.status(500).send("Internal Server Error");
    }
};

// Get all videos in a room
export const getVideos = async (req: Request, res: Response) => {
    const roomCode = req.params.roomCode;
    const room = await Room.findOne({ code: roomCode });
    if (!room) {
        res.status(404).json({ message: 'Room not found' });
        return;
    }

    const videos = await Video.find({ roomId: room._id });
    res.status(200).json({ videos });
};

export const getVideos = async (req: Request, res: Response) => {
    const roomCode = req.params.roomCode;
    const room = await Room.findOne({code: roomCode});
    if (!room) {
        res.status(404).json({message: 'Room not found'});
        return;
    }

    const videos = await Video.find({roomId: room._id});
    if (!videos) {
        res.status(404).json({message: 'Video not found'});
        return;
    }

    res.status(200).json({videos: videos});
}

export const deleteVideo = async (req: Request, res: Response) => {
    try {
        const videoId = req.params.id;
        const video = await Video.findByIdAndDelete(videoId);
        if (!video) {
            res.status(404).send("Video not found");
            return;
        }
        res.status(200).send("Video was deleted successfully");
    } catch (error) {
        console.error("Error deleting video:", error);
        res.status(500).send("Internal Server Error");
    }
}
