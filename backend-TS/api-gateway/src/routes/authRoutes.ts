import express from "express";
import {
    otpVerificationRequestToAuthService, sendSocketRequestToServer,
    signInRequestToAuthService,
    signUpRequestToAuthService
} from "../controllers/authServiceController";
import {authenticateToken} from "../middleware/authMiddleware";

const router = express.Router();

router.post("/sign-in",signInRequestToAuthService);

router.post("/sign-up",signUpRequestToAuthService);

router.post("/verify",otpVerificationRequestToAuthService);

router.post("/connect",authenticateToken,sendSocketRequestToServer);

export default router;