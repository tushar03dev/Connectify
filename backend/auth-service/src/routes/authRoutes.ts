import { Router } from "express";
import {
    signUp,
    signIn,
    passwordReset,
    changePassword, googleSave,
} from "../controllers/authController";

const router = Router();

// User sign-up
router.post("/sign-up", signUp);
router.post("/sign-in", signIn);
router.post("/password-reset", passwordReset);
router.post("/change-password", changePassword);

// save data
router.post("/save", googleSave);

export default router;