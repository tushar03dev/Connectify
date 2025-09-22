import express from "express";
import {
    changePasswordRequestToAuthService,
    otpVerificationRequestToAuthService, passwordResetRequestToAuthService,
    signInRequestToAuthService,
    signUpRequestToAuthService
} from "../controllers/authServiceController";

const router = express.Router();

router.post("/sign-in",signInRequestToAuthService);

router.post("/sign-up",signUpRequestToAuthService);

router.post("/verify",otpVerificationRequestToAuthService);

router.post("/password-reset",passwordResetRequestToAuthService);

router.post("/change-password",changePasswordRequestToAuthService);

router.get("/google", (req, res) => {
    res.redirect(`${process.env.AUTH_SERVICE_URL}/auth/google`);
});

router.get("/auth/google/callback", (req, res) => {
    res.redirect(`${process.env.AUTH_SERVICE_URL}/auth/google/callback${req.url}`);
});

router.get("/auth/apple", (req, res) => {
    res.redirect(`${process.env.AUTH_SERVICE_URL}/auth/apple`);
});

router.post("/auth/apple/callback", (req, res) => {
    res.redirect(`${process.env.AUTH_SERVICE_URL}/auth/apple/callback`);
});

export default router;