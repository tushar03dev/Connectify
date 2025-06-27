import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import bodyParser from 'body-parser';
import http from 'http';
import authRoutes from './routes/authRoutes';
import roomRoutes from './routes/roomRoutes';
import { Duplex } from 'stream';
import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import * as net from "node:net";
import {authenticateToken} from "./middleware/authMiddleware";

const env = process.env.NODE_ENV;
dotenv.config({ path: `.env.${env}` });

// Create proxy for WebSocket/socket.io traffic
const chatServerTarget = process.env.VIDEO_SERVER_URL;

const app = express();

app.use(cors({
    origin: "*",
    credentials: true,
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/auth', authRoutes);
app.use('/rooms', roomRoutes);

const videoProxyOptions: Options = {
    target: process.env.VIDEO_SERVER_URL,
    changeOrigin: true,
    pathRewrite: {
        '^/video/play': '/play', // Map /video/play/:id to /play/:id
        '^/video': '/', // Map /video/* to /* (e.g., /video/get-videos to /get-videos)
    },
    onProxyReq: (proxyReq: any, req: any, res : any) => {
        console.log(`Proxying ${req.method} request to: ${req.url} -> ${proxyReq.path}`); // Debug log
    },
    onProxyRes: (proxyRes: any, req: any, res: any) => {
        proxyRes.headers["Access-Control-Allow-Origin"] = "*";
        proxyRes.headers["Access-Control-Expose-Headers"] = "Content-Length,Content-Type,Accept-Ranges";
    },
    onError: (err: any, req: any, res : any) => {
        console.error("Proxy error:", err);
        res.status(500).json({ error: "Proxy error", details: err.message });
    },
} as any;

app.use('/video', authenticateToken, createProxyMiddleware(videoProxyOptions));

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
    console.log('Upgrading WebSocket:', { url: req.url, headers: req.headers });
    if (socket instanceof net.Socket) {
        socketProxy.upgrade?.(req, socket, head);
    } else {
        console.error('Invalid socket type for upgrade');
        socket.destroy();
    }
});