import mongoose from 'mongoose';

const videoSchema = new mongoose.Schema({
    filename: {
        type: String,
        required: true
    },
    originalName: {
        type: String,
        required: true
    },
    filePath: {
        type: String,
        required: true
    },
}, { timestamps: true });

const Video = mongoose.model('Video', videoSchema);

export { Video };
