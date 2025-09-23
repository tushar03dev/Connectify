import {Request, Response} from "express";
import axios, {AxiosResponse} from "axios";
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

export const googleLogin = async(req: Request, res: Response) => {
    console.log("Google login request received");

    const scope = [
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/userinfo.email",
    ].join(" ");

    const redirectUri = `${process.env.AUTH_SERVER_URL}/auth/google/callback`;
    console.log("Redirect URI constructed:", redirectUri);

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${
        process.env.GOOGLE_CLIENT_ID
    }&redirect_uri=${encodeURIComponent(
        redirectUri
    )}&response_type=code&scope=${encodeURIComponent(scope)}`;

    console.log("Redirecting user to Google Auth URL:", authUrl);

    res.redirect(authUrl);
};

export const googleCallback = async(req: Request, res: Response) => {
    console.log("Google callback hit with query params:", req.query);

    const code = req.query.code as string | undefined;
    if (!code) {
        console.error("Missing authorization code in callback");
        res.status(400).json({ error: "Missing authorization code" });
        return;
    }

    try {
        const redirectUri = `${process.env.AUTH_SERVER_URL}/auth/google/callback`;
        console.log("Exchanging code for tokens with redirectUri:", redirectUri);

        // Exchange code for access token
        const tokenResponse: AxiosResponse<{
            access_token: string;
            expires_in: number;
            refresh_token?: string;
            id_token?: string;
        }> = await axios.post(
            "https://oauth2.googleapis.com/token",
            {
                code,
                client_id: process.env.GOOGLE_CLIENT_ID,
                client_secret: process.env.GOOGLE_CLIENT_SECRET,
                redirect_uri: redirectUri,
                grant_type: "authorization_code",
            },
            { headers: { "Content-Type": "application/json" } }
        );

        console.log("Token response received:", tokenResponse.data);

        const { access_token } = tokenResponse.data;
        if (!access_token) {
            console.error("No access token received from Google");
            res.status(500).json({ error: "Failed to get access token" });
            return
        }

        // Fetch user info
        console.log("Fetching user info with access_token");
        const userInfoResponse: AxiosResponse<{
            id: string;
            email: string;
            name: string;
            picture: string;
        }> = await axios.get("https://www.googleapis.com/oauth2/v2/userinfo", {
            headers: { Authorization: `Bearer ${access_token}` },
        });

        console.log("User info received from Google:", userInfoResponse.data);

        const response = await axios.post(`${AUTH_SERVICE_URL}/auth/save`, userInfoResponse.data);
        if(response.data.success) {
            // Redirect back to frontend
            const redirectUrl = `${process.env.FRONTEND_URL}/oauth-success?token=${encodeURIComponent(
                response.data.token
            )}&user=${encodeURIComponent(JSON.stringify(response.data.user))}`;

            console.log("Redirecting user back to frontend:", redirectUrl);

            res.redirect(redirectUrl);
        }
    } catch (error) {
        console.error("Error during Google authentication:", error);
        res.status(500).send("Google authentication failed");
    }
}