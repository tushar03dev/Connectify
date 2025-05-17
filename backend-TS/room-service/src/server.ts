import dotenv from "dotenv";
import express, {Response} from "express";
import cors from "cors";
import connectDB from "./config/db";
import roomRoutes from "./routes/roomRoutes";
import multer from "multer";

dotenv.config();

const app = express();

// Database Connection
connectDB();

// Middleware
app.use(cors());

// Middleware to handle form-data
const upload = multer();
app.use(upload.none());

// Routes
app.use("/rooms", roomRoutes);

//Error-handling middleware
app.use((err: any, res: Response) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT;

app.listen(PORT, () => {
    console.log(`Room Server is running on http://localhost:${PORT}`);
});