const express = require('express');
const { makeid } = require('./utils/utils');
const axios = require('axios');

const app = express();
const server = require('http').createServer(app);
const io = require("socket.io")(server, {
    cors: { origin: "http://localhost:8000", methods: ["GET", "POST"] }
});

const users = {}; // Format: { socketId: { userName, roomCode } }

io.on('connection', (socket) => {
    socket.on('create-room', async () => {
        const roomCode = makeid(10);
        try {
            await axios.post('http://localhost:5000/api/rooms/create', { code: roomCode });
            socket.emit("room-created", roomCode);
        } catch (error) {
            socket.emit("error", error.response.data.message);
        }
    });

    socket.on('join-room', async (data) => {
        const { roomCode, userName } = data;
        try {
            await axios.post('http://localhost:5000/api/rooms/join', { code: roomCode, userName });
            socket.join(roomCode);
            users[socket.id] = { userName, roomCode };

            io.to(roomCode).emit('message', { userName: 'System', message: `${userName} has joined!` });
            socket.emit("joined", { roomCode });
        } catch (error) {
            socket.emit("error", error.response.data.message);
        }
    });

    socket.on('disconnect', () => {
        const user = users[socket.id];
        if (user) {
            delete users[socket.id];
            io.to(user.roomCode).emit('message', { userName: 'System', message: `${user.userName} left!` });
        }
    });
});

server.listen(3000, () => console.log("🚀 Sync Server running on 3000"));
