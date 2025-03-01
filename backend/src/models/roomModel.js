import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },
    users: [{ type: String }]
});

export const Room = mongoose.model('rooms', roomSchema);
