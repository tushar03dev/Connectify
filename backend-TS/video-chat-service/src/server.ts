import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import bodyParser from 'body-parser';
import connectDB from './config/db';
import { setupSocketIO } from './socket';
import videoRoutes from './routes/videoRoutes';

dotenv.config();

const app = express();
const server = http.createServer(app);

const API_GATEWAY_URL = process.env.API_GATEWAY_URL;
const FRONTEND_URL = process.env.FRONTEND_URL;

// Configure Socket.IO with proper CORS settings
const io = new Server(server, {
    cors: {
        origin: [`${API_GATEWAY_URL}`, `${FRONTEND_URL}`],
        methods: ['GET', 'POST'],
        credentials: true,
    },
    allowEIO3: true,
    transports: ['websocket', 'polling'],
    path: '/socket.io/',
});

// Initialize Socket.IO logic
setupSocketIO(io);

// Database Connection
connectDB();

// Middleware
app.use(cors({
    origin: [`${API_GATEWAY_URL}`, `${FRONTEND_URL}`],
    credentials: true,
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/video', videoRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Video service error:', err);
    res.status(500).json({ message: 'Internal server error' });
});

// Start Server
const PORT = process.env.PORT;

server.listen(PORT, () => {
    console.log(`Video Service running on http://localhost:${PORT}`);
    console.log(`CORS configured for: ${API_GATEWAY_URL}, ${FRONTEND_URL}`);
    console.log(`Socket.IO path: /socket.io/`);
});

// Handle server errors
server.on('error', (error: any) => {
    console.error('Video service server error:', error);
});