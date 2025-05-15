import mongoose, { Document, Schema } from 'mongoose';

export interface IVideo extends Document {
    filename:string,
    originalName: string,
    filePath:string,
    roomId: mongoose.Types.ObjectId;
}

const VideoSchema = new mongoose.Schema<IVideo>({
    filename: {type: String, required: true},
    originalName: {type: String, required: true},
    filePath: {type: String, required: true},
    roomId: {type: Schema.Types.ObjectId, ref: 'Room',required: true},
});

const Video = mongoose.model<IVideo>('Video',VideoSchema);