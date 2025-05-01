// User Schema and Model
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    rooms:[{type: mongoose.Schema.Types.ObjectId, ref: "Room"}],
    videos:[{type: mongoose.Schema.Types.ObjectId, ref: "Video"}],
});

export const User = mongoose.model('users', userSchema);

