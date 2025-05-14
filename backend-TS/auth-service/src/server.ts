import express from 'express';
import {Response} from 'express';
import authRoutes from './routes/authRoutes';
import dotenv from 'dotenv';
import connectDB from './config/db';
import multer from 'multer';
import otpRoutes from "./routes/otpRoutes";
import {authConsumer} from "./consumers/authConsumer";

dotenv.config();

const app = express();

// Middleware
app.use(express.json());

// Middleware to handle form-data
const upload = multer();
app.use(upload.none());

// MongoDB Connection
connectDB().then(()=> authConsumer());

// Use the auth routes
app.use('/auth', authRoutes); // Mounts the auth routes

// Use the auth routes
app.use('/otp',otpRoutes); // Mounts the auth routes

//Error-handling middleware
app.use((err: any, res: Response) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

// Start the server
const PORT = process.env.PORT;

app.listen(PORT, () => {
    console.log(`Auth Server is running on http://localhost:${PORT}`);
});
