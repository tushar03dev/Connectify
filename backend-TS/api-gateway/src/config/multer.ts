import multer, { StorageEngine } from "multer";
import path from "path";
import fs from "fs";

// Emulate __dirname in CommonJS mode:
const __dirname = path.dirname(process.argv[1]);

// Ensure that the 'videos' directory exists
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
