import {Request, Response, NextFunction} from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {User} from '../models/userModel';
import dotenv from 'dotenv';
import {passwordResetMail, sendOTP} from "./otpController";
import {publishToQueue} from "../config/rabbitmq";
import {getRedisClient} from '../config/redis';
import {signUpPayload} from "../types/signUp";
import {completeSignUpPayload} from "../types/completeSignup";
import {signInPayload} from "../types/signIn";
import {emailOnlyPayload} from "../types/passwordReset";
import {changePasswordPayload} from "../types/changePassword";
import zod, { ZodError } from 'zod';
import axios from "axios";

function flattenZodError(err: ZodError) {
    return err.flatten().fieldErrors;
}

const env = process.env.NODE_ENV;
dotenv.config({path: `.env.${env}`});

const redirectUri = "http://localhost:3000/auth/google/callback";

export const signUp = async (req: Request, res: Response, next: NextFunction) => {
    const createPayload = req.body;
    const parsedPayload = signUpPayload.safeParse(createPayload);

    if(!parsedPayload.success) {
        const errors = flattenZodError(parsedPayload.error);
        console.log(errors);
        res.json({ message: "Invalid input", errors });
        return;
    }

    try {
        const existingUser = await User.findOne({email: createPayload.email});
        if (existingUser) {
            console.debug('User already exists', existingUser);
            res.status(400).json({ errors: 'USER_ALREADY_EXISTS' });
            return
        }

        // Send OTP
        const otp = await sendOTP(createPayload.email);
        if (!otp) {
            res.status(400).json({errors : 'Otp Not Found'});
            return;
        }

        // Store user temporarily in Redis using the OTP token as key
        const tempUserData = JSON.stringify({name: createPayload.name, password: createPayload.password});
        const redisClient = getRedisClient();
        await redisClient.setEx(`otp:${createPayload.email}`, 300, otp);
        await redisClient.setEx(`signup:${createPayload.email}`, 300, tempUserData); // Expires in 5 minutes

        return res.status(200).json({
            success: true,
            message: 'OTP sent to your email. Please enter the OTP to complete sign-up.'
        });
    } catch (err) {
        next(err);
    }
};

export const completeSignUp = async (req: Request, res: Response, next: NextFunction) => {
    const createPayload = req.body;
    const parsedPayload = completeSignUpPayload.safeParse(req.body);

    if(!parsedPayload.success) {
        const errorTree = zod.treeifyError(parsedPayload.error);
        res.status(401).json({ message: "Invalid input", errors: errorTree });
        return;
    }

    try {
        const redisClient = getRedisClient();
        const savedOtp = await redisClient.get(`otp:${createPayload.email}`);

        if (savedOtp && createPayload.otp === savedOtp) {

            const userDataStr = await redisClient.get(`signup:${createPayload.email}`);
            if (!userDataStr) {
                return res.status(400).json({message: 'No user data found or token expired.'});
            }

            const {name, password} = JSON.parse(userDataStr);

            // Generate JWT token
            const token = jwt.sign({email: createPayload.email}, process.env.JWT_SECRET as string, {expiresIn: "1d"});

            await publishToQueue("authQueue", {name, email: createPayload.email, password});

            await redisClient.del([`signup:${createPayload.email}`, `otp:${createPayload.email}`]); // Clean up Redis entry

            // Respond with token and success message
            res.status(201).json({success: true, token, message: 'User signed up successfully.'});
        } else {
            // OTP verification failed
            res.status(400).json({message: 'Invalid or expired otp'});
        }
    } catch (err) {
        next(err);
    }
};

export const signIn = async (req: Request, res: Response, next: NextFunction) => {
    const createPayload = req.body;
    const parsedPayload = signInPayload.safeParse(createPayload);

    if(!parsedPayload.success) {
        const errorTree = zod.treeifyError(parsedPayload.error);
        res.status(401).json({ message: "Invalid input", errors: errorTree });
        return;
    }

    try {
        const user = await User.findOne({email: createPayload.email});
        if (!user) {
            res.status(400).send('User does not exist.');
            return;
        }

        const isMatch = await bcrypt.compare(createPayload.password, user.password);
        if (!isMatch) {
            res.status(400).send('Invalid password');
            return;
        }

        const token = jwt.sign({email: user.email}, process.env.JWT_SECRET as string, {expiresIn: '1d'});

        res.json({success: true, token, name: user.name});
        return;
    } catch (err) {
        next(err);
    }
};

export const passwordReset = async (req: Request, res: Response, next: NextFunction) => {
    const createPayload = req.body;
    const parsedPayload = emailOnlyPayload.safeParse(createPayload);

    if(!parsedPayload.success) {
        const errorTree = zod.treeifyError(parsedPayload.error);
        res.status(401).json({ message: "Invalid input", errors: errorTree });
        return;
    }

    try {

        const user = await User.find({email: createPayload.email});
        if (!user) {
            res.status(400).json({msg: 'User does not exist.'});
        }

        const otp = await passwordResetMail(createPayload.email);
        const redisClient = getRedisClient();
        await redisClient.setEx(`otp:${createPayload.email}`, 300, otp);

        res.status(201).json({success: true, msg: 'Otp verification mail sent.'});

    } catch (err) {
        next(err);
    }
}

export const changePassword = async (req: Request, res: Response, next: NextFunction) => {
    const createPayload = req.body;
    const parsedPayload = changePasswordPayload.safeParse(createPayload);

    if(!parsedPayload.success) {
        const errorTree = zod.treeifyError(parsedPayload.error);
        res.status(401).json({ message: "Invalid input", errors: errorTree });
        return;
    }

    try {
        const redisClient = getRedisClient();
        const savedOtp = await redisClient.get(`otp:${createPayload.email}`);

        if (savedOtp && createPayload.otp === savedOtp) {
            const user = await User.find({email: createPayload.email});
            if (!user) {
                res.status(400).json({msg: 'User does not exist.'});
            }

            const hashedPassword = await bcrypt.hash(createPayload.password, 10);
            if (!hashedPassword) {
                res.status(400).send('Invalid password');
            }

            await User.updateOne({email: createPayload.email}, {password: hashedPassword});
            await redisClient.del(`otp:${createPayload.email}`);
            
            res.status(200).json({success: true, msg: 'Password updated'});
        } else {
            res.status(400).send('Invalid or Expired OTP');
        }
    } catch (err) {
        next(err);
    }
}

export const googleLogin = (req: Request, res: Response) => {
    const scope = [
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/userinfo.email",
    ].join(" ");

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID
    }&redirect_uri=${redirectUri}&response_type=code&scope=${encodeURIComponent(scope)}`;

    res.redirect(authUrl);
};

