import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import bodyParser from 'body-parser';
import connectDB from './config/db';
import { setupSocketIO } from './socket';
import videoRoutes from './routes/videoRoutes';

const env = process.env.NODE_ENV;
dotenv.config({ path: `.env.${env}` });

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ['GET', 'POST'],
        credentials: true,
    },
    allowEIO3: true,
    transports: ['websocket', 'polling'],
    path: '/socket.io/',
});

setupSocketIO(io);

connectDB();

app.use(cors({
    origin: "*",
    credentials: true,
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/', videoRoutes);

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Video service error:', err);
    res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.PORT;

server.listen(PORT, () => {
    console.log(`Video Service running on http://localhost:${PORT}`);
    console.log(`Socket.IO path: /socket.io/`);
});

server.on('error', (error: any) => {
    console.error('Video service server error:', error);
});