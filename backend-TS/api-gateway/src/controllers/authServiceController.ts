import {Request,Response} from "express";
import axios from "axios";
import dotenv from "dotenv";
import {AuthRequest} from "../middleware/authMiddleware";
dotenv.config();
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL as string;
 const CHAT_SERVICE_URL = process.env.CHAT_SERVICE_URL as string;

export async function signInRequestToAuthService(req: Request, res:Response) {
    try {
        const {email, password} = req.body;
        const response = await axios.post(`${AUTH_SERVICE_URL}/auth/sign-in`,{email, password});
        if (response.data.success) {
            res.status(200).json(response.data);
        } else {
            res.status(500).json({ success: false, error: "Failed to send message." });
        }
    } catch (error) {
        console.error("[API Gateway] Failed to reach Auth Service  for sign-in:", error);
    }
}

export async function signUpRequestToAuthService(req:Request, res:Response) {
    try {
        const {name, email, password} = req.body;
        const response = await axios.post(`${AUTH_SERVICE_URL}/auth/sign-up`,{name, email, password});
    if (response.data.success) {
        res.status(200).json(response.data);
    } else {
        res.status(500).json({ success: false, error: "Failed to send message." });
    }
    } catch (error) {
        console.error("[API Gateway] Failed to reach Auth Service for sign-up:", error);
    }
}

export async function otpVerificationRequestToAuthService(req:Request, res:Response) {
    try {
        const {otpToken, otp} = req.body;
        const response = await axios.post(`${AUTH_SERVICE_URL}/otp/verify`, {otpToken, otp});
        if (response.data.success) {
    res.status(200).json(response.data);
} else {
    res.status(500).json({ success: false, error: "Failed to send message." });
}
    } catch (error) {
        console.error("[API Gateway] Failed to reach Auth Service for otp verification:", error);
    }
}
export async function sendSocketRequestToServer(req:AuthRequest, res:Response) {
    try{
        if(!req.user){
            console.error("user not found");
            return;
        }
        const userId = req.user.userId;
        if(!userId){
            console.error("req.user does not contain userId");
            return;
        }
        const response = await axios.post(`${CHAT_SERVICE_URL}/socket/connect`,{},{
            headers:{
                "user-id":userId
            }
        });
        if (response.data.success) {
            console.log(response.data);
            res.status(200).json({success: true, msg: response.data});
        } else{
            res.status(500).json({ success: false, error: "Socket not established" });
        }
    } catch (error) {
        console.error("[API Gateway] Failed to reach Chat Server for socket establishment", error);
    }
}