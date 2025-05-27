import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import bodyParser from 'body-parser';
import http from 'http';
import authRoutes from './routes/authRoutes';
import videoRoutes from './routes/videoRoutes';
import roomRoutes from './routes/roomRoutes';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { io as ClientIO, Socket as ClientSocket } from 'socket.io-client';

dotenv.config();

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/auth', authRoutes);
app.use('/rooms', roomRoutes);
app.use('/video', videoRoutes);

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('Server error:', err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

server.listen(PORT, () => {
    console.log(`API Gateway running on http://localhost:${PORT}`);
    console.log(`VIDEO_SERVER_URL: ${process.env.VIDEO_SERVER_URL}`);
});

const io = new SocketIOServer(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
    path: '/socket.io/',
});

io.on('connection', (clientSocket: Socket) => {
    const token = clientSocket.handshake.auth?.token;
    console.log(`Frontend connected: ${clientSocket.id}, Token: ${token}`);

    const chatSocket: ClientSocket = ClientIO(process.env.VIDEO_SERVER_URL!, {
        auth: { token },
        transports: ['websocket', 'polling'], // Allow polling fallback
        path: '/socket.io/',
    });

    chatSocket.on('connect', () => {
        console.log(`API Gateway connected to VC Server: ${chatSocket.id}`);
    });

    chatSocket.on('connect_error', (error) => {
        console.error('API Gateway to VC Server connection error:', error.message, error);
    });

    chatSocket.on('connect_timeout', () => {
        console.error('API Gateway to VC Server connection timeout');
    });

    clientSocket.onAny((event, ...args) => {
        console.log(`Forwarding event from frontend: ${event}`, args);
        chatSocket.emit(event, ...args);
    });

    chatSocket.onAny((event, ...args) => {
        console.log(`Forwarding event from VC Server: ${event}`, args);
        clientSocket.emit(event, ...args);
    });

    clientSocket.on('disconnect', () => {
        chatSocket.disconnect();
        console.log(`Frontend disconnected: ${clientSocket.id}`);
    });

    chatSocket.on('disconnect', () => {
        console.log('ChatSocket disconnected from VC Server');
        clientSocket.disconnect();
    });
});