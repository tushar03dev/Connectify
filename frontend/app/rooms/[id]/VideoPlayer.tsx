"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Pause, Play, Volume2, VolumeX, Maximize, Minimize, Settings } from "lucide-react"
import type { Socket } from "socket.io-client"
import type { DefaultEventsMap } from "@socket.io/component-emitter"

interface VideoPlayerProps {
    socketRef: React.MutableRefObject<Socket<DefaultEventsMap, DefaultEventsMap> | null>
    roomId: string
}

export default function VideoPlayer({ socketRef, roomId }: VideoPlayerProps) {
    const [isPlaying, setIsPlaying] = useState(false)
    const [volume, setVolume] = useState(80)
    const [isMuted, setIsMuted] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(100)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [isTheaterMode, setIsTheaterMode] = useState(false)
    const [showControls, setShowControls] = useState(true)
    const [playbackSpeed, setPlaybackSpeed] = useState(1)
    const [showSpeedMenu, setShowSpeedMenu] = useState(false)
    const [selectedVideoPath, setSelectedVideoPath] = useState<string | null>(null)
    const videoRef = useRef<HTMLVideoElement>(null)
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

    useEffect(() => {
        if (typeof window === "undefined") return

        socketRef.current?.on("video-selected", ({ videoUrl }) => {
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

        return () => {
            socketRef.current?.off("video-selected")
            socketRef.current?.off("vid-state")
            socketRef.current?.off("progress-bar-clicked")
            socketRef.current?.off("playback-speed-changed")
        }
    }, [playbackSpeed])

    useEffect(() => {
        if (typeof window === "undefined") return

        let syncInterval: NodeJS.Timeout | undefined
        if (isPlaying && selectedVideoPath && videoRef.current) {
            syncInterval = setInterval(() => {
                socketRef.current?.emit("vid-state", {
                    roomId,
                    isPlaying: true,
                    videoUrl: selectedVideoPath,
                    currentTime: videoRef.current?.currentTime || 0,
                    playbackSpeed,
                })
            }, 10000)
        }
        return () => clearInterval(syncInterval)
    }, [isPlaying, selectedVideoPath, roomId, playbackSpeed])

    const toggleFullscreen = async () => {
        console.log("=== FULLSCREEN DEBUG START ===")
        if (!videoContainerRef.current) {
            console.error("Video container ref is null")
            return
        }

        const element = videoContainerRef.current
        element.focus()
        await new Promise((resolve) => setTimeout(resolve, 50))

        try {
            const isCurrentlyFullscreen =
                document.fullscreenElement ||
                (document as any).webkitFullscreenElement ||
                (document as any).mozFullScreenElement ||
                (document as any).msFullscreenElement

            if (!isCurrentlyFullscreen) {
                console.log("Attempting to ENTER fullscreen...")
                let fullscreenPromise: Promise<void> | undefined
                if (element.requestFullscreen) {
                    fullscreenPromise = element.requestFullscreen({ navigationUI: "hide" }).catch((error) => {
                        console.log("Standard requestFullscreen failed, trying without options")
                        return element.requestFullscreen()
                    })
                } else if ((element as any).webkitRequestFullscreen) {
                    fullscreenPromise = (element as any).webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT)
                } else if ((element as any).mozRequestFullScreen) {
                    fullscreenPromise = (element as any).mozRequestFullScreen()
                } else if ((element as any).msRequestFullscreen) {
                    fullscreenPromise = (element as any).msRequestFullscreen()
                } else {
                    throw new Error("No fullscreen API available")
                }

                if (fullscreenPromise) {
                    await fullscreenPromise
                    console.log("Fullscreen request completed successfully")
                    await new Promise((resolve) => setTimeout(resolve, 100))
                    if (!isFullscreen) {
                        console.log("Manually setting fullscreen state to true")
                        setIsFullscreen(true)
                    }
                }
            } else {
                console.log("Attempting to EXIT fullscreen...")
                let exitPromise: Promise<void> | undefined
                if (document.exitFullscreen) {
                    exitPromise = document.exitFullscreen()
                } else if ((document as any).webkitExitFullscreen) {
                    exitPromise = (document as any).webkitExitFullscreen()
                } else if ((document as any).mozCancelFullScreen) {
                    exitPromise = (document as any).mozCancelFullScreen()
                } else if ((document as any).msExitFullscreen) {
                    exitPromise = (document as any).msExitFullscreen()
                } else {
                    throw new Error 
                }

                if (exitPromise) {
                    await exitPromise
                    console.log("Exit fullscreen request completed successfully")
                }
            }
        } catch (error) {
            console.error("Fullscreen API error:", error)
            if (error instanceof Error) {
                if (error.name === "NotAllowedError") {
                    console.error("Fullscreen blocked - user interaction required or permissions denied")
                    alert("Fullscreen was blocked. Please try clicking the fullscreen button again.")
                } else if (error.name === "TypeError") {
                    console.error("Fullscreen API not supported")
                    alert("Fullscreen is not supported in your browser.")
                } else if (error.name === "InvalidStateError") {
                    console.error("Invalid state for fullscreen")
                    setIsFullscreen(false)
                    setTimeout(() => toggleFullscreen(), 100)
                    return
                } else {
                    console.error("Unknown fullscreen error:", error.message)
                }
            }
            return
        }
        console.log("=== FULLSCREEN DEBUG END ===")
    }

    useEffect(() => {
        if (typeof window === "undefined") return

        let fullscreenChangeTimeout: NodeJS.Timeout
        const handleFullscreenChange = () => {
            clearTimeout(fullscreenChangeTimeout)
            fullscreenChangeTimeout = setTimeout(() => {
                const isNowFullscreen = !!(
                    document.fullscreenElement ||
                    (document as any).webkitFullscreenElement ||
                    (document as any).mozFullScreenElement ||
                    (document as any).msFullscreenElement
                )
                console.log("Fullscreen state changed via event:", isNowFullscreen)
                if (isNowFullscreen !== isFullscreen) {
                    setIsFullscreen(isNowFullscreen)
                    if (!isNowFullscreen) {
                        setIsTheaterMode(false)
                        setShowControls(true)
                    }
                }
            }, 50)
        }

        const handleFullscreenError = (event: Event) => {
            console.error("Fullscreen error event:", event)
            setIsFullscreen(false)
            setIsTheaterMode(false)
        }

        const events = ["fullscreenchange", "webkitfullscreenchange", "mozfullscreenchange", "MSFullscreenChange"]
        const errorEvents = ["fullscreenerror", "webkitfullscreenerror", "mozfullscreenerror", "MSFullscreenError"]

        events.forEach((event) => document.addEventListener(event, handleFullscreenChange))
        errorEvents.forEach((event) => document.addEventListener(event, handleFullscreenError))

        return () => {
            clearTimeout(fullscreenChangeTimeout)
            events.forEach((event) => document.removeEventListener(event, handleFullscreenChange))
            errorEvents.forEach((event) => document.removeEventListener(event, handleFullscreenError))
        }
    }, [isFullscreen])

    useEffect(() => {
        if (typeof window === "undefined") return

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
            if (e.key === "f" || e.key === "F") {
                e.preventDefault()
                console.log("F key pressed, attempting fullscreen")
                toggleFullscreen()
            }
        }

        document.addEventListener("keydown", handleKeyDown)
        return () => document.removeEventListener("keydown", handleKeyDown)
    }, [])

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
                roomId,
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
            roomId,
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
            roomId,
            speed,
        })
        setShowSpeedMenu(false)
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins}:${secs < 10 ? "0" : ""}${secs}`
    }

    const handleMouseMove = () => {
        setShowControls(true)
        if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current)
        }
        controlsTimeoutRef.current = setTimeout(() => {
            if (isPlaying && (isFullscreen || isTheaterMode)) {
                setShowControls(false)
            }
        }, 3000)
    }

    const toggleTheaterMode = () => {
        if (!isFullscreen) {
            toggleFullscreen()
            setIsTheaterMode(true)
        } else {
            setIsTheaterMode(!isTheaterMode)
        }
    }

    const handleDoubleClick = () => {
        console.log("Double-click detected, attempting fullscreen")
        toggleFullscreen()
    }

    const testFullscreenCapabilities = () => {
        console.log("=== TESTING FULLSCREEN CAPABILITIES ===")
        if (!videoContainerRef.current) {
            console.log("❌ Video container ref is null")
            return
        }
        const element = videoContainerRef.current
        console.log("Element details:", {
            tagName: element.tagName,
            id: element.id,
            className: element.className,
            clientWidth: element.clientWidth,
            clientHeight: element.clientHeight,
        })
        console.log("Fullscreen API availability:", {
            "element.requestFullscreen": typeof element.requestFullscreen,
            "element.webkitRequestFullscreen": typeof (element as any).webkitRequestFullscreen,
            "element.mozRequestFullScreen": typeof (element as any).mozRequestFullScreen,
            "element.msRequestFullscreen": typeof (element as any).msRequestFullscreen,
            "document.fullscreenEnabled": document.fullscreenEnabled,
            "document.webkitFullscreenEnabled": (document as any).webkitFullscreenEnabled,
        })
        console.log("Current fullscreen state:", {
            "document.fullscreenElement": document.fullscreenElement,
            "document.webkitFullscreenElement": (document as any).webkitFullscreenElement,
            "document.mozFullScreenElement": (document as any).mozFullScreenElement,
            "document.msFullscreenElement": (document as any).msFullscreenElement,
        })
        console.log("User agent:", navigator.userAgent)
        console.log("=== END TEST ===")
    }

    return (
        <div
            ref={videoContainerRef}
            className={`group relative aspect-video overflow-hidden rounded-2xl bg-black shadow-2xl flex-shrink-0 ${
                isFullscreen ? "fixed inset-0 z-50 flex flex-col" : ""
            }`}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => isPlaying && setShowControls(false)}
            onDoubleClick={handleDoubleClick}
            style={{ cursor: "pointer" }}
            tabIndex={0}
            role="button"
            aria-label="Video player - double click or press F for fullscreen"
        >
            <video
                ref={videoRef}
                className="h-full w-full object-contain"
                src={selectedVideoPath || undefined}
                onTimeUpdate={() => {
                    if (videoRef.current) {
                        setCurrentTime(videoRef.current.currentTime)
                        setDuration(videoRef.current.duration || 100)
                        socketRef.current?.emit("vid-state", {
                            roomId,
                            isPlaying: !videoRef.current.paused,
                            videoUrl: selectedVideoPath,
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
                    console.error("Video element error:", {
                        message: videoElement.error?.message,
                        code: videoElement.error?.code,
                        src: videoElement.src,
                        networkState: videoElement.networkState,
                        readyState: videoElement.readyState,
                    })
                    setIsPlaying(false)
                }}
            />
            <div
                className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 transition-opacity duration-300 ${
                    showControls ? "opacity-100" : "opacity-0"
                }`}
            >
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
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Button variant="ghost" size="icon" onClick={handlePlayPause} className="text-white hover:bg-white/20">
                            {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                        </Button>
                        <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="icon" onClick={handleMuteToggle} className="text-white hover:bg-white/20">
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
                        <span className="text-sm text-white font-mono">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
                    </div>
                    <div className="flex items-center space-x-2">
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
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                console.log("Fullscreen button clicked")
                                toggleFullscreen()
                            }}
                            className="text-white hover:bg-white/20"
                        >
                            {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
                        </Button>
                    </div>
                </div>
            </div>
            <Button
                variant="outline"
                onClick={testFullscreenCapabilities}
                className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white border-0"
            >
                Test Fullscreen
            </Button>
        </div>
    )
}