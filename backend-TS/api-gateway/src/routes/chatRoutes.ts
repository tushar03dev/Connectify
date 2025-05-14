import express from "express";
import {
    addAdmin,
    addUser, createRoom,
    getChat, getRooms,
    removeAdmin,
    removeUser,
    sendMessageToChatService
} from "../controllers/chatServiceController";
import {authenticateToken} from "../middleware/authMiddleware";

const router = express.Router();

router.post("/send",authenticateToken,sendMessageToChatService);

router.post("/create-room",authenticateToken,createRoom);

router.get("/get-chat",authenticateToken,getChat);

router.get("/get-rooms",authenticateToken,getRooms);

router.put("/add-user",authenticateToken,addUser);

router.delete("/remove-user",authenticateToken,removeUser);

router.put("/add-admin",authenticateToken,addAdmin);

router.delete("/remove-admin",authenticateToken,removeAdmin);

export default router;


