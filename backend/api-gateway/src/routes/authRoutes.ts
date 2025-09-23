import express from "express";
import {
    changePasswordRequestToAuthService, googleCallback, googleLogin,
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

router.get("/google", googleLogin);

router.get("/auth/google/callback",googleCallback);

export default router;