"use client"

import type React from "react"
import { v4 as uuidv4 } from 'uuid'
import { useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"
import { AuthCheck } from "@/components/auth-check"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/components/auth-provider"
import { Pause, Play, Plus, Send, Share2, Video, Volume2, VolumeX, X } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useVideo } from "@/components/video-provider"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { io, Socket } from "socket.io-client"
import { DefaultEventsMap } from "@socket.io/component-emitter"
import { throttle } from "lodash"

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
    if (!videoFile || !id) {
      alert("Please select a video file.")
      return
    }
    const success = await uploadVideo(videoFile, id as string)
    if (success) {
      alert("Video uploaded successfully!")
      await getVideos(id as string)
    } else {
      alert("Video upload failed.")
    }
  }

  const socketRef = useRef<Socket<DefaultEventsMap, DefaultEventsMap> | null>(null)

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No token found in localStorage");
      alert("Authentication error. Please log in again.");
      window.location.href = "/login";
      return;
    }

    socketRef.current = io(process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:7400", {
      transports: ["websocket"], // Prefer WebSocket for stability
      auth: { token },
      path: "/socket.io/",
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 30000, // 30-second timeout
      query: { roomId: id }, // Pass roomId for debugging
    });

    socketRef.current.on("connect", () => {
      console.log("Connected to socket server:", socketRef.current?.id);
      socketRef.current?.emit("joinRoom", { roomId: id });
      if (selectedVideoId) {
        socketRef.current?.emit("request-video-state", { roomId: id });
      }
    });

    socketRef.current?.on("connect_error", (error) => {
      console.error("Socket connection error:", error.message, error);
    });

    socketRef.current.on("joinRoom", (response) => {
      console.log("Join room response:", response);
      if (!response.success) {
        console.error("Failed to join room:", response.error);
        alert("Failed to join room: " + response.error);
      }
    });

    socketRef.current.on("video-selected", async ({ videoId }) => {
      console.log("Video selected:", videoId);
      if (!videoId || videoId === selectedVideoId) return;
      try {
        const token = localStorage.getItem("token");
        const proxiedUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/video/play/${videoId}`;
        const response = await fetch(proxiedUrl, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          console.warn("Failed to fetch signed URL");
          return;
        }
        const data = await response.json();
        const videoUrl = data.url;
        if (!videoUrl) {
          console.error("No URL returned from server");
          return;
        }
        if (videoRef.current && videoRef.current.src !== videoUrl) {
          setSelectedVideoPath(videoUrl);
          setSelectedVideoId(videoId);
          videoRef.current.src = videoUrl;
          const canPlayPromise = new Promise((resolve) => {
            const onCanPlay = () => {
              videoRef.current?.removeEventListener("canplay", onCanPlay);
              resolve(true);
            };
            videoRef.current?.addEventListener("canplay", onCanPlay);
            videoRef.current?.load();
          });
          await canPlayPromise;
          setIsPlaying(false);
          setCurrentTime(0);
        }
      } catch (error) {
        console.error("Error fetching signed URL:", error);
      }
    });

    socketRef.current.on("vid-state", async (data) => {
      if (!data || !("isPlaying" in data) || !("videoId" in data) || !("currentTime" in data)) {
        console.error("Invalid vid-state payload:", data);
        return;
      }
      const { isPlaying, videoId, currentTime, serverTimestamp } = data;
      if (videoRef.current && videoId === selectedVideoId) {
        try {
          const latency = serverTimestamp ? (Date.now() - serverTimestamp) / 1000 : 0;
          const adjustedTime = currentTime + latency;
          videoRef.current.currentTime = adjustedTime;
          if (isPlaying && !videoRef.current.played.length) {
            document.body.addEventListener(
                "click",
                () => {
                  videoRef.current?.play().catch((error) => {
                    console.error("Play error:", error);
                    setIsPlaying(false);
                    alert(`Failed to play video: ${error.message}`);
                  });
                },
                { once: true }
            );
          } else if (!isPlaying) {
            videoRef.current.pause();
          }
          setIsPlaying(isPlaying);
          setCurrentTime(adjustedTime);
        } catch (error) {
          console.error("Error processing vid-state:", error);
        }
      }
    });

    socketRef.current.on("roomUsers", (userList) => {
      console.log("User list updated:", userList);
      // Update UI with user list
    });

    socketRef.current.on("receiveMessage", (incomingMessage) => {
      console.log("Message received:", incomingMessage);
      const parsedMessage = {
        id: incomingMessage.message?.id || uuidv4(),
        user: incomingMessage.userName || "Unknown User",
        text: incomingMessage.message?.text || "",
        timestamp: incomingMessage.message?.timestamp ? new Date(incomingMessage.message.timestamp) : new Date(),
      };
      setMessages((prevMessages) => {
        if (prevMessages.some((m) => m.id === parsedMessage.id)) return prevMessages;
        return [...prevMessages, parsedMessage];
      });
    });

    socketRef.current.on("disconnect", (reason) => {
      console.log("Disconnected from socket server:", reason);
      if (reason === "io server disconnect") {
        socketRef.current?.connect();
      }
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [id, selectedVideoId]);

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
        })
      }, 10000) // Sync every 10 seconds
    }
    return () => clearInterval(syncInterval)
  }, [isPlaying, selectedVideoPath, id])

  const handlePlayClick = async (videoId: string) => {
    if (!videoRef.current || !videoId) {
      console.error("Invalid video selection:", { videoId, videoRef: !!videoRef.current });
      alert("Cannot play video: Invalid video or player not ready");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Session expired. Please log in again.");
        window.location.href = "/login";
        return;
      }

      // Fetch the signed URL from the proxied endpoint
      const proxiedUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/video/play/${videoId}`;
      console.log(`Fetching signed URL from: ${proxiedUrl}`);
      const response = await fetch(proxiedUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.error("Failed to fetch signed URL", { status: response.status });
        alert("Failed to load video.");
        return;
      }

      const data = await response.json();
      const videoUrl = data.url;
      if (!videoUrl) {
        console.error("No URL returned from server");
        alert("Failed to load video: No URL provided");
        return;
      }

      // Set the video source and wait for it to be ready
      console.log(`Setting video src: ${videoUrl}`);
      setSelectedVideoPath(videoUrl);
      setSelectedVideoId(videoId);
      if (videoRef.current.src !== videoUrl) {
        videoRef.current.src = videoUrl;
        // Wait for the video to load metadata before playing
        const canPlayPromise = new Promise((resolve) => {
          const onCanPlay = () => {
            videoRef.current?.removeEventListener("canplay", onCanPlay);
            resolve(true);
          };
          videoRef.current?.addEventListener("canplay", onCanPlay);
          videoRef.current?.load();
        });

        await canPlayPromise;
      }

      // Ensure play is called after user interaction
      setIsPlaying(true);
      await videoRef.current.play().catch((error) => {
        console.error("Play error:", error);
        setIsPlaying(false);
        alert(`Failed to play video: ${error.message}`);
        throw error;
      });

      socketRef.current?.emit("video-selected", {
        roomId: id,
        videoId,
      });
      socketRef.current?.emit("vid-state", {
        roomId: id,
        isPlaying: true,
        videoId,
        currentTime: 0,
      });
    } catch (error) {
      console.error("Error in video selection:", error);
      alert("Error playing video. Please try again.");
    }
  };

  const handlePlayPause = throttle(() => {
    if (!videoRef.current) {
      console.error("Video ref not available");
      return;
    }

    try {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
        socketRef.current?.emit("vid-state", {
          roomId: id,
          isPlaying: false,
          videoId: selectedVideoId,
          currentTime: videoRef.current.currentTime,
        });
      } else {
        videoRef.current.play().then(() => {
          setIsPlaying(true);
          if(!videoRef.current) {
            return;
          }
          socketRef.current?.emit("vid-state", {
            roomId: id,
            isPlaying: true,
            videoId: selectedVideoId,
            currentTime: videoRef.current.currentTime,
          });
        }).catch((error) => {
          console.error("Play error:", error);
          alert(`Failed to play video: ${error.message}`);
        });
      }
    } catch (error) {
      console.error("Error in handlePlayPause:", error);
      alert("Error toggling play/pause. Please try again.");
    }
  }, 500); // Throttle to 500ms

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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim() && user && socketRef.current) {
      const newMessage = {
        id: uuidv4(),
        user: user.name || user.email || "User",
        text: message,
        timestamp: new Date(),
      }
      console.log("Sending message:", newMessage)
      setMessages((prevMessages) => [...prevMessages, newMessage])
      socketRef.current.emit("sendMessage", {
        roomId: id,
        message: newMessage,
      }, (response: any) => {
        console.log("Send message response:", response)
        if (response?.error) {
          setMessages((prevMessages) => prevMessages.filter((m) => m.id !== newMessage.id))
        }
      })
      setMessage("")
    } else {
      console.error("Cannot send message:", { message, user, socket: socketRef.current })
    }
  }

  const handleShareRoom = () => {
    navigator.clipboard.writeText(window.location.href)
    alert("Room link copied to clipboard!")
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

  return (
      <AuthCheck redirectTo="/login">
        <div className="container mx-auto grid min-h-screen grid-rows-[auto_1fr] gap-4 p-4">
          <header className="flex items-center justify-between py-4">
            <h1 className="text-2xl font-bold">Room: {id}</h1>
            <Button variant="outline" onClick={handleShareRoom}>
              <Share2 className="mr-2 h-4 w-4" />
              Share Room
            </Button>
          </header>

          <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
            <div className="flex flex-col space-y-4">
              <div className="relative aspect-video overflow-hidden rounded-lg bg-black">
                <video
                    ref={videoRef}
                    className="h-full w-full"
                    src={selectedVideoPath || undefined}
                    onTimeUpdate={() => {
                      if (videoRef.current) {
                        setCurrentTime(videoRef.current.currentTime);
                        socketRef.current?.emit("vid-state", {
                          roomId: id,
                          isPlaying: !videoRef.current.paused,
                          videoId: selectedVideoId,
                          currentTime: videoRef.current.currentTime,
                          serverTimestamp: Date.now(),
                        });
                      }
                    }}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onError={(e) => {
                      const videoElement = e.target as HTMLVideoElement;
                      const error = videoElement.error;
                      console.error("Video element error:", {
                        message: error?.message,
                        code: error?.code,
                        src: videoElement.src,
                        networkState: videoElement.networkState,
                        readyState: videoElement.readyState,
                      });
                      alert(`Failed to load video: ${error?.message || "Unknown error"} (Code: ${error?.code})`);
                      setIsPlaying(false);
                    }}
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
                          e.preventDefault()
                          e.currentTarget.form?.requestSubmit()
                        }
                      }}
                  />
                  <Button type="submit" size="icon" disabled={!message.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </div>

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
                            onClick={() => handlePlayClick(video._id)}
                            className="transform -translate-x-7"
                        >
                          Play
                        </Button>
                      </div>
                    </CardContent>
                    <button
                        onClick={() => handleDeleteClick(video._id)}
                        className="absolute top-2 right-2 flex items-center justify-center w-6 h-6 rounded-full bg-muted hover:bg-gray-200 transition-colors duration-200"
                        aria-label={`Delete ${video.originalName}`}
                    >
                      <X
                          className="w-4 h-4 text-muted-foreground hover:text-red-500 transition-colors duration-200"
                          strokeWidth={2.5}
                      />
                    </button>
                  </Card>
              ))}
            </div>

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
                    <Label htmlFor="videoFile">Select Video File</Label>
                    <Input
                        type="file"
                        id="videoFile"
                        accept="video/mp4,video/webm"
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