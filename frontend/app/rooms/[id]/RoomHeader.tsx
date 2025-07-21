"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Share2, Users, Check, Copy } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface User {
    id: string
    name: string
    avatar?: string
    isActive: boolean
    isOwner?: boolean
}

interface RoomHeaderProps {
    id: string
    users: User[]
}

export default function RoomHeader({ id, users }: RoomHeaderProps) {
    const [copied, setCopied] = useState(false)
    const [showParticipants, setShowParticipants] = useState(false)

    const handleShareRoom = () => {
        if (typeof window !== "undefined") {
            navigator.clipboard.writeText(window.location.href)
        }
    }

    const handleCopyRoomCode = async () => {
        if (typeof window === "undefined") return
        try {
            await navigator.clipboard.writeText(id)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            console.error("Failed to copy:", err)
        }
    }

    return (
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
                            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        </Button>
                        {copied && (
                            <span className="text-xs text-green-600 dark:text-green-400 animate-fade-in">Copied!</span>
                        )}
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
    )
}