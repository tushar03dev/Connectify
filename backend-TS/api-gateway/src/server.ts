import express, {Request, Response, NextFunction} from 'express';
import authRoutes from './routes/authRoutes';
import dotenv from 'dotenv';
import cors from "cors";
import chatRoutes from "./routes/roomRoutes";
import bodyParser from "body-parser";
import roomRoutes from "./routes/roomRoutes";
import { createProxyMiddleware } from 'http-proxy-middleware';
import * as http from "node:http";

dotenv.config();

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/auth', authRoutes);
app.use('/chat',chatRoutes);
app.use('/rooms', roomRoutes);

// Proxy /socket.io to VC server
app.use('/socket.io', createProxyMiddleware({
    target: process.env.VIDEO_SERVICE_URL,
    changeOrigin: true,
    ws: true, // WebSocket support
    pathRewrite: {
        '^/socket.io': '/socket.io',
    }
}));

//Error-handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

// Start the server
const PORT = process.env.PORT;
const server = http.createServer(app);

server.listen(PORT, () => {
    console.log(`API-GATEWAY is running on http://localhost:${PORT}`);
});
