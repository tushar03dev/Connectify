import {Router} from "express";
import {authenticateToken} from "../middlewares/authMiddleware.js";
import {createRoom, joinRoom} from "../controllers/roomController.js";

const router = Router();


// Create Room
router.post('/create', authenticateToken,createRoom);

// Join Room
router.post('/join',authenticateToken,joinRoom);

export default router;
