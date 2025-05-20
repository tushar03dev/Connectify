import path from "path";
import multer from "multer";
import fs from "fs";

// CommonJS-style __dirname is available by default in non-ESM
const videoDirectory = path.join(__dirname, "videos");
if (!fs.existsSync(videoDirectory)) {
    fs.mkdirSync(videoDirectory);
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, videoDirectory),
    filename: (_req, file, cb) =>
        cb(null, `${Date.now()}-${file.originalname.replace(/\s/g, "_")}`),
});

const upload = multer({ storage });
export default upload;
