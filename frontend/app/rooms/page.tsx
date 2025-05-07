"use client"

import type React from "react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AuthCheck } from "@/components/auth-check"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Video } from "lucide-react"
import {useRoom} from "@/components/room-provider";

export default function RoomsPage() {
  const [roomName, setRoomName] = useState("")
  const router = useRouter()
  const [isCreating, setIsCreating] = useState(false)
  const [roomCode, setRoomCode] = useState("")
  const { rooms, createRoom, getRooms, joinRoom, isLoading, setSelectedRoom } = useRoom()

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)

    const roomId = Math.random().toString(36).substr(2, 9)
    const success = await createRoom(roomName,roomId)

    if (success === true){
      router.push(`/rooms/${roomId}`)}
    setIsCreating(false)
  }

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)

    const success = await joinRoom(roomCode)
    if (success === true) router.push(`/rooms/${roomCode}`)

    setIsCreating(false)
  }

  useEffect(() => {
    getRooms()
  }, [])

  return (
      <AuthCheck redirectTo="/login">
        <div className="container mx-auto p-4 py-8">
          <div className="mb-8 flex items-center justify-between">
            <h1 className="text-3xl font-bold">Your Rooms</h1>
            <Link href="/">
              <Button variant="outline">Back to Home</Button>
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Create Room */}
            <Card>
              <CardHeader>
                <CardTitle>Create New Room</CardTitle>
                <CardDescription>
                  Start a new synchronized viewing session
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleCreateRoom}>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="room-name">Room Name</Label>
                    <Input
                        id="room-name"
                        placeholder="e.g., Movie Night"
                        value={roomName}
                        onChange={(e) => setRoomName(e.target.value)}
                        required
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" disabled={isCreating}>
                    {isCreating ? "Creating..." : "Create Room"}
                  </Button>
                </CardFooter>
              </form>
            </Card>


            {/* Room List */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Recent Rooms</h2>
              {rooms.length > 0 ? (
                  <div className="space-y-4">
                    {rooms.map((room) => (
                        <Card key={room.code}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div className="rounded-full bg-primary/10 p-2">
                                  <Video className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                  <h3 className="font-medium">{room.name}</h3>
                                  <p className="text-sm text-muted-foreground">
                                    {room.members.length} participants
                                  </p>
                                </div>
                              </div>
                              <Button
                                  size="sm"
                                  onClick={() =>{
                                    router.push(`/rooms/${room.code}`)
                                    setSelectedRoom(room);
                                  }}
                              >
                                Join
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                    ))}
                  </div>
              ) : (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                        <Plus className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground">
                        You haven't created any rooms yet
                      </p>
                    </CardContent>
                  </Card>
              )}
            </div>

            {/* Join Room */}
            <Card>
              <CardHeader>
                <CardTitle>Join a Room</CardTitle>
                <CardDescription>
                  Connect to an existing viewing session
                </CardDescription>
              </CardHeader>

              <form onSubmit={handleJoinRoom}>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="room-name">Room Code</Label>
                    <Input
                        id="room-code"
                        placeholder="e.g., room-123..."
                        value={roomCode}
                        onChange={(e) => setRoomCode(e.target.value)}
                        required
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit">
                    Join Room
                  </Button>
                </CardFooter>
                </form>
            </Card>
          </div>
        </div>
      </AuthCheck>
  )
}
