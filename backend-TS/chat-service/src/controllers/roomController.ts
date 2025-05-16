import { Room } from "../models/roomModel"

export const createRoom = async(req:Request, res:Response) =>{
    const {name, code, userId } = req.body;
    const roomExists = await Room.findOne({ code });
    if (!roomExists) {
        return res.status(400).json({message: 'Room not exists'});
    }

}