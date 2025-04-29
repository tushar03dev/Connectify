import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },
    members: [{ type: mongoose.Types.ObjectId, ref: "User", required: true }],
    name:{type: String, required: true},
});

export const Room = mongoose.model('rooms', roomSchema);
