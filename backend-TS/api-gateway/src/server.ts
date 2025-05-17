import express from 'express';
import {Response} from 'express';
import authRoutes from './routes/authRoutes';
import dotenv from 'dotenv';
import cors from "cors";
import chatRoutes from "./routes/roomRoutes";
import multer from "multer";

dotenv.config();

const app = express();

// Middleware
app.use(express.json());

// Middleware to handle form-data
const upload = multer(); // You can configure multer to store files if needed

// Middleware to parse form-data
app.use(upload.none()); // This is used when you're not uploading any files, just data

app.use(cors());

// Routes
app.use('/auth', authRoutes);
app.use('/chat',chatRoutes);

//Error-handling middleware
app.use((err: any, res: Response) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

// Start the server
const PORT = process.env.PORT;

app.listen(PORT, () => {
    console.log(`API-GATEWAY is running on http://localhost:${PORT}`);
});
