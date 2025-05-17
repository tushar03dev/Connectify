import {Router} from "express";
import {createRoom, deleteRoom, getRooms, joinRoom} from "../controllers/roomController";

const router = Router();


// Create Room
router.post('/create', createRoom);

// Join Room
router.post('/join', joinRoom);

// Get Rooms
router.get('/get-rooms', getRooms);

// Delete Room
router.delete('/delete-room/:roomId', deleteRoom);

export default router;
