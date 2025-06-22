import {Request, Response} from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL as string;

export async function signInRequestToAuthService(req: Request, res: Response) {
    try {
        const {email, password} = req.body;
        const response = await axios.post(`${AUTH_SERVICE_URL}/auth/sign-in`, {email, password});
        if (response.data.success) {
            res.status(200).json({ token: response.data.token, name:response.data.name, message: response.data.message });
        } else {
            res.status(500).json({success: false, error: "Failed to send message."});
        }
    } catch (error) {
        console.error("[API Gateway] Failed to reach Auth Service  for sign-in:", error);
    }
}

export async function signUpRequestToAuthService(req: Request, res: Response) {
    try {
        const {name, email, password} = req.body;
        console.log(name, email, password);
        const response = await axios.post(`${AUTH_SERVICE_URL}/auth/sign-up`, {name, email, password});
        if (response.data.success) {
            res.status(200).json({otpToken: response.data.otpToken, message: response.data.message});
        } else {
            res.status(500).json({success: false, error: "Failed to send message."});
        }
    } catch (error) {
        console.error("[API Gateway] Failed to reach Auth Service for sign-up:", error);
    }
}

export async function otpVerificationRequestToAuthService(req: Request, res: Response) {
    try {
        const {otpToken, otp} = req.body;
        const response = await axios.post(`${AUTH_SERVICE_URL}/otp/verify`, {otpToken, otp});
        if (response.data.success) {
            res.status(200).json({token: response.data.token, message: response.data.message});
        } else {
            res.status(500).json({success: false, error: "Failed to send message."});
        }
    } catch (error) {
        console.error("[API Gateway] Failed to reach Auth Service for otp verification:", error);
    }
}