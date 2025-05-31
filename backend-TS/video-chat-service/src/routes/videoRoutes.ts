import express from 'express';
import {deleteVideo, getVideos, streamVideoById, uploadVideo} from "../controllers/videoController";

const router = express.Router();


// Route to upload a video
router.post('/upload', uploadVideo);

router.get('/get-videos/:roomCode', getVideos);

router.get("/play/:id", streamVideoById);

router.delete('/delete/:id', deleteVideo);

export default router;
