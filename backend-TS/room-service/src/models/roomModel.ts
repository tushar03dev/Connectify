import mongoose, {Document, Schema} from "mongoose";

export interface IRoom extends Document {
    name: string;
    code: string;
    members?: mongoose.Types.ObjectId[];
    currentVideo?: {
        videoId: mongoose.Types.ObjectId;
        isPlaying: boolean;
        currentTime: number;
    };
}

const RoomSchema = new mongoose.Schema<IRoom>({
    code: { type: String, required: true, unique: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    currentVideo: {
        videoId: { type: mongoose.Schema.Types.ObjectId, ref: "Video" },
        isPlaying: { type: Boolean, default: false },
        currentTime: { type: Number, default: 0 },
    }
}, {
    collection: 'rooms'
});

export const Room = mongoose.model<IRoom>('Room',RoomSchema);