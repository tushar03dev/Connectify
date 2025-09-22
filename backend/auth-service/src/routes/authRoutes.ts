import { Router, Request, Response, NextFunction } from "express";
import axios, { AxiosResponse } from "axios";
import jwt from "jsonwebtoken";
import {User} from "../models/userModel";
import {
    signUp,
    signIn,
    passwordReset,
    changePassword, googleLogin,
} from "../controllers/authController";

const router = Router();

// User sign-up
router.post("/sign-up", signUp);
router.post("/sign-in", signIn);
router.post("/password-reset", passwordReset);
router.post("/change-password", changePassword);

// Google login & signup
router.get("/google", googleLogin);

export default router;
