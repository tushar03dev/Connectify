import jwt from 'jsonwebtoken';
import {User} from "../models/userModel.js";

export function authenticateToken(req, res, next) {
    const token = req.headers.authorization.split(' ')[1];
    if (!token) {
        return res.status(401).send({message: 'Access denied. No token provided.'})
    }

    try{
        // Verify the token using the secret
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { userId } = decoded;

        // If no user found, reject with an error
        if (!userId) {
            res.status(401).json({ message: 'Invalid token: User not found.' });
            return;
        }
        req.body.userId = userId;
        next();
    }catch(error){
        return res.status(401).send({error: error})
    }
}