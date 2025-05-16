import mongoose, { Document } from "mongoose";

export interface IRoom extends Document {
    name: string;
    code: string;
    members?: mongoose.Types.ObjectId[];
}

const RoomSchema = new mongoose.Schema<IRoom>({
    name: { type: String, required: true},
    code: { type: String, required: true},
    members: [{ type: mongoose.Types.ObjectId, ref: 'User' }] ,
});

export const Room = mongoose.model<IRoom>('rooms',RoomSchema);