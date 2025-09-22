import { Router } from "express";
import {
    signUp,
    signIn,
    passwordReset,
    changePassword, googleLogin, googleCallback
} from "../controllers/authController";

const router = Router();

// User sign-up
router.post("/sign-up", signUp);
router.post("/sign-in", signIn);
router.post("/password-reset", passwordReset);
router.post("/change-password", changePassword);

// Google login & signup
router.get("/google", googleLogin);
router.get("/google/callback", googleCallback);

// Apple login & signup
router.get("/google", appleLogin);
router.get("/google/callback", appleCallback);

export default router;
