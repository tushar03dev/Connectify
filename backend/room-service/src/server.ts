import dotenv from "dotenv";
import express, {Request, Response, NextFunction} from "express";
import cors from "cors";
import connectDB from "./config/db";
import roomRoutes from "./routes/roomRoutes";
import multer from "multer";

const env = process.env.NODE_ENV;
dotenv.config({ path: `.env.${env}` });

const app = express();
app.use(express.json());

// Database Connection
connectDB();

// Middleware
app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"]
}));

// Middleware to handle form-data
const upload = multer();
app.use(upload.none());

// Routes
app.use("/rooms", roomRoutes);

//Error-handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT;

app.listen(PORT, () => {
    console.log(`Room Server is running on http://localhost:${PORT}`);
});