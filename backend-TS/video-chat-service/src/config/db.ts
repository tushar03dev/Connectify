import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
    try {
        const uri = process.env.MONGO_URI as string;  // Fetch the URI from env
        if (!uri) {
            throw new Error('MongoDB URI is not defined in the environment variables for Auth Service');
        }
        await mongoose.connect(uri,{});
        console.log('MongoDB connected for Auth Service');
    } catch (error) {
        console.error('MongoDB connection error for Auth Service:', error);
        process.exit(1); // Exit the process with failure
    }
};


export default connectDB;
