import { Room } from "../models/roomModel"
import { Request, Response } from "express"

export const createRoom = async(req:Request, res:Response) =>{
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

