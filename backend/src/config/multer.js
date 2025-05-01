import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure that the 'videos' directory exists
const videoDirectory = path.join(__dirname, 'videos');
if (!fs.existsSync(videoDirectory)) {
    fs.mkdirSync(videoDirectory);
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, videoDirectory); // Ensure you're using the full path
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        cb(null, Date.now() + "-" + file.originalname.replace(/\s/g, "_"));
    },
});

const upload = multer({ storage });

export default upload;
