import {Request, Response, NextFunction} from "express";
import {Room} from "../models/roomModel";
import {User} from "../models/userModel";
import mongoose from "mongoose";

export const checkAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        // Extract user email from headers
        const userEmail = req.headers["user-id"];
        if (!userEmail || typeof userEmail !== "string") {
            res.status(400).send({success: false, error: "Unauthorized: Email not provided."});
            return;
        }

        // Fetch sender (user) ID from the database using email
        const user = await User.findOne({email: userEmail});
        if (!user) {
            res.status(404).send({success: false, error: "User not found."});
            return;
        }

        const userId = user._id as mongoose.Types.ObjectId; // MongoDB ID of sender

        const {roomId} = req.body;
        if (!roomId) {
            res.status(500).json({error: "All fields are required"});
            return;
        }

        const room = await Room.findById(roomId);
        if (!room) {
            res.status(404).json({error: "Room not found"});
            return;
        }
        if (!room.admins) {
            res.status(404).json({error: "No Admins found"});
            return;
        }

        if (!room.admins.includes(userId)) {
            res.status(404).json({error: "Doesn\'t have admin rights"});
            return;
        }
        req.body.room = room;
        req.body.userId = userId;
        next();
    } catch (error) {
        next(error);
    }
}