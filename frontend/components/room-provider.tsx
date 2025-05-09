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

            setIsLoading(true)
            const token = localStorage.getItem("token")
            if (!token) {
                console.log("token not found")
                return false
            }

            const response = await axios.post(
                `${API_BASE_URL}/rooms/create`,
                { name, code },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            )

            if (response.data?.room) {
                setSelectedRoom(response.data.room);
                console.log(selectedRoom?.name)
                return true;
            }
            return false;

        } catch (error) {
            console.error("Error creating room:", error)
            return false
        } finally {
            setIsLoading(false)
        }
    }

    const joinRoom = async (code: string) => {
        try {

            setIsLoading(true)
            const token = localStorage.getItem("token")
            if (!token) {
                console.log("token not found")
                return false
            }

            const response = await axios.post(
                `${API_BASE_URL}/rooms/join`,
                { code },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            )

            if (response.data?.room) {
                setSelectedRoom(response.data.room)
                return true;
            }
            return false;


        } catch (error) {
            console.error("Error joining room:", error)
            return false
        } finally {
            setIsLoading(false)
        }
    }

    const getRooms = async () => {
        try {
            setIsLoading(true)
            const token = localStorage.getItem("token")
            if (!token) {
                console.log("Token not found")
                return false
            }


            const response = await axios.get(`${API_BASE_URL}/rooms/get-rooms`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            if (response.data?.rooms) {
                setRooms(response.data.rooms)
                return true
            }
            return false
        } catch (error) {
            console.error("Error fetching rooms:", error)
            return false
        } finally {
            setIsLoading(false)
        }
    }

    const deleteRoom = async (roomId: string) => {
        try {
            console.log(roomId)
            const token = localStorage.getItem("token")
            if (!token) {
                console.log("token not found")
                return false
            }

            const response = await axios.delete(`${API_BASE_URL}/rooms/delete-room/${roomId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                }
            })

            if (response.status === 200) {
                console.log("Error caused at server in deleting room")
                setRooms((prevRooms) => prevRooms.filter((room) => room._id !== roomId))
                return true
            }

            setRooms((prevRooms) => prevRooms.filter((room) => room._id !== roomId))
            return false
        } catch (error) {
            console.error("Error deleting room from the server:", error)
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