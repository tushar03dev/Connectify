import { Room } from "../models/roomModel.js";

export const createRoom = async (req, res) => {

    const { name, code, userId } = req.body;
    const roomExists = await Room.findOne({ code });

    if (roomExists) {
        return res.status(400).json({ message: 'Room already exists' });
    }

    const room = new Room({ code, name, members: [userId] });
    await room.save();
    res.status(201).json({room:room});
}

export const joinRoom = async (req, res) => {

    const { code, userId } = req.body;
    const room = await Room.findOne({ code });

    if (!room) {
        return res.status(404).json({ message: 'Room not found' });
    }

    if(!room.members.includes(userId)){
        room.members.push(userId);
        await room.save();
    }

    res.json({ message: 'Joined successfully', room });
}

export const getRooms = async (req, res) => {
    const { userId } = req.body;

    const rooms = await Room.find({
        members: userId,
    });
    console.log(rooms);
    res.status(200).json({rooms:rooms});
}

export const deleteRoom = async (req, res) => {
    const roomId = req.params.roomId;
    try {
        const room = await Room.findByIdAndDelete(roomId);
        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }
        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error deleting room:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};


