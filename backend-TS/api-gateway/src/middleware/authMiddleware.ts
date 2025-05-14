import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

// Extend Express Request type to include `user`
export interface AuthRequest extends Request {
    user?: {
        userId?: string;
    };
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    console.log("Authentication token");
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({ message: 'Access denied. No token provided.' });
        return;
    }

    const token = authHeader.split(" ")[1];

    try {
        // Verify the token using the secret
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as jwt.JwtPayload;

        if (!decoded.email) {
            res.status(400).json({ message: "Invalid token: No email found" });
            return;
        }

        req.user = { userId: decoded.email };
        next();
    } catch (err) {
        const error = err as Error;
        if (error.name === 'TokenExpiredError') {
            res.status(403).json({ message: 'Token expired.' });
            return;
        }
        console.error('Token verification error:', error);
        res.status(403).json({ message: 'Invalid token.' });
    }
};
