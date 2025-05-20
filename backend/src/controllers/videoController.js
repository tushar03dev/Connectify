import {Room} from "../models/roomModel.js";
import {Video} from "../models/videoModel.js";
import * as fs from "node:fs";


export const streamVideoById = async (req, res) => {
    const range = req.headers.range;
    if (!range) return res.status(400).send("Requires Range header");

    try {
        const video = await Video.findById(req.params.id);
        if (!video) return res.status(404).send("Video not found");

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

export const deleteVideo = async (req, res) => {
    try {
        const videoId = req.params.id;
        const video = await Video.findByIdAndDelete(videoId);
        if (!video) {
            return res.status(404).send("Video not found");
        }
        res.status(200).send("Video was deleted successfully");
    } catch (error) {
        console.error("Error deleting video:", error);
        res.status(500).send("Internal Server Error");
    }
}


export const uploadVideo = async (req, res) => {
    try {
        console.log("REQ.FILE", req.file);
        const file = req.file;
        const { roomCode } = req.body;

        if (!file || !roomCode) {
            return res.status(400).json({ error: "Missing file or roomId" });
        }

        const room = await Room.findOne({ code: roomCode });

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

export const getVideos = async (req, res) => {
    const { roomCode } = req.params;

    const room = await Room.findOne({code:roomCode});
    if (!room) {
        return res.status(404).json({message: 'Room not found'});
    }

    const videos = await Video.find({ roomId: room._id });
    if (!videos) {
        return res.status(404).json({message: 'Video not found'});
    }

    return res.status(200).json({videos:videos});
}