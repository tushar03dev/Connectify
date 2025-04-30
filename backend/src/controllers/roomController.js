import { Room } from "../models/roomModel.js";
import {User} from "../models/userModel.js";

export const createRoom = async (req, res) => {

    const { name, code, userId } = req.body;
    const roomExists = await Room.findOne({ code });

    if (roomExists) {
        return res.status(400).json({ message: 'Room already exists' });
    }

    const room = new Room({ code, name, users: [userId] });
    await room.save();
    res.status(201).json(room);
}

export const joinRoom = async (req, res) => {

    const { code, userId } = req.body;
    const room = await Room.findOne({ code });

    if (!room) {
        return res.status(404).json({ message: 'Room not found' });
    }

    room.members.push(userId);
    await room.save();
    res.json({ message: 'Joined successfully', room });
}

export const getRooms = async (req, res) => {
    const { userId } = req.body;

    const rooms = await Room.find({
        members: {$elemMatch: {userId: userId}},
    });

    res.status(200).json(rooms);
}

export const setupSocketIO = (io) => {
    io.on("connection", (socket) => {
        console.log("A user connected:", socket.id);

        socket.on("joinRoom", async ({ roomId, user }) => {
            let room = await Room.findOne({ code: roomId });

            if (!room) {
                room = new Room({ code: roomId, users: [user] });
            } else {
                if (!room.users.includes(user)) {
                    room.users.push(user);
                }
            }
            await room.save();

            socket.join(roomId);
            io.to(roomId).emit("roomUsers", room.users);
        });

        socket.on("sendMessage", ({ roomId, message }) => {
            io.to(roomId).emit("receiveMessage", message);
        });

        socket.on("leaveRoom", async ({ roomId, user }) => {
            const room = await Room.findOne({ code: roomId });

            if (room) {
                room.users = room.users.filter((u) => u !== user);
                await room.save();

                socket.leave(roomId);
                io.to(roomId).emit("roomUsers", room.users);
            }
        });

        socket.on("disconnect", () => {
            console.log("User disconnected:", socket.id);
        });
    });
};
