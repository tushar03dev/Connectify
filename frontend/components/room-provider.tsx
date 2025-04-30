"use client"

import type React from "react"
import { createContext, useContext, useState } from "react"
import axios from "axios"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

type Room = {
    code: string
    name: string
    members: string[]
}

type RoomContextType = {
    room: Room | null
    rooms: Room[]
    createRoom: (name: string, code: string) => Promise<Boolean>
    getRooms: () => Promise<boolean>
    isLoading: boolean
}

const RoomContext = createContext<RoomContextType>({
    room: null,
    rooms: [],
    createRoom: async () => false,
    getRooms: async () => false,
    isLoading: true,
})

export function RoomProvider({ children }: { children: React.ReactNode }) {
    const [room, setRoom] = useState<Room | null>(null)
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

            if (response.data?.room) return true
            return false
        } catch (error) {
            console.error("Error creating room:", error)
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

    return (
        <RoomContext.Provider
            value={{ room, rooms, createRoom, getRooms, isLoading }}
        >
            {children}
        </RoomContext.Provider>
    )
}

export const useRoom = () => useContext(RoomContext)
