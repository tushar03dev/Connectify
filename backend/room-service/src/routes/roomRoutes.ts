import {Router} from "express";
import {createRoom, deleteRoom, getRooms, joinRoom} from "../controllers/roomController";

const router = Router();

// Create Room
router.post('/create-room', createRoom);

// Join Room
router.post('/join-room', joinRoom);

// Get Rooms
router.get('/get-rooms/:userId', getRooms);

// Delete Room
router.delete('/delete-room/:roomId', deleteRoom);

export default router;
