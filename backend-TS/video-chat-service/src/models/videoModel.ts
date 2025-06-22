import mongoose, { Document, Schema } from 'mongoose';

export interface IVideo extends Document {
    filename: string;
    originalName: string;
    filePath: string; // S3 key
    roomId: mongoose.Types.ObjectId;
    contentType: string;
    size: number;
    uploadDate: Date;
}

const VideoSchema = new mongoose.Schema<IVideo>(
    {
        filename: { type: String, required: true },
        originalName: { type: String, required: true },
        filePath: { type: String, required: true, unique: true }, // S3 key, unique to prevent duplicates
        roomId: { type: Schema.Types.ObjectId, ref: 'Room', required: true },
        contentType: { type: String, required: true }, // MIME type of the video
        size: { type: Number, required: true }, // File size in bytes
    },
    {
        timestamps: { createdAt: 'uploadDate', updatedAt: 'updatedAt' }, // Explicitly name timestamps
    }
);

export const Video = mongoose.model<IVideo>('Video', VideoSchema);