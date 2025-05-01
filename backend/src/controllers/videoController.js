import {Room} from "../models/roomModel.js";
import {Video} from "../models/videoModel.js";


export const uploadVideo = async (req, res) => {
    try {
        // Extract video file details from the request
        const { filename, path: filePath } = req.file;
        const {code} = req.body;
        const room = await Room.findOne({code:code});
        if (!room) {
            return res.status(400).send({error: 'Room not found'});
        }
        // Create a new video record in the database
        const video = new Video({
            filename,
            filePath,
            originalName: req.file.originalname,
            roomId: room._id,
        });

        await video.save(); // Save video metadata to MongoDB

        res.json({
            message: 'Video uploaded successfully',
            video: {
                id: video._id,
                filename: video.filename,
                originalName: video.originalName,
            },
        });
    } catch (error) {
        console.error('Error uploading video:', error);
        res.status(500).json({ message: 'Error uploading video' });
    }
}

export const getVideos = async (req, res) => {
    const { roomId } = req.params.roomId;
    const room = await Room.findById(roomId);
    if (!room) {
        return res.status(404).json({message: 'Room not found'});
    }
    const videos = await Video.find({ roomId: roomId }).select('_id filename');
    if (!videos) {
        return res.status(404).json({message: 'Video not found'});
    }

    return res.status(200).json(videos);
}