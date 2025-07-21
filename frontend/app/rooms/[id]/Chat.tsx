"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, Users } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { v4 as uuidv4 } from "uuid"
import type { Socket } from "socket.io-client"
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

interface ChatProps {
    messages: Message[]
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>
    users: User[]
    user: any
    roomId: string
    socketRef: React.MutableRefObject<Socket<DefaultEventsMap, DefaultEventsMap> | null>
    chatContainerRef: React.RefObject<HTMLDivElement>
    unreadCount: number
    setUnreadCount: React.Dispatch<React.SetStateAction<number>>
    isAtBottom: boolean
    setIsAtBottom: React.Dispatch<React.SetStateAction<boolean>>
    isCurrentUser: (userId: string) => boolean
}

export default function Chat({
                                 messages,
                                 setMessages,
                                 users,
                                 user,
                                 roomId,
                                 socketRef,
                                 chatContainerRef,
                                 unreadCount,
                                 setUnreadCount,
                                 isAtBottom,
                                 setIsAtBottom,
                                 isCurrentUser,
                             }: ChatProps) {
    const [message, setMessage] = useState("")
    const [showParticipants, setShowParticipants] = useState(false)

    useEffect(() => {
        if (typeof window === "undefined" || !chatContainerRef.current) return

        const container = chatContainerRef.current
        const handleScroll = () => {
            const { scrollTop, scrollHeight, clientHeight } = container
            const isNearBottom = scrollTop + clientHeight >= scrollHeight - 50
            setIsAtBottom(isNearBottom)
            if (isNearBottom) {
                setUnreadCount(0)
            }
        }

        container.addEventListener("scroll", handleScroll)
        if (isAtBottom) {
            container.scrollTop = container.scrollHeight
            setUnreadCount(0)
        }

        return () => container.removeEventListener("scroll", handleScroll)
    }, [messages, isAtBottom, setIsAtBottom, setUnreadCount, chatContainerRef])

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
                    roomId,
                    message: newMessage,
                },
                (response: any) => {
                    console.log("Send message response:", response)
                    if (response?.error) {
                        setMessages((prevMessages) => prevMessages.filter((m) => m.id !== newMessage.id))
                    }
                }
            )
            setMessages((prevMessages) => [...prevMessages, newMessage])
            setMessage("")
        } else {
            console.error("Cannot send message:", { message, user, socket: socketRef.current })
        }
    }

    const scrollToBottom = () => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
            setUnreadCount(0)
            setIsAtBottom(true)
        }
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

    const formatTime12Hour = (date: Date) => {
        return date.toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        })
    }

    return (
        <div className="flex flex-col elegant-card rounded-2xl overflow-hidden" style={{ height: "fit-content", maxHeight: "calc(100vh - 200px)" }}>
            <div className="border-b border-blue-200/50 dark:border-blue-800/50 p-4 flex-shrink-0">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="font-semibold text-slate-900 dark:text-white flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                        Live Chat
                    </h2>
                    <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className="bg-blue-500/20 text-blue-700 dark:text-blue-300">
                            {messages.length} messages
                        </Badge>
                        {unreadCount > 0 && (
                            <Badge
                                variant="destructive"
                                className="bg-red-500 text-white cursor-pointer animate-pulse"
                                onClick={scrollToBottom}
                            >
                                {unreadCount} new
                            </Badge>
                        )}
                    </div>
                </div>
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
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-3 w-3"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
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
                                            {user.isOwner && <svg className="absolute -top-1 -right-1 h-3 w-3 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                                                <path d="M10 2l2.5 5.5L18 7.5l-4 4.5 1.5 6-5.5-3.5L4.5 18l1.5-6-4-4.5 5.5-.5L10 2z" />
                                            </svg>}
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
                                <span className="text-sm text-slate-600 dark:text-slate-400">Inactive ({inactiveUsers.length})</span>
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
            <div className="flex-1 overflow-hidden" style={{ height: "400px" }}>
                <ScrollArea className="h-full p-4">
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
                                        {!isCurrentUser(msg.userId) && (
                                            <Avatar className="h-8 w-8 flex-shrink-0">
                                                <AvatarImage src={msg.avatar || "/placeholder.svg"} />
                                                <AvatarFallback className="text-xs bg-blue-600 text-white">
                                                    {getInitials(msg.user)}
                                                </AvatarFallback>
                                            </Avatar>
                                        )}
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
                                                <span className="text-xs opacity-60">{formatTime12Hour(msg.timestamp)}</span>
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
            </div>
            <div className="border-t border-blue-200/50 dark:border-blue-800/50 p-4 flex-shrink-0">
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
    )
}