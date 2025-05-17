import {Response} from "express";
import dotenv from "dotenv";
import {AuthRequest} from "../middleware/authMiddleware";
import axios from "axios";

dotenv.config();
const VIDEO_SERVICE_URL = process.env.VIDEO_SERVICE_URL;

export async function streamVideoById(req: AuthRequest, res: Response): Promise<void> {
    try {
        const videoId = req.params.id;
        const rangeHeader = req.headers.range;
        if (!videoId) {
            res.status(400).json({ success: false, error: "No video ID provided." });
            return;
        }
        if (!rangeHeader) {
            res.status(400).json({ success: false, error: "Range header required." });
            return;
        }

        // Proxy request to the video service, forwarding headers
        const serviceResponse = await axios.get(
            `${VIDEO_SERVICE_URL}/video/stream/${videoId}`,
            {
                responseType: "stream",
                headers: {
                    Range: rangeHeader as string,
                },
                validateStatus: () => true, // let us handle non-200 statuses
            }
        );

        // Relay status, headers, and stream back to client
        res.status(serviceResponse.status);
        Object.entries(serviceResponse.headers).forEach(([key, value]) => {
            // Only passthrough relevant headers
            if (
                [
                    "content-range",
                    "accept-ranges",
                    "content-length",
                    "content-type",
                ].includes(key.toLowerCase())
            ) {
                res.setHeader(key, value as string);
            }
        });
        serviceResponse.data.pipe(res);
    } catch (err) {
        console.error(
            "[API Gateway] Failed to reach Video Service for streaming:",
            err
        );
        res
            .status(502)
            .json({ success: false, error: "Bad Gateway: couldn’t reach video service." });
    }
}

export async function uploadVideo(req:AuthRequest, res:Response): Promise<void> {
    try{
        const file = req.file;
        const { roomCode } = req.body;
        if (!file || !roomCode) {
            res.status(400).json({ success: false, error: "No file uploaded." });
            return;
        }

        const response = await axios.post(`${VIDEO_SERVICE_URL}/video/upload-video`, {
            file: file.buffer,
            roomCode: roomCode
        })

        if (response.status === 200) {
            res.status(200).json(response.data);
        } else {
            res.status(500).json({ success: false, error: "Failed to upload video." });
        }
    } catch (err) {
        console.log("[API Gateway] Failed to reach Video Chat Server upload video: ", err);
    }
}

export async function getVideos(req: AuthRequest, res: Response): Promise<void> {
    try {
        const {roomCode} = req.params;
        if (!roomCode) {
            res.status(400).json({success: false, error: "No roomCode."});
            return;
        }

        const response = await axios.get(`${VIDEO_SERVICE_URL}/video/get-videos/${roomCode}`);
        if (response.status === 200) {
            res.status(200).json(response.data);
        } else {
            res.status(500).json({success: false, error: "Failed to reach Video."});
        }
    } catch (err) {
        console.log("[API Gateway] Failed to reach Video Chat Server to get video list: ",err);
    }
}

export async function deleteVideo(req: AuthRequest, res: Response): Promise<void> {
    try {
        const videoId = req.params.videoId;
        if (!videoId) {
            res.status(400).json({success: false, error: "No videoId provided."});
            return;
        }

        const response = await axios.delete(`${VIDEO_SERVICE_URL}/video/delete-video/${videoId}`);
        if (response.status === 200) {
            res.status(200).json(response.data);
        } else {
            res.status(500).json({success: false, error: "Failed to reach Video."});
        }
    } catch (err) {
        console.log("[API Gateway] Failed to reach Video Chat Server to delete video: ",err);
    }
}