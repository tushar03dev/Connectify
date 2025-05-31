import fs from "node:fs";
import {Video} from "../models/videoModel";
import {Request, Response} from "express";
import {Room} from "../models/roomModel";
import {S3Client} from "@aws-sdk/client-s3";
import dotenv from "dotenv";


dotenv.config();

const s3Client = new S3Client({
    region: process.env.AWS_REGION as string,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
    }
});



export const streamVideoById = async (req: Request, res :Response): Promise<void> => {
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

        const videoPath = video.filePath;
        const videoSize = fs.statSync(videoPath).size;

        const CHUNK_SIZE = 10 ** 6; // 1MB
        const start = Number(range.replace(/\D/g, ""));
        const end = Math.min(start + CHUNK_SIZE, videoSize - 1);

        const contentLength = end - start + 1;
        const headers = {
            "Content-Range": `bytes ${start}-${end}/${videoSize}`,
            "Accept-Ranges": "bytes",
            "Content-Length": contentLength,
            "Content-Type": "video/mp4",
        };

        res.writeHead(206, headers);

        const videoStream = fs.createReadStream(videoPath, { start, end });
        videoStream.pipe(res);
    } catch (error) {
        console.error("Error streaming video:", error);
        res.status(500).send("Internal Server Error");
    }
};

export const uploadVideo = async (req: Request, res: Response): Promise<void> => {
    try {
        console.log("REQ.FILE", req.file);
        const file = req.file;
        const { roomCode } = req.body;

        if (!file || !roomCode) {
            res.status(400).json({ error: "Missing file or roomId" });
            return;
        }

        const room = await Room.findOne({ code: roomCode });
        if (!room) {
            res.status(404).send("Room not found");
            return;
        }

        const video = new Video({
            filename: file.filename,
            originalName: file.originalname,
            filePath: file.path,
            roomId: room._id,
        });

        await video.save();

        res.status(200).json({ video: video.toObject() });
    } catch (err) {
        console.error("Error uploading video:", err);
        res.status(500).json({ error: "Server error while uploading video" });
    }
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
