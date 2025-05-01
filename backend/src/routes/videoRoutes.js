import express from 'express';
import {authenticateToken} from "../middlewares/authMiddleware.js";
import {getVideos, streamVideoById, uploadVideo} from "../controllers/videoController.js";
import upload from "../config/multer.js";

const router = express.Router();


// Route to upload a video
router.post('/upload',upload.single('video'),uploadVideo);

router.get('/get-videos/:roomCode',authenticateToken,getVideos);

router.get("/:id", streamVideoById);

export default router;
