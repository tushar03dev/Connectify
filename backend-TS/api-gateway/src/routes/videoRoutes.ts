import express from "express";
import {deleteVideo, getVideos, streamVideoById, uploadVideo} from "../controllers/videoServiceController";
import upload from "../config/multer";
import {authenticateToken} from "../middleware/authMiddleware";
import {createProxyMiddleware} from "http-proxy-middleware";

const router = express.Router();

const proxy = createProxyMiddleware;
router.post('/upload',authenticateToken, proxy({
    target: `${process.env.VIDEO_SERVER_URL}/upload`,
    changeOrigin: true,
}));

router.get('/get-videos/:roomCode',authenticateToken,getVideos);

router.get("play/:id",authenticateToken,streamVideoById);

router.delete('/delete/:id',authenticateToken,deleteVideo);

export default router;
