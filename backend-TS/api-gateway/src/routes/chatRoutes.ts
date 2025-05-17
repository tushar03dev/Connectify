import express from "express";
import { createRoom, getRooms } from "../controllers/roomServiceController";
import { authenticateToken } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/create-room",authenticateToken,createRoom);

router.get("/get-rooms",authenticateToken,getRooms);

export default router;