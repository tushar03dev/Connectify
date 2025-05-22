import multer, { StorageEngine } from "multer";
import path from "path";
import fs from "fs";

// Use __dirname directly – it's already available
const videoDirectory = path.join(__dirname, "videos");
if (!fs.existsSync(videoDirectory)) {
    fs.mkdirSync(videoDirectory, { recursive: true });
}

const storage: StorageEngine = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, videoDirectory);
    },
    filename: (_req, file, cb) => {
        const timestamp = Date.now();
        const safeName = file.originalname.replace(/\s+/g, "_");
        cb(null, `${timestamp}-${safeName}`);
    },
});

const upload = multer({ storage });
export default upload;
