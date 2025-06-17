"use client"

import type React from "react"
import { createContext, useContext, useState } from "react"
import axios from "axios"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

type Video = {
    _id : string
    originalName: string
    room: string
    filePath: string
    streamingUrl: string
}

type VideoContextType = {
    video: Video | null
    videos: Video[]
    uploadVideo: (file: File, roomCode: string) => Promise<Boolean>
    getVideos: (roomId : string) => Promise<boolean>
    deleteVideo: (videoId : string) => Promise<boolean>
    isLoading: boolean
}

const VideoContext = createContext<VideoContextType>({
    video: null,
    videos: [],
    uploadVideo: async () => false,
    getVideos: async () => false,
    deleteVideo: async () => false,
    isLoading: true,
})

export function VideoProvider({ children }: { children: React.ReactNode }) {
    const [video ] = useState<Video | null>(null)
    const [videos, setVideos] = useState<Video[]>([])
    const [isLoading, setIsLoading] = useState(false)

    const uploadVideo = async (file: File, roomCode: string) => {
        try {
            setIsLoading(true);

            const token = localStorage.getItem("token");
            if (!token) {
                console.log("Token not found");
                return false;
            }

            const formData = new FormData();
            formData.append("video", file);
            formData.append("roomCode", roomCode);

            const response = await axios.post(
                `${API_BASE_URL}/video/upload`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );

            return !!response.data?.video;

        } catch (error: any) {
            console.error("Error uploading video:", error);
            if (error.response) {
                console.log("Error response data:", error.response.data);
                console.log("Status:", error.response.status);
            }
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    const getVideos = async (roomId: string) => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem("token");
            if (!token) {
                console.log("Token not found");
                return false;
            }

            const response = await axios.get(
                `${API_BASE_URL}/video/get-videos/${roomId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.data?.videos) {
                setVideos(response.data.videos);
                return true;
            }
            return false;
        } catch (error: any) {
            console.error("Error fetching videos:", error);
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    const deleteVideo = async (videoId: string) => {
        try {
            const token = localStorage.getItem("token")
            if (!token) {
                console.log("token not found")
                return false
            }

            const response = await axios.delete(`${API_BASE_URL}/video/delete/${videoId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                }
            })

            if (response.status === 200) {

                setVideos((prevVideos) => prevVideos.filter((video) => video._id !== videoId))
                return true
            }
            console.log("Error caused at server in deleting video")
            return false
        } catch (error) {
            console.error("Error deleting room from the server:", error)
            return false
        }
    };


    return (
        <VideoContext.Provider
            value={{ video, videos, uploadVideo, getVideos, isLoading, deleteVideo }}
        >
            {children}
        </VideoContext.Provider>
    )
}

export const useVideo = () => useContext(VideoContext)