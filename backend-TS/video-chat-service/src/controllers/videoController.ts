import fs from "node:fs";
import {Video} from "../models/videoModel";
import {Request, Response} from "express";
import {Room} from "../models/roomModel";

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


