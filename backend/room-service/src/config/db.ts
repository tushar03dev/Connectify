import mongoose from 'mongoose';
import dotenv from 'dotenv';

const env = process.env.NODE_ENV;
dotenv.config({ path: `.env.${env}` });

const uri = process.env.MONGO_URI as string;

export const connectDB = async () => {
    let attempts = 10;
    while (attempts > 0) {
        try {
            if (!uri) {
                throw new Error('MongoDB URI is not defined in the environment variables for Auth Service');
            }
            await mongoose.connect(uri,{});
            console.log('Connected to MongoDB');
            return;
        } catch (err) {
            console.log(`MongoDB connection failed. Retrying in 3s... (${11 - attempts}/10)`);
            attempts--;
            await new Promise(res => setTimeout(res, 3000));
        }
    }
    throw new Error('Failed to connect to MongoDB after 10 attempts');
};

export default connectDB;