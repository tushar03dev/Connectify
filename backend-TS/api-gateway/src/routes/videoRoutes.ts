import express from "express";
import {authenticateToken} from "../middleware/authMiddleware";
import {createProxyMiddleware} from "http-proxy-middleware";

const router = express.Router();

const proxy = createProxyMiddleware;






export default router;
