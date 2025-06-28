import express from 'express';
import {Response} from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db';
import bodyParser from 'body-parser';
import cors from 'cors';
import otpRoutes from "./routes/otpRoutes";
import {authConsumer} from "./consumers/authConsumer";
import {connectRedis} from "./config/redis";

const env = process.env.NODE_ENV;
dotenv.config({ path: `.env.${env}` });

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// MongoDB Connection
connectDB().then(async ()=> {
    await authConsumer();
    await connectRedis().then( async() => {
        const authRoutes = (await import('./routes/authRoutes')).default;
        app.use('/auth', authRoutes);
        }
    );

});


app.use('/otp',otpRoutes);

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
