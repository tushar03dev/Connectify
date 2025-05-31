import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import bodyParser from 'body-parser';
import http from 'http';
import authRoutes from './routes/authRoutes';
import videoRoutes from './routes/videoRoutes';
import roomRoutes from './routes/roomRoutes';
import { Duplex } from 'stream';
import { createProxyMiddleware } from 'http-proxy-middleware';
import * as net from "node:net";
import {authenticateToken} from "./middleware/authMiddleware";

dotenv.config();
// Create proxy for WebSocket/socket.io traffic
const chatServerTarget = process.env.VIDEO_SERVER_URL;

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/auth', authRoutes);
app.use('/rooms', roomRoutes);
app.use('/video',authenticateToken, createProxyMiddleware({
    target: chatServerTarget,
    changeOrigin: true,
}));

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('Server error:', err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

const socketProxy = createProxyMiddleware({
    target: chatServerTarget,
    changeOrigin: true,
    ws: true,
    pathRewrite: {
        '^/socket.io': '/socket.io',
    },
});

// Apply the proxy for WebSocket upgrades
app.use(socketProxy);

// Start HTTP server
const PORT = process.env.PORT;
const server = http.createServer(app);

// Start listening
server.listen(PORT, () => {
    console.log(`API Gateway running on http://localhost:${PORT}`);
});

// Handle WebSocket upgrade requests (important for Socket.IO)
server.on('upgrade', (req, socket: Duplex, head) => {
    console.log('Upgrading WebSocket:', req.url);
    if (socket instanceof net.Socket) {
        socketProxy.upgrade?.(req, socket, head);
    }
});