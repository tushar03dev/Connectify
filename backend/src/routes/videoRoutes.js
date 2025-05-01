// videoRoutes.js
import express from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import { GridFsStorage } from 'multer-gridfs-storage';

const router = express.Router();

// MongoDB URI
const mongoURI = 'mongodb://localhost:27017/yourDB';

// Create connection
const conn = mongoose.createConnection(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Init GridFS
let gfs;
conn.once('open', () => {
    gfs = new mongoose.mongo.GridFSBucket(conn.db, {
        bucketName: 'videos'
    });
});

// Setup storage engine
const storage = new GridFsStorage({
    url: mongoURI,
    file: (req, file) => {
        return {
            filename: file.originalname, // Or use Date.now() + "-" + file.originalname
            bucketName: 'videos'
        };
    }
});

const upload = multer({ storage });

// Upload endpoint
router.post('/upload', upload.single('video'), (req, res) => {
    res.status(200).json({ message: 'Video uploaded', file: req.file });
});

// Stream video endpoint
router.get('/video/:filename', (req, res) => {
    gfs.find({ filename: req.params.filename }).toArray((err, files) => {
        if (!files || files.length === 0) {
            return res.status(404).json({ error: 'Video not found' });
        }
        const readStream = gfs.openDownloadStreamByName(req.params.filename);
        res.set("Content-Type", "video/mp4");
        readStream.pipe(res);
    });
});

export default router;
