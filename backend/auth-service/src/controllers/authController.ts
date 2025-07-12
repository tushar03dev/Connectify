import  { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {User} from '../models/userModel';
import dotenv from 'dotenv';
import {sendOTP, verifyOTP} from "./otpController";
import {publishToQueue} from "../config/rabbitmq";
import {getRedisClient} from '../config/redis';

const env = process.env.NODE_ENV;
dotenv.config({ path: `.env.${env}` });

export const signUp = async (req: Request, res: Response, next: NextFunction) => {
    const {name, email, password} = req.body;

    // Check if all required fields are present
    if (!name || !email || !password) {
        return res.status(400).json({ message: 'email and password are required.' });
    }

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).send('User already exists.');
        }

        // Send OTP
        const otpToken = await sendOTP(email);

        // Store user temporarily in Redis using the OTP token as key
        const tempUserData = JSON.stringify({ name, email, password });
        const redisClient = getRedisClient();
        await redisClient.setEx(`signup:${otpToken}`, 300, tempUserData); // Expires in 5 minutes

        return res.status(200).json({success: true, otpToken, message: 'OTP sent to your email. Please enter the OTP to complete sign-up.' });
    } catch (err) {
        next(err);
    }
};

export const completeSignUp = async (req: Request, res: Response, next: NextFunction) => {
    const { otpToken, otp } = req.body;

    if (!otpToken || !otp) {
        res.status(400).json({ message: 'Token and OTP are required.' });
        return;
    }

    try {
        const otpVerificationResult = await verifyOTP(otpToken, otp);

        // If OTP verification was successful, proceed with account creation
        if (otpVerificationResult.success) {
            const redisClient = getRedisClient();
            const userDataStr = await redisClient.get(`signup:${otpToken}`);
            if (!userDataStr) {
                return res.status(400).json({ message: 'No user data found or token expired.' });
            }

            const { name, email, password } = JSON.parse(userDataStr);

            // Generate JWT token
            const token = jwt.sign({ email: email }, process.env.JWT_SECRET as string, { expiresIn: "1d" });

            await publishToQueue("authQueue", { name, email, password });

            await redisClient.del(`signup:${otpToken}`); // Clean up Redis entry

            // Respond with token and success message
            res.status(201).json({success: true, token, message: 'User signed up successfully.' });
        } else {
            // OTP verification failed
            res.status(400).json({ message: otpVerificationResult.message });
        }
    } catch (err) {
        next(err);
    }
};


export const signIn = async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            res.status(400).send('User does not exist.');
            return;
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            res.status(400).send('Invalid password');
            return;
        }

        const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET as string, { expiresIn: '1d' });

        res.json({success: true, token, name:user.name });
        return;
    } catch (err) {
        next(err);
    }
};

export const passwordReset = async (req: Request, res: Response, next: NextFunction) => {
   try{

    const { email } = req.body;

    const user = await User.find({email : email});
    if (!user) {
        res.status(400).json({msg :'User does not exist.'});
    }

    await passwordResetMail(email);

    res.status(201).send('Otp verification mail sent.');

   } catch (err) {
       next(err);
   }
}


