import {Room} from "../models/roomModel"
import {Request, Response} from "express"
import {User} from "../models/userModel";

export const createRoom = async (req: Request, res: Response) => {
    try {
        const {name, code, userId} = req.body;
        const roomExists = await Room.findOne({code});
        if (roomExists) {
            return res.status(400).json({message: 'Room already exists'});
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

export const joinRoom = async (req: Request, res: Response) => {
    try {
        const {code, userId} = req.body;
        const room = await Room.findOne({code});

        if (!room) {
            return res.status(404).json({success: false, message: 'Room not found'});
            ``
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

export const getRooms = async (req: Request, res: Response) => {
    try {
        const { userId } = req.body;
        if(!userId) {
            return res.status(400).json({success: false, message: 'User ID is required'});
        }

        const user = await User.findOne({email: userId});
        if (!user) {
            return res.status(404).json({success: false, message: 'User not found'});
        }

        const rooms = await Room.find({members: user._id});
        res.status(200).json({success: true, rooms: rooms});
    } catch (error) {
        console.error(error);
        res.status(500).json({success: false, message: 'Internal server error'});
    }
}