import {Router} from "express";
import {authenticateToken} from "../middlewares/authMiddleware.js";
import {createRoom, getRooms, joinRoom} from "../controllers/roomController.js";

const router = Router();


// Create Room
router.post('/create', authenticateToken,createRoom);

// Join Room
router.post('/join',authenticateToken,joinRoom);

// Get Rooms
router.get('/get-rooms',authenticateToken,getRooms);

export default router;
