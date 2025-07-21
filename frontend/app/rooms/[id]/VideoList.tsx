"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Video, Upload } from "lucide-react"
import { useVideo } from "@/components/video-provider"
import type { Socket } from "socket.io-client"
import type { DefaultEventsMap } from "@socket.io/component-emitter"

interface VideoItem {
    _id: string
    originalName: string
    uploadedBy?: string
    uploadedByName?: string
}

interface VideoListProps {
    roomId: string
    socketRef: React.MutableRefObject<Socket<DefaultEventsMap, DefaultEventsMap> | null>
}

export default function VideoList({ roomId, socketRef }: VideoListProps) {
    const [isUploading, setIsUploading] = useState(false)
    const [videoFile, setVideoFile] = useState<File | null>(null)
    const { videos, uploadVideo, getVideos, isLoading, deleteVideo } = useVideo()

    const handleVideoUpload = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!videoFile || !roomId) {
            return
        }
        setIsUploading(true)
        try {
            const success = await uploadVideo(videoFile, roomId)
            if (success) {
                await getVideos(roomId)
                socketRef.current?.emit("videoUploaded", { roomId })
                setVideoFile(null)
                const fileInput = document.getElementById("videoFile") as HTMLInputElement
                if (fileInput) fileInput.value = ""
            }
        } catch (error) {
            console.error("Error uploading video:", error)
        } finally {
            setIsUploading(false)
        }
    }

    const handlePlayClick = async (videoId: string) => {
        try {
            const token = localStorage.getItem("token")
            if (!token) {
                if (typeof window !== "undefined") {
                    window.location.href = "/login"
                }
                return
            }

            const proxiedUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/video/play/${videoId}`
            console.log(`Fetching signed URL from: ${proxiedUrl}`)
            const response = await fetch(proxiedUrl, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            if (!response.ok) {
                const errorText = await response.text()
                console.error("Failed to fetch signed URL", { status: response.status, errorText })
                return
            }

            const data = await response.json()
            const videoUrl = data.url
            if (!videoUrl) {
                console.error("No URL returned from server", { response: data })
                return
            }

            console.log(`Setting video src: ${videoUrl}`)
            socketRef.current?.emit("video-selected", {
                roomId,
                videoUrl,
            })
            socketRef.current?.emit("vid-state", {
                roomId,
                isPlaying: true,
                videoUrl,
                currentTime: 0,
                playbackSpeed: 1,
                serverTimestamp: Date.now(),
            })
        } catch (error: unknown) {
            const err = error as Error
            console.error("Error in video selection:", err)
        }
    }

    const handleDeleteClick = async (videoId: string) => {
        if (typeof window === "undefined") return
        if (window.confirm("Are you sure you want to delete this video?")) {
            const success = await deleteVideo(videoId)
            if (success) {
                console.log("Successfully deleted")
            } else {
                console.log("Failed to delete")
            }
        }
    }

    const getVideoCountText = (count: number) => {
        return count === 1 ? "1 video" : `${count} videos`
    }

    return (
        <div className="flex-1 overflow-y-auto space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Videos</h3>
                <Badge variant="secondary" className="bg-blue-500/20 text-blue-700 dark:text-blue-300">
                    {getVideoCountText(videos.length)}
                </Badge>
            </div>
            {videos.length === 0 ? (
                <div className="elegant-card rounded-xl p-8 text-center">
                    <div className="w-16 h-16 bg-slate-200/50 dark:bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Video className="h-8 w-8 text-slate-400" />
                    </div>
                    <h4 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No videos available</h4>
                    <p className="text-slate-600 dark:text-slate-400">Upload a video to get started</p>
                </div>
            ) : (
                videos.map((video: VideoItem) => (
                    <Card key={video.originalName} className="elegant-card border-blue-200/50 dark:border-blue-800/50 relative group">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between pr-8">
                                <div className="flex items-center space-x-4">
                                    <div className="rounded-full bg-blue-500/20 p-2">
                                        <Video className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-slate-900 dark:text-white">{video.originalName}</h3>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">
                                            Shared by {video.uploadedByName || "Unknown User"}
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    size="sm"
                                    onClick={() => handlePlayClick(video._id)}
                                    className="elegant-button bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
                                >
                                    Play
                                </Button>
                            </div>
                        </CardContent>
                        <button
                            onClick={() => handleDeleteClick(video._id)}
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center w-6 h-6 rounded-full bg-red-500/20 hover:bg-red-500/40"
                            aria-label={`Delete ${video.originalName}`}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-4 h-4 text-red-500"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2.5}
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </Card>
                ))
            )}
            <Card className="elegant-card border-blue-200/50 dark:border-blue-800/50 border-dashed">
                <form onSubmit={handleVideoUpload}>
                    <CardContent className="p-6">
                        <div className="text-center">
                            <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Upload className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">Upload Video</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                                Share a video with everyone in the room
                            </p>
                            <div className="space-y-4">
                                <Input
                                    type="file"
                                    id="videoFile"
                                    accept="video/mp4,video/webm,video/avi,video/mov"
                                    onChange={(e) => {
                                        if (e.target.files?.[0]) setVideoFile(e.target.files[0])
                                    }}
                                    className="bg-white/50 dark:bg-slate-800/50 border-blue-200 dark:border-blue-800 text-slate-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                />
                                {videoFile && (
                                    <div className="text-sm text-slate-600 dark:text-slate-400 bg-blue-50/50 dark:bg-blue-900/20 rounded-lg p-3">
                                        <strong>Selected:</strong> {videoFile.name}
                                        <br />
                                        <strong>Size:</strong> {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                                    </div>
                                )}
                                <Button
                                    type="submit"
                                    disabled={!videoFile || isLoading || isUploading}
                                    className="w-full elegant-button bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white disabled:opacity-50"
                                >
                                    {isLoading || isUploading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            Uploading...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="h-4 w-4 mr-2" />
                                            Upload Video
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </form>
            </Card>
        </div>
    )
}