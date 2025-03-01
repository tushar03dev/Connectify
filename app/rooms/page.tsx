"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AuthCheck } from "@/components/auth-check"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Video } from "lucide-react"

export default function RoomsPage() {
  const [roomName, setRoomName] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const router = useRouter()

  // Mock rooms data
  const rooms = [
    { id: "room-1", name: "Movie Night", participants: 3, createdAt: new Date() },
    { id: "room-2", name: "Study Group", participants: 2, createdAt: new Date() },
  ]

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)

    // Simulate room creation
    setTimeout(() => {
      const roomId = "room-" + Math.random().toString(36).substr(2, 9)
      router.push(`/rooms/${roomId}`)
    }, 1000)
  }

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
          <Card>
            <CardHeader>
              <CardTitle>Create New Room</CardTitle>
              <CardDescription>Start a new synchronized viewing session</CardDescription>
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

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Recent Rooms</h2>
            {rooms.length > 0 ? (
              <div className="space-y-4">
                {rooms.map((room) => (
                  <Card key={room.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="rounded-full bg-primary/10 p-2">
                            <Video className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-medium">{room.name}</h3>
                            <p className="text-sm text-muted-foreground">{room.participants} participants</p>
                          </div>
                        </div>
                        <Button size="sm" onClick={() => router.push(`/rooms/${room.id}`)}>
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
                  <p className="text-muted-foreground">You haven't created any rooms yet</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AuthCheck>
  )
}

