import mongoose, {Document, Schema} from "mongoose";

export interface IRoom extends Document {
    name: string;
    code: string;
    members?: mongoose.Types.ObjectId[];
}

const RoomSchema = new mongoose.Schema<IRoom>({
    name: { type: String, required: true},
    code: { type: String, required: true},
    members: [{ type: Schema.Types.ObjectId, ref: 'User',  default: [], required: true}] ,
}, {
    collection: 'rooms'
});

export const Room = mongoose.model<IRoom>('Room',RoomSchema);