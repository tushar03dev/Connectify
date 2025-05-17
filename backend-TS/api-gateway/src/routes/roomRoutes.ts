import express from "express";
import {createRoom, deleteRoom, getRooms} from "../controllers/roomServiceController";
import { authenticateToken } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/create-room",authenticateToken,createRoom);

router.post("/join-room",authenticateToken,createRoom);

router.get("/get-rooms",authenticateToken,getRooms);

router.delete("/delete-room/:roomId",authenticateToken,deleteRoom);

export default router;