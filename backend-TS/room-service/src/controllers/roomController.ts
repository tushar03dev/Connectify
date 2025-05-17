import {Room} from "../models/roomModel"
import {Request, Response} from "express"

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

