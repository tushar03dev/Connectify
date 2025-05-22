import express from "express";
import {deleteVideo, getVideos, streamVideoById, uploadVideo} from "../controllers/videoServiceController";
import upload from "../config/multer";
import {authenticateToken} from "../middleware/authMiddleware";

const router = express.Router();

router.post('/upload',authenticateToken,upload.single('video'),uploadVideo);

router.get('/get-videos/:roomCode',authenticateToken,getVideos);

router.get("play/:id",authenticateToken,streamVideoById);

router.delete('/delete/:id',authenticateToken,deleteVideo);

export default router;
