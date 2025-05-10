"use client"

import type React from "react"
import { v4 as uuidv4 } from 'uuid';
import { useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"
import { AuthCheck } from "@/components/auth-check"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/components/auth-provider"
import {Pause, Play, Plus, Send, Share2, Video, Volume2, VolumeX, X} from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useVideo } from "@/components/video-provider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { io, Socket } from "socket.io-client";
import { DefaultEventsMap } from "@socket.io/component-emitter"
import {useRoom} from "@/components/room-provider";

export default function RoomPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const { selectedRoom } = useRoom()
  const [isUploading, setIsUploading] = useState(false)
  const [selectedVideoPath, setSelectedVideoPath] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const { video, videos, uploadVideo, getVideos, isLoading, deleteVideo } = useVideo()
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(80)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(100)
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<
      Array<{
        id: string
        user: string
        text: string
        timestamp: Date
      }>
  >([])
  const videoRef = useRef<HTMLVideoElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  const handleVideoUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!videoFile || !id) return

    const success = await uploadVideo(videoFile, id as string)
    if (success) {
      alert("Video uploaded successfully!")
      await getVideos(id as string)
    } else {
      alert("Video upload failed.")
    }
  }

  const socketRef = useRef<Socket<DefaultEventsMap, DefaultEventsMap> | null>(null)

  // Initialize socket connection
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    socketRef.current = io(process.env.NEXT_PUBLIC_API_BASE_URL, {
      transports: ["websocket"],
      auth: {
        token: localStorage.getItem("token"),
      },
    });

    socketRef.current?.on("connect", () => {
      console.log("Connected to socket server");
      socketRef.current?.emit("joinRoom", { roomId: id });
    });

    // Handle video selection
    socketRef.current?.on("video-selected", ({ videoUrl }) => {
      setSelectedVideoPath(videoUrl);
      if (videoRef.current) {
        videoRef.current.src = videoUrl;
        videoRef.current.load();
        setIsPlaying(false); // Reset play state
        setCurrentTime(0); // Reset time
      }
    });

    // Handle play/pause state
    socketRef.current?.on("vid-state", (data) => {
      if (!data || typeof data !== 'object' || !('isPlaying' in data) || !('videoUrl' in data) || !('currentTime' in data)) {
        console.error("Invalid vid-state payload:", data);
        return;
      }
      const { isPlaying, videoUrl, currentTime } = data;
      if (videoRef.current) {
        // Ensure the correct video is loaded
        if (videoRef.current.src !== videoUrl) {
          videoRef.current.src = videoUrl;
          videoRef.current.load();
        }
        videoRef.current.currentTime = currentTime;
        if (isPlaying) {
          videoRef.current.play().catch((error) => {
            console.error("Play error:", error);
            setIsPlaying(false);
          });
        } else {
          videoRef.current.pause();
        }
        setIsPlaying(isPlaying);
        setCurrentTime(currentTime);
      }
    });

    // Handle seek (progress bar movement)
    socketRef.current?.on("progress-bar-clicked", ({ newTime, videoUrl }) => {
      if (videoRef.current) {
        if (videoRef.current.src !== videoUrl) {
          videoRef.current.src = videoUrl;
          videoRef.current.load();
        }
        videoRef.current.currentTime = newTime;
        setCurrentTime(newTime);
      }
    });

    socketRef.current?.on("update-users", (userList) => {
      console.log("User list updated:", userList);
    });

    socketRef.current?.on("disconnect", () => {
      console.log("Disconnected from socket server");
    });

    socketRef.current?.on("receiveMessage", (incomingMessage) => {
      console.log("Message received:", incomingMessage);
      const parsedMessage = {
        id: incomingMessage.message?.id || uuidv4(),
        user: incomingMessage.userName || "Unknown User",
        text: incomingMessage.message?.text || "",
        timestamp: incomingMessage.message?.timestamp ? new Date(incomingMessage.message.timestamp) : new Date(),
      };
      console.log("Parsed message with ID:", parsedMessage.id);
      setMessages((prevMessages) => {
        if (prevMessages.some((m) => m.id === parsedMessage.id)) {
          return prevMessages;
        }
        return [...prevMessages, parsedMessage];
      });
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [id]);

  useEffect(() => {
    if (id) getVideos(id as string)
  }, [id])

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [messages])

  const handlePlayPause = () => {
    if (videoRef.current && selectedVideoPath) {
      const currentTime = videoRef.current.currentTime;
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch((error) => {
          console.error("Play error:", error);
        });
      }
      setIsPlaying(!isPlaying);
      socketRef.current?.emit("vid-state", {
        roomId: id,
        isPlaying: !isPlaying,
        videoUrl: selectedVideoPath,
        currentTime,
      });
    } else {
      console.error("Cannot toggle play/pause: No video selected");
    }
  };

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

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
      setDuration(videoRef.current.duration || 100)
    }
  }

  const handleSeek = (value: number[]) => {
    const seekTime = value[0]
    setCurrentTime(seekTime)
    if (videoRef.current && selectedVideoPath) {
      videoRef.current.currentTime = seekTime
      socketRef.current?.emit("progress-bar-clicked", {
        roomId: id,
        newTime: seekTime,
        videoUrl: selectedVideoPath,
      });
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && user && socketRef.current) {
      const newMessage = {
        id: uuidv4(),
        user: user.name,
        text: message,
        timestamp: new Date(),
      };
      socketRef.current?.emit("sendMessage", {
        roomId: id,
        message: newMessage,
      });
      setMessage("");
    }
  };

  const handleShareRoom = () => {
    navigator.clipboard.writeText(window.location.href)
    alert("Room link copied to clipboard!")
  }

  const handleDeleteVideo = async (videoId: string) => {
    const success = await deleteVideo(videoId)
    return success
  }

  const handleDeleteClick = async (videoId: string) => {
    const confirmed = window.confirm("Are you sure you want to delete this video?")
    if (confirmed) {
      const success = await handleDeleteVideo(videoId)
    }
  }

  return (
      <AuthCheck redirectTo="/login">
        <div className="container mx-auto grid min-h-screen grid-rows-[auto_1fr] gap-4 p-4">
          <header className="flex items-center justify-between py-4">
            <h1 className="text-2xl font-bold">Room: {selectedRoom?.name}</h1>
            <Button variant="outline" onClick={handleShareRoom}>
              <Share2 className="mr-2 h-4 w-4" />
              Share Room
            </Button>
          </header>

          <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
            {/* Video Box */}
            <div className="flex flex-col space-y-4">
              <div className="relative aspect-video overflow-hidden rounded-lg bg-black">
                <video
                    ref={videoRef}
                    className="h-full w-full"
                    src={selectedVideoPath || ""}
                    onTimeUpdate={handleTimeUpdate}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Button variant="ghost" size="icon" onClick={handlePlayPause} aria-label={isPlaying ? "Pause" : "Play"}>
                    {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                  </Button>
                  <span className="text-sm">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
                  <div className="flex items-center space-x-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleMuteToggle}
                        aria-label={isMuted ? "Unmute" : "Mute"}
                    >
                      {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                    </Button>
                    <div className="w-24">
                      <Slider value={[volume]} min={0} max={100} step={1} onValueChange={handleVolumeChange} />
                    </div>
                  </div>
                </div>
                <Slider value={[currentTime]} min={0} max={duration || 100} step={0.1} onValueChange={handleSeek} />
              </div>
            </div>

            {/* Chat Box */}
            <div className="flex flex-col rounded-lg border bg-card shadow-sm">
              <div className="border-b p-3">
                <h2 className="font-semibold">Chat</h2>
              </div>
              <div
                  ref={chatContainerRef}
                  className="flex-1 overflow-y-auto p-3"
                  style={{ maxHeight: "calc(100vh - 300px)" }}
              >
                {messages.length > 0 ? (
                    <div className="space-y-4">
                      {messages.map((msg) => (
                          <div key={msg.id} className="flex flex-col">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">{msg.user}</span>
                              <span className="text-xs text-muted-foreground">
                          {msg.timestamp ? msg.timestamp.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          }) : ""}
                        </span>
                            </div>
                            <p className="mt-1">{msg.text}</p>
                          </div>
                      ))}
                    </div>
                ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">No messages yet</div>
                )}
              </div>
              <div className="border-t p-3">
                <form
                    onSubmit={handleSendMessage}
                    className="flex space-x-2"
                >
                  <Textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="min-h-[40px] flex-1 resize-none"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          e.currentTarget.form?.requestSubmit();
                        }
                      }}
                  />
                  <Button type="submit" size="icon" disabled={!message.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </div>

            {/* Video List */}
            <div className="space-y-4">
              {videos.map((video) => (
                  <Card key={video.originalName} className="relative">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="rounded-full bg-primary/10 p-2">
                            <Video className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-medium">{video.originalName}</h3>
                          </div>
                        </div>
                        <Button
                            size="sm"
                            onClick={() => {
                              const videoUrl = video.streamingUrl;
                              if (!videoUrl) {
                                console.error("No video URL available for playback");
                                alert("Failed to play video: No video URL available");
                                return;
                              }
                              setSelectedVideoPath(videoUrl);
                              setIsPlaying(true);
                              if (videoRef.current) {
                                videoRef.current.src = videoUrl;
                                videoRef.current.load();
                                videoRef.current.play().catch((error) => {
                                  console.error("Play error:", error);
                                  setIsPlaying(false);
                                });
                                // Emit video selection and play state
                                socketRef.current?.emit("video-selected", {
                                  roomId: id,
                                  videoUrl,
                                });
                                socketRef.current?.emit("vid-state", {
                                  roomId: id,
                                  isPlaying: true,
                                  videoUrl,
                                  currentTime: 0,
                                });
                              }
                            }}
                            className="transform -translate-x-7"
                        >
                          Play
                        </Button>
                      </div>
                    </CardContent>
                    {/* Delete Button */}
                    <button
                        onClick={() => handleDeleteClick(video._id)}
                        className="absolute top-2 right-2 flex items-center justify-center w-6 h-6 rounded-full bg-muted hover:bg-gray-200 transition-colors duration-200"
                        aria-label={`Delete ${video.originalName}`}
                    >
                      <X
                          className="w-4 h-4 text-white text-muted-foreground hover:text-red-500 transition-colors duration-200"
                          strokeWidth={2.5}
                      />
                    </button>
                  </Card>
              ))}
            </div>

            {/* Upload Video */}
            <Card>
              <CardHeader>
                <CardTitle>Upload a new video</CardTitle>
                <CardDescription>
                  Select a file from your computer
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleVideoUpload}>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="room-name">Select Video File</Label>
                    <Input
                        type="file"
                        id="videoFile"
                        accept="video/*"
                        onChange={(e) => {
                          if (e.target.files?.[0]) setVideoFile(e.target.files[0])
                        }}
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Uploading..." : "Upload Video"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </div>
        </div>
      </AuthCheck>
  )
}