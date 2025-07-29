import {Request, Response} from "express";
import axios from "axios";
import dotenv from "dotenv";

const env = process.env.NODE_ENV;
dotenv.config({ path: `.env.${env}` });
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL as string;

export async function signInRequestToAuthService(req: Request, res: Response) {
    try {
        const {email, password} = req.body;
        const response = await axios.post(`${AUTH_SERVICE_URL}/auth/sign-in`, {email, password});
        if (response.data.success) {
            res.status(200).json({ token: response.data.token, name:response.data.name, message: response.data.message });
        }
        else if(response.status === 400) {
            res.status(400).json({success: false, error: response.data.errors});
        }
        else if(response.status === 401) {
            res.status(401).json({success: false, error: response.data.errors});
        }
        else {
            res.status(500).json({success: false, error: "Failed to send message."});
        }
    } catch (error) {
        console.error("[API Gateway] Failed to reach Auth Service  for sign-in:", error);
    }
}

export async function signUpRequestToAuthService(req: Request, res: Response) {
    try {
        const { name, email, password } = req.body;

        const response = await axios.post(`${AUTH_SERVICE_URL}/auth/sign-up`, {
            name,
            email,
            password,
        });
        console.log(response.data);

        // Success: Status 2xx
        res.status(200).json({
            success: response.data.success,
            message: response.data.message,
        });
    } catch (error: any) {
        console.error("[API Gateway] Auth Service error:", error.message);

        if (axios.isAxiosError(error) && error.response) {
            const data = error.response.data;

            res.json({
                success: false,
                errors: data?.errors || data?.message || "Auth service returned an error",
            });
        } else {
            // Unexpected or network error
            res.status(500).json({
                success: false,
                errors: "Internal server error",
            });
        }
    }
}

export async function otpVerificationRequestToAuthService(req: Request, res: Response) {
    try {
        const {email,otp} = req.body;
        const response = await axios.post(`${AUTH_SERVICE_URL}/otp/verify`, {email, otp});
        if (response.data.success) {
            res.status(200).json({token: response.data.token, message: response.data.message});
        }
        else if(response.status === 401) {
            res.status(401).json({success: false, error: response.data.errors});
        }
        else {
            res.status(500).json({success: false, error: "Failed to send message."});
        }
    } catch (error) {
        console.error("[API Gateway] Failed to reach Auth Service for otp verification:", error);
    }
}

export async function passwordResetRequestToAuthService(req: Request, res: Response) {
    try{
        const { email } = req.body;
        const response = await axios.post(`${AUTH_SERVICE_URL}/auth/password-reset`,{email})
        if (response.data.success) {
            res.status(200).json({success: true, message: response.data.msg});
        }
        else if(response.status === 401) {
            res.status(401).json({success: false, error: response.data.errors});
        }
        else {
            res.status(500).json({success: false, error: "Failed to send message."});
        }
    } catch (error) {
        console.error("[API Gateway] Failed to reach Auth Service for passwordReset Request:", error);
    }
}

export async function changePasswordRequestToAuthService(req: Request, res: Response) {
    try {
        const {email, password, otp} = req.body;

        const response = await axios.post(`${AUTH_SERVICE_URL}/auth/change-password`, {email, password, otp})
        if (response.data.success) {
            res.status(200).json({token: response.data.token, message: response.data.msg});
        }
        else if(response.status === 401) {
            res.status(401).json({success: false, error: response.data.errors});
        }
        else {
            res.status(500).json({success: false, error: "Failed to change password."});
        }
    } catch (error) {
        console.error("[API Gateway] Failed to reach Auth Service for change password request:", error);
    }
}