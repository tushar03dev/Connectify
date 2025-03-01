"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"
import { AuthCheck } from "@/components/auth-check"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/components/auth-provider"
import { Pause, Play, Send, Share2, Volume2, VolumeX } from "lucide-react"

export default function RoomPage() {
  const { id } = useParams()
  const { user } = useAuth()
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

  // Mock video URL - in a real app, this would come from your backend0
  const videoUrl = "/placeholder-video.mp4"

  useEffect(() => {
    // Scroll to bottom of chat when messages change
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [messages])

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
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

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
      setDuration(videoRef.current.duration || 100)
    }
  }

  const handleSeek = (value: number[]) => {
    const seekTime = value[0]
    setCurrentTime(seekTime)
    if (videoRef.current) {
      videoRef.current.currentTime = seekTime
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim() && user) {
      const newMessage = {
        id: Date.now().toString(),
        user: user.name,
        text: message,
        timestamp: new Date(),
      }
      setMessages([...messages, newMessage])
      setMessage("")
    }
  }

  const handleShareRoom = () => {
    navigator.clipboard.writeText(window.location.href)
    alert("Room link copied to clipboard!")
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
                src={videoUrl}
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
                          {msg.timestamp.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
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
              <form onSubmit={handleSendMessage} className="flex space-x-2">
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="min-h-[40px] flex-1 resize-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage(e)
                    }
                  }}
                />
                <Button type="submit" size="icon" disabled={!message.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </AuthCheck>
  )
}

