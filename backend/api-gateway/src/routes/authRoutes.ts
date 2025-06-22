import express from "express";
import {
    otpVerificationRequestToAuthService,
    signInRequestToAuthService,
    signUpRequestToAuthService
} from "../controllers/authServiceController";

const router = express.Router();

router.post("/sign-in",signInRequestToAuthService);

router.post("/sign-up",signUpRequestToAuthService);

router.post("/verify",otpVerificationRequestToAuthService);

export default router;