import { Room } from "../models/roomModel.js";

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
