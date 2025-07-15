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

export default router;