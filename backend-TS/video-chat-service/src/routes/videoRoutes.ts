import express from 'express';
import {deleteVideo, getVideos, streamVideoById, uploadVideo} from "../controllers/videoController";
import multer from "multer";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Route to upload a video
router.post('/upload', upload.single('video'), uploadVideo);

router.get('/get-videos/:roomCode', getVideos);

router.get("/play/:id", streamVideoById);

router.delete('/delete/:id', deleteVideo);

export default router;
