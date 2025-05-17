import express from 'express';
import {Response} from 'express';
import authRoutes from './routes/authRoutes';
import dotenv from 'dotenv';
import cors from "cors";
import bodyParser from "body-parser";
import chatRoutes from "./routes/roomRoutes";

dotenv.config();

const app = express();

// Middleware
app.use(express.json());

// Middleware to handle form-data
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

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
