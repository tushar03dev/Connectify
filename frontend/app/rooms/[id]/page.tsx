"use client"

import type React from "react"
import { v4 as uuidv4 } from "uuid"
import { useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"
import { AuthCheck } from "@/components/auth-check"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/components/auth-provider"
import {
  Pause,
  Play,
  Send,
  Share2,
  Video,
  Volume2,
  VolumeX,
  X,
  Maximize,
  Users,
  Copy,
  Crown,
  Settings,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useVideo } from "@/components/video-provider"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { io, type Socket } from "socket.io-client"
import type { DefaultEventsMap } from "@socket.io/component-emitter"

interface User {
  id: string
  name: string
  avatar?: string
  isActive: boolean
  isOwner?: boolean
}

interface Message {
  id: string
  user: string
  userId: string
  text: string
  timestamp: Date
  avatar?: string
}

interface VideoItem {
  _id: string
  originalName: string
  uploadedBy?: string
  uploadedByName?: string
}

export default function RoomPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const [isUploading, setIsUploading] = useState(false)
  const [selectedVideoPath, setSelectedVideoPath] = useState<string | null>(null)
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const { video, videos, uploadVideo, getVideos, isLoading, deleteVideo } = useVideo()
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(80)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(100)
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showParticipants, setShowParticipants] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [showSpeedMenu, setShowSpeedMenu] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const videoContainerRef = useRef<HTMLDivElement>(null)
  const controlsTimeoutRef = useRef<NodeJS.Timeout>()

  const speedOptions = [
    { value: 0.25, label: "0.25x" },
    { value: 0.5, label: "0.5x" },
    { value: 0.75, label: "0.75x" },
    { value: 1, label: "Normal" },
    { value: 1.25, label: "1.25x" },
    { value: 1.5, label: "1.5x" },
    { value: 2, label: "2x" },
    { value: 2.5, label: "2.5x" },
  ]

  const handleVideoUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!videoFile || !id) {
      alert("Please select a video file.")
      return
    }
    setIsUploading(true)
    try {
      const success = await uploadVideo(videoFile, id as string)
      if (success) {
        alert("Video uploaded successfully!")
        await getVideos(id as string)
        socketRef.current?.emit("videoUploaded", { roomId: id })
      } else {
        alert("Video upload failed.")
      }
    } catch (error) {
      console.error("Error uploading video:", error)
      alert("Error uploading video. Please try again.")
    } finally {
      setIsUploading(false)
    }
  }

  const socketRef = useRef<Socket<DefaultEventsMap, DefaultEventsMap> | null>(null)

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      console.error("No token found in localStorage")
      alert("Authentication error. Please log in again.")
      window.location.href = "/login"
      return
    }

    socketRef.current = io(process.env.NEXT_PUBLIC_API_BASE_URL, {
      transports: ["websocket"],
      auth: { token },
      path: "/socket.io/",
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 30000,
      query: { roomId: id },
    })

    socketRef.current.on("connect", () => {
      console.log("Socket connected, ID:", socketRef.current?.id)
      setTimeout(() => {
        if (socketRef.current?.connected) {
          console.log("Emitting joinRoom with roomId:", id)
          socketRef.current?.emit("joinRoom", { roomId: id })
          if (selectedVideoId) {
            socketRef.current?.emit("request-video-state", { roomId: id })
          }
        } else {
          console.error("Socket not connected when trying to emit joinRoom")
        }
      }, 100)
    })

    socketRef.current?.on("connect_error", (error) => {
      console.error("Socket connection error:", {
        message: error.message,
        cause: error.cause,
        stack: error.stack,
      })
    })

    socketRef.current.on("joinRoom", (response) => {
      console.log("Join room response:", response)
      if (!response.success) {
        console.error("Failed to join room:", response.error)
        alert("Failed to join room: " + response.error)
      }
    })

    socketRef.current.on("joinRoomResponse", (response) => {
      console.log("Join room response:", response)
      if (!response.success) {
        console.error("Failed to join room:", response.error)
        alert("Failed to join room: " + response.error)
      }
    })

    socketRef.current.on("video-selected", ({ videoUrl }) => {
      setSelectedVideoPath(videoUrl)
      if (videoRef.current) {
        videoRef.current.src = videoUrl
        videoRef.current.load()
        setIsPlaying(false)
        setCurrentTime(0)
      }
    })

    socketRef.current?.on("vid-state", (data) => {
      if (
          !data ||
          typeof data !== "object" ||
          !("isPlaying" in data) ||
          !("videoUrl" in data) ||
          !("currentTime" in data)
      ) {
        console.error("Invalid vid-state payload:", data)
        return
      }
      const { isPlaying, videoUrl, currentTime, playbackSpeed: remoteSpeed } = data
      if (videoRef.current) {
        if (videoRef.current.src !== videoUrl) {
          videoRef.current.src = videoUrl
          videoRef.current.load()
        }
        videoRef.current.currentTime = currentTime
        if (remoteSpeed && remoteSpeed !== playbackSpeed) {
          setPlaybackSpeed(remoteSpeed)
          videoRef.current.playbackRate = remoteSpeed
        }
        if (isPlaying) {
          videoRef.current.play().catch((error) => {
            console.error("Play error:", error)
            setIsPlaying(false)
          })
        } else {
          videoRef.current.pause()
        }
        setIsPlaying(isPlaying)
        setCurrentTime(currentTime)
      }
    })

    socketRef.current?.on("progress-bar-clicked", ({ newTime, videoUrl }) => {
      if (videoRef.current) {
        if (videoRef.current.src !== videoUrl) {
          videoRef.current.src = videoUrl
          videoRef.current.load()
        }
        videoRef.current.currentTime = newTime
        setCurrentTime(newTime)
      }
    })

    socketRef.current?.on("playback-speed-changed", ({ speed }) => {
      setPlaybackSpeed(speed)
      if (videoRef.current) {
        videoRef.current.playbackRate = speed
      }
    })

    socketRef.current.on("roomUsers", (userList) => {
      console.log("User list updated:", userList)
      setUsers(userList || [])
    })

    socketRef.current.on("receiveMessage", (incomingMessage) => {
      console.log("Received receiveMessage:", incomingMessage)
      const parsedMessage: Message = {
        id: incomingMessage.id || uuidv4(),
        user: incomingMessage.userName || "Unknown User",
        userId: incomingMessage.userId || "unknown",
        text: incomingMessage.text || "",
        timestamp: incomingMessage.timestamp ? new Date(incomingMessage.timestamp) : new Date(),
        avatar: incomingMessage.avatar || undefined,
      }
      console.log("Parsed message:", parsedMessage)
      setMessages((prevMessages) => {
        if (prevMessages.some((m) => m.id === parsedMessage.id)) {
          console.warn("Duplicate message filtered out:", parsedMessage.id)
          return prevMessages
        }
        return [...prevMessages, parsedMessage]
      })
    })

    socketRef.current.on("disconnect", (reason) => {
      console.log("Disconnected from socket server:", reason)
      if (reason === "io server disconnect") {
        socketRef.current?.connect()
      }
    })

    socketRef.current.on("error", (error) => {
      console.error("Socket.IO error:", error)
      alert(`Socket error: ${error}`)
    })

    return () => {
      socketRef.current?.disconnect()
    }
  }, [id, selectedVideoId, playbackSpeed])

  useEffect(() => {
    if (id) getVideos(id as string)
  }, [id])

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [messages])

  useEffect(() => {
    let syncInterval: NodeJS.Timeout | undefined
    if (isPlaying && selectedVideoPath && videoRef.current) {
      syncInterval = setInterval(() => {
        socketRef.current?.emit("vid-state", {
          roomId: id,
          isPlaying: true,
          videoUrl: selectedVideoPath,
          currentTime: videoRef.current?.currentTime || 0,
          playbackSpeed,
        })
      }, 10000)
    }
    return () => clearInterval(syncInterval)
  }, [isPlaying, selectedVideoPath, id, playbackSpeed])

  const handlePlayClick = async (videoId: string) => {
    if (!videoRef.current || !videoId) {
      console.error("Invalid video selection:", { videoId, videoRef: !!videoRef.current })
      alert("Cannot play video: Invalid video or player not ready")
      return
    }

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        alert("Session expired. Please log in again.")
        window.location.href = "/login"
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
        alert(`Failed to load video: ${errorText}`)
        return
      }

      const data = await response.json()
      const videoUrl = data.url
      if (!videoUrl) {
        console.error("No URL returned from server", { response: data })
        alert("Failed to load video: No URL provided")
        return
      }

      console.log(`Setting video src: ${videoUrl}`)
      setSelectedVideoPath(videoUrl)
      setSelectedVideoId(videoId)
      setIsPlaying(true)

      socketRef.current?.emit("video-selected", {
        roomId: id,
        videoUrl,
      })
      socketRef.current?.emit("vid-state", {
        roomId: id,
        isPlaying: true,
        videoUrl,
        currentTime: 0,
        playbackSpeed,
        serverTimestamp: Date.now(),
      })
    } catch (error: unknown) {
      const err = error as Error
      console.error("Error in video selection:", err)
      alert(`Error playing video: ${err.message}`)
    }
  }

  const handlePlayPause = () => {
    if (videoRef.current && selectedVideoPath) {
      const currentTime = videoRef.current.currentTime
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play().catch((error) => {
          console.error("Play error:", error)
        })
      }
      setIsPlaying(!isPlaying)
      socketRef.current?.emit("vid-state", {
        roomId: id,
        isPlaying: !isPlaying,
        videoUrl: selectedVideoPath,
        currentTime,
        playbackSpeed,
      })
    } else {
      console.error("Cannot toggle play/pause: No video selected")
    }
  }

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0]
    setVolume(newVolume)
    if (videoRef.current) {
      videoRef.current.volume = newVolume / 100
    }
    if (newVolume === 0) {
      setIsMuted(true)
    } else {
      setIsMuted(false)
    }
  }

  const handleMuteToggle = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const handleSeek = (value: number[]) => {
    const seekTime = value[0]
    if (!videoRef.current || !selectedVideoPath) {
      console.error("Cannot seek: No video selected or video element not ready")
      return
    }
    setCurrentTime(seekTime)
    videoRef.current.currentTime = seekTime
    socketRef.current?.emit("progress-bar-clicked", {
      roomId: id,
      newTime: seekTime,
      videoUrl: selectedVideoPath,
    })
  }

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed)
    if (videoRef.current) {
      videoRef.current.playbackRate = speed
    }
    socketRef.current?.emit("playback-speed-changed", {
      roomId: id,
      speed,
    })
    setShowSpeedMenu(false)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim() && user && socketRef.current) {
      const newMessage: Message = {
        id: uuidv4(),
        user: user.name,
        userId: user.id || "current-user",
        text: message,
        timestamp: new Date(),
        avatar: user.avatar,
      }
      console.log("Sending message:", newMessage)
      socketRef.current.emit(
          "sendMessage",
          {
            roomId: id,
            message: newMessage,
          },
          (response: any) => {
            console.log("Send message response:", response)
            if (response?.error) {
              setMessages((prevMessages) => prevMessages.filter((m) => m.id !== newMessage.id))
            }
          },
      )
      setMessages((prevMessages) => [...prevMessages, newMessage])
      setMessage("")
    } else {
      console.error("Cannot send message:", { message, user, socket: socketRef.current })
    }
  }

  const handleShareRoom = () => {
    navigator.clipboard.writeText(window.location.href)
    alert("Room link copied to clipboard!")
  }

  const handleCopyRoomCode = () => {
    navigator.clipboard.writeText(id as string)
    alert("Room code copied to clipboard!")
  }

  const handleDeleteClick = async (videoId: string) => {
    const confirmed = window.confirm("Are you sure you want to delete this video?")
    if (confirmed) {
      const success = await deleteVideo(videoId)
      if (success) {
        console.log("Successfully deleted")
      } else {
        console.log("Failed to delete")
      }
    }
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      videoContainerRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const handleMouseMove = () => {
    setShowControls(true)
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false)
      }
    }, 3000)
  }

  const activeUsers = users.filter((u) => u.isActive)
  const inactiveUsers = users.filter((u) => !u.isActive)

  const getInitials = (name: string) => {
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
  }

  const isCurrentUser = (userId: string) => {
    return userId === user?.id || userId === "current-user"
  }

  return (
      <AuthCheck redirectTo="/login">
        <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
          {/* Elegant grid background */}
          <div className="fixed inset-0 elegant-grid opacity-40"></div>

          {/* Subtle floating elements */}
          <div className="fixed inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-20 left-20 w-32 h-32 bg-blue-200/20 dark:bg-blue-400/10 rounded-full blur-xl animate-gentle-float"></div>
            <div className="absolute top-40 right-32 w-24 h-24 bg-indigo-200/20 dark:bg-indigo-400/10 rounded-full blur-xl animate-gentle-float delay-200"></div>
            <div className="absolute bottom-32 left-32 w-28 h-28 bg-slate-200/20 dark:bg-slate-400/10 rounded-full blur-xl animate-gentle-float delay-400"></div>
          </div>

          <div className="container mx-auto grid min-h-screen grid-rows-[auto_1fr] gap-6 p-6 relative z-10">
            {/* Header */}
            <header className="elegant-card rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse"></div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Room</h1>
                  </div>
                  <div className="flex items-center space-x-2 elegant-card rounded-lg px-3 py-1">
                    <span className="text-sm text-slate-600 dark:text-slate-300">Code:</span>
                    <code className="text-lg font-mono text-blue-600 dark:text-blue-400">{id}</code>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCopyRoomCode}
                        className="h-6 w-6 p-0 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowParticipants(!showParticipants)}
                            className="text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <Users className="mr-2 h-4 w-4" />
                          {users.length}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>View participants</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <Button
                      variant="outline"
                      onClick={handleShareRoom}
                      className="elegant-button bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white border-0"
                  >
                    <Share2 className="mr-2 h-4 w-4" />
                    Share Room
                  </Button>
                </div>
              </div>
            </header>

            <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
              {/* Video Section */}
              <div className="flex flex-col space-y-4">
                <div
                    ref={videoContainerRef}
                    className="group relative aspect-video overflow-hidden rounded-2xl bg-black shadow-2xl"
                    onMouseMove={handleMouseMove}
                    onMouseLeave={() => isPlaying && setShowControls(false)}
                >
                  <video
                      ref={videoRef}
                      className="h-full w-full"
                      src={selectedVideoPath || undefined}
                      onTimeUpdate={() => {
                        if (videoRef.current) {
                          setCurrentTime(videoRef.current.currentTime)
                          setDuration(videoRef.current.duration || 100)
                          socketRef.current?.emit("vid-state", {
                            roomId: id,
                            isPlaying: !videoRef.current.paused,
                            videoId: selectedVideoId,
                            currentTime: videoRef.current.currentTime,
                            playbackSpeed,
                            serverTimestamp: Date.now(),
                          })
                        }
                      }}
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                      onError={(e) => {
                        const videoElement = e.target as HTMLVideoElement
                        const error = videoElement.error
                        console.error("Video element error:", {
                          message: error?.message,
                          code: error?.code,
                          src: videoElement.src,
                          networkState: videoElement.networkState,
                          readyState: videoElement.readyState,
                        })
                        alert(`Failed to load video: ${error?.message || "Unknown error"} (Code: ${error?.code})`)
                        setIsPlaying(false)
                      }}
                  />

                  {/* YouTube-style Video Controls */}
                  <div
                      className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 transition-opacity duration-300 ${
                          showControls ? "opacity-100" : "opacity-0"
                      }`}
                  >
                    {/* Progress Bar */}
                    <div className="mb-4">
                      <Slider
                          value={[currentTime]}
                          min={0}
                          max={duration || 100}
                          step={0.1}
                          onValueChange={handleSeek}
                          className="w-full [&_[role=slider]]:bg-red-500 [&_[role=slider]]:border-red-500 [&_.bg-primary]:bg-red-500"
                      />
                    </div>

                    {/* Control Buttons */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {/* Play/Pause */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handlePlayPause}
                            className="text-white hover:bg-white/20"
                        >
                          {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                        </Button>

                        {/* Volume */}
                        <div className="flex items-center space-x-2">
                          <Button
                              variant="ghost"
                              size="icon"
                              onClick={handleMuteToggle}
                              className="text-white hover:bg-white/20"
                          >
                            {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                          </Button>
                          <div className="w-20">
                            <Slider
                                value={[volume]}
                                min={0}
                                max={100}
                                step={1}
                                onValueChange={handleVolumeChange}
                                className="[&_[role=slider]]:bg-white [&_[role=slider]]:border-white [&_.bg-primary]:bg-white"
                            />
                          </div>
                        </div>

                        {/* Time Display */}
                        <span className="text-sm text-white font-mono">
                        {formatTime(currentTime)} / {formatTime(duration)}
                      </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        {/* Speed Control */}
                        <div className="relative">
                          <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                              className="text-white hover:bg-white/20 text-xs"
                          >
                            <Settings className="h-4 w-4 mr-1" />
                            {playbackSpeed}x
                          </Button>
                          {showSpeedMenu && (
                              <div className="absolute bottom-full right-0 mb-2 bg-black/90 rounded-lg p-2 min-w-[100px]">
                                <div className="text-xs text-white mb-2 px-2">Speed</div>
                                {speedOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        onClick={() => handleSpeedChange(option.value)}
                                        className={`block w-full text-left px-2 py-1 text-sm rounded hover:bg-white/20 ${
                                            playbackSpeed === option.value ? "text-red-500" : "text-white"
                                        }`}
                                    >
                                      {option.label}
                                    </button>
                                ))}
                              </div>
                          )}
                        </div>

                        {/* Fullscreen */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={toggleFullscreen}
                            className="text-white hover:bg-white/20"
                        >
                          <Maximize className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Video List */}
                <div className="space-y-3">
                  {videos.map((video: VideoItem) => (
                      <Card
                          key={video.originalName}
                          className="elegant-card border-blue-200/50 dark:border-blue-800/50 relative group"
                      >
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
                          <X className="w-4 h-4 text-red-500" strokeWidth={2.5} />
                        </button>
                      </Card>
                  ))}

                  {/* Upload Card */}
                  <Card className="elegant-card border-blue-200/50 dark:border-blue-800/50">
                    <CardHeader>
                      <CardTitle className="text-slate-900 dark:text-white">Upload a new video</CardTitle>
                      <CardDescription className="text-slate-600 dark:text-slate-400">
                        Select a file from your computer
                      </CardDescription>
                    </CardHeader>
                    <form onSubmit={handleVideoUpload}>
                      <CardContent>
                        <div className="space-y-2">
                          <Label htmlFor="videoFile" className="text-slate-700 dark:text-slate-300">
                            Select Video File
                          </Label>
                          <Input
                              type="file"
                              id="videoFile"
                              accept="video/mp4,video/webm"
                              onChange={(e) => {
                                if (e.target.files?.[0]) setVideoFile(e.target.files[0])
                              }}
                              className="bg-white/50 dark:bg-slate-800/50 border-blue-200 dark:border-blue-800 text-slate-900 dark:text-white"
                          />
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button
                            type="submit"
                            disabled={isLoading || isUploading}
                            className="elegant-button bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
                        >
                          {isLoading || isUploading ? "Uploading..." : "Upload Video"}
                        </Button>
                      </CardFooter>
                    </form>
                  </Card>
                </div>
              </div>

              {/* Chat Section */}
              <div className="flex flex-col elegant-card rounded-2xl overflow-hidden">
                {/* Chat Header */}
                <div className="border-b border-blue-200/50 dark:border-blue-800/50 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-semibold text-slate-900 dark:text-white flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                      Live Chat
                    </h2>
                    <Badge variant="secondary" className="bg-blue-500/20 text-blue-700 dark:text-blue-300">
                      {messages.length} messages
                    </Badge>
                  </div>

                  {/* Active Users */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Active ({activeUsers.length})</span>
                      {showParticipants && (
                          <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowParticipants(false)}
                              className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {activeUsers.slice(0, showParticipants ? activeUsers.length : 5).map((user) => (
                          <TooltipProvider key={user.id}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="relative">
                                  <Avatar className="h-6 w-6 border border-green-500/50">
                                    <AvatarImage src={user.avatar || "/placeholder.svg"} />
                                    <AvatarFallback className="text-xs bg-blue-600 text-white">
                                      {getInitials(user.name)}
                                    </AvatarFallback>
                                  </Avatar>
                                  {user.isOwner && <Crown className="absolute -top-1 -right-1 h-3 w-3 text-yellow-500" />}
                                  <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border border-white dark:border-slate-900"></div>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  {user.name} {user.isOwner && "(Owner)"}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                      ))}
                      {!showParticipants && activeUsers.length > 5 && (
                          <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowParticipants(true)}
                              className="h-6 w-6 p-0 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                          >
                            +{activeUsers.length - 5}
                          </Button>
                      )}
                    </div>

                    {showParticipants && inactiveUsers.length > 0 && (
                        <>
                          <Separator className="bg-blue-200/50 dark:bg-blue-800/50" />
                          <div className="space-y-2">
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          Inactive ({inactiveUsers.length})
                        </span>
                            <div className="flex flex-wrap gap-1">
                              {inactiveUsers.map((user) => (
                                  <TooltipProvider key={user.id}>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div className="relative opacity-50">
                                          <Avatar className="h-6 w-6 border border-gray-500/50">
                                            <AvatarImage src={user.avatar || "/placeholder.svg"} />
                                            <AvatarFallback className="text-xs bg-gray-600 text-white">
                                              {getInitials(user.name)}
                                            </AvatarFallback>
                                          </Avatar>
                                          <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-gray-500 rounded-full border border-white dark:border-slate-900"></div>
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>{user.name} (Inactive)</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                              ))}
                            </div>
                          </div>
                        </>
                    )}
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4" style={{ maxHeight: "calc(100vh - 400px)" }}>
                  <div ref={chatContainerRef} className="space-y-4">
                    {messages.length > 0 ? (
                        messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex ${isCurrentUser(msg.userId) ? "justify-end" : "justify-start"}`}
                            >
                              <div
                                  className={`flex max-w-[80%] ${
                                      isCurrentUser(msg.userId) ? "flex-row-reverse" : "flex-row"
                                  } items-start space-x-2`}
                              >
                                <Avatar className="h-8 w-8 flex-shrink-0">
                                  <AvatarImage src={msg.avatar || "/placeholder.svg"} />
                                  <AvatarFallback className="text-xs bg-blue-600 text-white">
                                    {getInitials(msg.user)}
                                  </AvatarFallback>
                                </Avatar>
                                <div
                                    className={`rounded-2xl px-4 py-2 ${
                                        isCurrentUser(msg.userId)
                                            ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-br-md"
                                            : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-bl-md"
                                    }`}
                                >
                                  <div className="flex items-center space-x-2 mb-1">
                              <span className="text-xs font-medium opacity-80">
                                {isCurrentUser(msg.userId) ? "You" : msg.user}
                              </span>
                                    <span className="text-xs opacity-60">
                                {msg.timestamp.toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                                  </div>
                                  <p className="text-sm leading-relaxed">{msg.text}</p>
                                </div>
                              </div>
                            </div>
                        ))
                    ) : (
                        <div className="flex h-32 items-center justify-center text-slate-600 dark:text-slate-400">
                          <div className="text-center">
                            <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                              <Send className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <p>No messages yet</p>
                            <p className="text-xs">Start the conversation!</p>
                          </div>
                        </div>
                    )}
                  </div>
                </ScrollArea>

                {/* Message Input */}
                <div className="border-t border-blue-200/50 dark:border-blue-800/50 p-4">
                  <form onSubmit={handleSendMessage} className="flex space-x-2">
                    <Textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="min-h-[40px] flex-1 resize-none bg-white/50 dark:bg-slate-800/50 border-blue-200 dark:border-blue-800 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:border-blue-500"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault()
                            e.currentTarget.form?.requestSubmit()
                          }
                        }}
                    />
                    <Button
                        type="submit"
                        size="icon"
                        disabled={!message.trim()}
                        className="elegant-button bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white disabled:opacity-50"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AuthCheck>
  )
}
