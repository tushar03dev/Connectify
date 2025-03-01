const express = require('express');
const Room = require('../models/Room');
const router = express.Router();

// Create Room
router.post('/create', async (req, res) => {
    const { code } = req.body;
    const roomExists = await Room.findOne({ code });

    if (roomExists) {
        return res.status(400).json({ message: 'Room already exists' });
    }

    const room = new Room({ code, users: [] });
    await room.save();
    res.status(201).json(room);
});

// Join Room
router.post('/join', async (req, res) => {
    const { code, userName } = req.body;
    const room = await Room.findOne({ code });

    if (!room) {
        return res.status(404).json({ message: 'Room not found' });
    }

    room.users.push(userName);
    await room.save();
    res.json({ message: 'Joined successfully', room });
});

module.exports = router;
