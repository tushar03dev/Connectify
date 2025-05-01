import express from 'express';
import { Video } from '../models/videoModel.js';
import path from 'path';
import {authenticateToken} from "../middlewares/authMiddleware.js";
import {getVideos, uploadVideo} from "../controllers/videoController.js";
import multer from "multer";

const router = express.Router();

// Set up multer for video uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Set the destination for uploaded files
        cb(null, 'uploads/videos/');
    },
    filename: (req, file, cb) => {
        // Define file naming strategy (ensure unique names)
        const ext = path.extname(file.originalname);
        const filename = Date.now() + ext; // Add timestamp to file name for uniqueness
        cb(null, filename);
    }
});

const upload = multer({ storage });

// Route to upload a video
router.post('/upload',upload.single('video'),uploadVideo);

router.get('/get-videos/:roomId',authenticateToken,getVideos);

export default router;
