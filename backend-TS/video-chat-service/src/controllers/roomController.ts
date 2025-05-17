import {Room} from "../models/roomModel"
import {Request, Response} from "express"
import {User} from "../models/userModel";

export const createRoom = async (req: Request, res: Response):Promise<void> => {
    try {
        const {name, code, userId} = req.body;
        const roomExists = await Room.findOne({code});
        if (roomExists) {
            res.status(400).json({message: 'Room already exists'});
            return;
        }

        const room = new Room({
            name,
            code,
            members: [userId],
        });
        await room.save();
        res.status(201).json({success: true, room: room});
    } catch (error) {
        console.error(error);
        res.status(500).json({success: false, message: 'Internal server error'});
    }
}

export const joinRoom = async (req: Request, res: Response):Promise<void> => {
    try {
        const {code, userId} = req.body;
        const room = await Room.findOne({code});

        if (!room) {
            res.status(404).json({success: false, message: 'Room not found'});
            return;
        }

        if (Array.isArray(room.members)) {
            if (room.members.includes(userId)) {
                room.members.push(userId);
                await room.save();
            }
        }
        res.status(200).json({success: true, room});
    } catch (error) {
        console.error(error);
        res.status(500).json({success: false, message: 'Internal server error'});
    }
}

export const getRooms = async (req: Request, res: Response):Promise<void> => {
    try {
        const userId  = req.params.userId;
        if(!userId) {
            res.status(400).json({success: false, message: 'User ID is required'});
            return;
        }

        const user = await User.findOne({email: userId});
        if (!user) {
            res.status(404).json({success: false, message: 'User not found'});
            return;
        }

        const rooms = await Room.find({members: user._id});
        res.status(200).json({success: true, rooms: rooms});
    } catch (error) {
        console.error(error);
        res.status(500).json({success: false, message: 'Internal server error'});
    }
}

export const deleteRoom = async (req: Request, res: Response):Promise<void> => {
    try {
        const roomId = req.params.roomId;
        const room = await Room.findByIdAndDelete(roomId);
        if (!room) {
            res.status(404).json({success: false, message: 'Room not found'});
            return;
        }
        res.status(200).json({success: true, message: 'Room deleted successfully'});
    } catch (error) {
        console.error(error);
        res.status(500).json({success: false, message: 'Internal server error'});
    }
}