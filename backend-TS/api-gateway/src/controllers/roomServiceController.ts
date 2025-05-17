import {Response} from "express";
import dotenv from "dotenv";
import {AuthRequest} from "../middleware/authMiddleware";
import axios from "axios";

dotenv.config();
const CHAT_SERVICE_URL = process.env.CHAT_SERVICE_URL;

export async function createRoom(req: AuthRequest, res: Response): Promise<void> {
    try {
        const {name, participants, userId} = req.body;

        // check if UserId exists
        if (!userId) {
            res.status(401).json({success: false, error: "User not found"});
            return;
        }

        const response = await axios.post(`${CHAT_SERVICE_URL}/room/create-room}`,{
            name,
            participants,
            userId
        })

        if (response.data.success) {
            res.status(200).json({ success: true, data: response.data });
        } else {
            res.status(500).json({ success: false, error: "Failed to send message." });
        }
    } catch (error) {
        console.error("[API Gateway] Failed to reach Chat Service for creating room:", error);
    }
}

export async function joinRoom(req: AuthRequest, res: Response): Promise<void> {
    try {
        const {code, userId} = req.body;
        if (!code) {
            res.status(401).json({success: false, error: "Room Code not found"});
        }
        const response = await axios.post(`${CHAT_SERVICE_URL}/room/join-room`,{code, userId})
        if (response.data.success) {
            res.status(200).json({ success: true, data: response.data });
        } else {
            res.status(500).json({ success: false, error: "Failed to send message." });
        }
    } catch (error) {
        console.error("[API Gateway] Failed to joinRoom:", error);
    }
}

export async function getRooms(req: AuthRequest, res: Response): Promise<void> {
    try {
        const { userId } = req.body;

        // check if UserId exists
        if (!userId) {
            res.status(401).json({success: false, error: "User not found"});
            return;
        }

        const response = await axios.get(`${CHAT_SERVICE_URL}/room/get-rooms/${userId}}`)

        if (response.status === 200) {
            res.status(200).json({ success: true, data: response.data });
        } else {
            res.status(500).json({ success: false, error: "Failed to send message." });
        }
    } catch (error) {
        console.error("[API Gateway] Failed to reach Chat Service for retrieving rooms:", error);
    }
}

export async function deleteRoom(req: AuthRequest, res: Response): Promise<void> {
    try {
        const { userId } = req.body;
        const roomId = req.params.roomId;
        // check if UserId exists
        if (!userId) {
            res.status(401).json({success: false, error: "User not found"});
            return;
        }

        const response = await axios.delete(`${CHAT_SERVICE_URL}/room/delete-rooms/${userId}/${roomId}`)

        if (response.status === 200) {
            res.status(200).json({ success: true, data: response.data });
        } else {
            res.status(500).json({ success: false, error: "Failed to send message." });
        }
    } catch (error) {
        console.error("[API Gateway] Failed to reach Chat Service for retrieving rooms:", error);
    }
}