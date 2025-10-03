import dotenv from 'dotenv';
import express, {Request, Response, NextFunction} from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import connectDB from './config/db';
import { setupSocketIO } from './socket';
import videoRoutes from './routes/videoRoutes';

const env = process.env.NODE_ENV;
dotenv.config({ path: `.env.${env}` });

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: [`${process.env.API_GATEWAY_URL}`, `${process.env.FRONTEND_URL}`],
        methods: ['GET', 'POST'],
        credentials: true,
    },
    allowEIO3: true,
    transports: ['websocket', 'polling'],
    path: '/socket.io/',
});

setupSocketIO(io);

connectDB();

const allowedOrigins = [
    process.env.API_GATEWAY_URL,
    process.env.FRONTEND_URL,
];

app.use(cors({
    origin: function (origin, callback) {
        // allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));


app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));

app.use('/', videoRoutes);

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('Video service error:', err);
    res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.VIDEO_CHAT_SERVICE_PORT;

server.listen(PORT, () => {
    console.log(`Video Service running on http://localhost:${PORT}`);
    console.log(`Socket.IO path: /socket.io/`);
});

server.on('error', (error: any) => {
    console.error('Video service server error:', error);
});