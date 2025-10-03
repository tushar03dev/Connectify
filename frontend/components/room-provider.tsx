"use client"

import type React from "react"
import { createContext, useContext, useState } from "react"
import axios from "axios"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

type Room = {
    code: string
    name: string
    members: string[]
    _id: string
}

type RoomContextType = {
    room: Room | null
    rooms: Room[]
    createRoom: (name: string, code: string) => Promise<Boolean>
    joinRoom: (code: string) => Promise<Boolean>
    getRooms: () => Promise<boolean>
    isLoading: boolean
    selectedRoom: Room | null
    setSelectedRoom: (room: Room | null) => void
    deleteRoom: (code: string) => Promise<Boolean>
}

const RoomContext = createContext<RoomContextType>({
    room: null,
    rooms: [],
    createRoom: async () => false,
    joinRoom: async () => false,
    getRooms: async () => false,
    isLoading: true,
    selectedRoom: null,
    setSelectedRoom: () => {},
    deleteRoom: async () => false,

})

export function RoomProvider({ children }: { children: React.ReactNode }) {
    const [room ] = useState<Room | null>(null)
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
    const [rooms, setRooms] = useState<Room[]>([])
    const [isLoading, setIsLoading] = useState(false)

    const createRoom = async (name: string, code: string) => {
        try {
            console.log("Creating room with name:", name, "and code:", code)
            setIsLoading(true)
            const token = localStorage.getItem("token")
            if (!token) {
                console.warn("Token not found in localStorage")
                return false
            }
            console.log("Token found:", token)

            const response = await axios.post(
                `${API_BASE_URL}/rooms/create-room`,
                { name, code },
                { headers: { Authorization: `Bearer ${token}` } }
            )

            console.log("Response from create-room API:", response.data)

            if (response.data?.room) {
                setSelectedRoom(response.data.room)
                console.log("Selected room set to:", response.data.room)
                return true
            } else {
                console.warn("No room object returned from API")
                return false
            }
        } catch (error) {
            console.error("Error creating room:", error)
            return false
        } finally {
            setIsLoading(false)
            console.log("Finished createRoom call")
        }
    }

    const joinRoom = async (code: string) => {
        try {
            console.log("Joining room with code:", code)
            setIsLoading(true)
            const token = localStorage.getItem("token")
            if (!token) {
                console.warn("Token not found in localStorage")
                return false
            }
            console.log("Token found:", token)

            const response = await axios.post(
                `${API_BASE_URL}/rooms/join-room`,
                { code },
                { headers: { Authorization: `Bearer ${token}` } }
            )

            console.log("Response from join-room API:", response.data)

            if (response.data?.room) {
                setSelectedRoom(response.data.room)
                console.log("Selected room set to:", response.data.room)
                return true
            } else {
                console.warn("No room object returned from API")
                return false
            }
        } catch (error) {
            console.error("Error joining room:", error)
            return false
        } finally {
            setIsLoading(false)
            console.log("Finished joinRoom call")
        }
    }

    const getRooms = async () => {
        try {
            console.log("Fetching rooms from server")
            setIsLoading(true)
            const token = localStorage.getItem("token")
            if (!token) {
                console.warn("Token not found in localStorage")
                return false
            }
            console.log("Token found:", token)

            const response = await axios.get(`${API_BASE_URL}/rooms/get-rooms`, {
                headers: { Authorization: `Bearer ${token}` },
            })

            console.log("Response from get-rooms API:", response.data)

            if (response.data?.rooms) {
                setRooms(response.data.rooms)
                console.log("Rooms state updated:", response.data.rooms)
                return true
            } else {
                console.warn("No rooms array returned from API")
                return false
            }
        } catch (error) {
            console.error("Error fetching rooms:", error)
            return false
        } finally {
            setIsLoading(false)
            console.log("Finished getRooms call")
        }
    }

    const deleteRoom = async (roomId: string) => {
        try {
            console.log("Deleting room with ID:", roomId)
            const token = localStorage.getItem("token")
            if (!token) {
                console.warn("Token not found in localStorage")
                return false
            }
            console.log("Token found:", token)

            const response = await axios.delete(`${API_BASE_URL}/rooms/delete-room/${roomId}`, {
                headers: { Authorization: `Bearer ${token}` },
            })

            console.log("Response from delete-room API:", response.status, response.data)

            if (response.status === 200) {
                console.log("Room deleted successfully from server")
                setRooms((prevRooms) => prevRooms.filter((room) => room._id !== roomId))
                console.log("Rooms state updated after deletion")
                return true
            } else {
                console.warn("Delete API did not return 200, still updating local state")
                setRooms((prevRooms) => prevRooms.filter((room) => room._id !== roomId))
                return false
            }
        } catch (error) {
            console.error("Error deleting room from server:", error)
            return false
        }
    }


    return (
        <RoomContext.Provider
            value={{ room, rooms, createRoom, getRooms, joinRoom, isLoading, selectedRoom, setSelectedRoom, deleteRoom }}
        >
            {children}
        </RoomContext.Provider>
    )
}

export const useRoom = () => useContext(RoomContext)