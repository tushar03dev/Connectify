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
console.log(`.env.${env}`);

const videoProxyOptions: Options = {
    target: process.env.VIDEO_SERVER_URL,
    changeOrigin: true,
    pathRewrite: {
        '^/video/play': '/play',
        '^/video': '/',
    }
} as any;

const app = express();

const allowedOrigins = [process.env.FRONTEND_URL];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS: " + origin));
        }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/auth', authRoutes);
app.use('/rooms', roomRoutes);
app.use('/video', authenticateToken, createProxyMiddleware(videoProxyOptions));

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('Server error:', err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

const socketProxy = createProxyMiddleware({
    target: process.env.VIDEO_SERVER_URL,
    changeOrigin: true,
    ws: true,
    pathRewrite: {
        '^/socket.io': '/socket.io',
    },
});

// Apply the proxy for WebSocket upgrades
app.use(socketProxy);

// Start HTTP server
const PORT = process.env.API_GATEWAY_PORT;
const server = http.createServer(app);

// Start listening
if(PORT){

   // to read requests for EC2
    server.listen(parseInt(PORT),'0.0.0.0', () => {
        console.log(`API Gateway running on http://localhost:${PORT}`);
    });

    // Handle WebSocket upgrade requests
    server.on('upgrade', (req, socket: Duplex, head) => {
        console.log('Upgrading WebSocket:', { url: req.url, headers: req.headers });
        if (socket instanceof net.Socket) {
            socketProxy.upgrade?.(req, socket, head);
        } else {
            console.error('Invalid socket type for upgrade');
            socket.destroy();
        }
    });
} else{
    console.error("PORT not defined");
}
