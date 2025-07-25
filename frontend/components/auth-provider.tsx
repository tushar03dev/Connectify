"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

type User = {
  id: string
  name: string
  email: string
} | null

let tempUser:any;

type AuthContextType = {
  user: User
  login: (email: string, password: string) => Promise<boolean>
  signup: (name: string, email: string, password: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
  verifyOtp: (otp: string) => Promise<boolean>
  requestOtp: (email: string) => Promise<boolean>
  verifyOtpAndReset: (email: string, password: string, otp: string, otpToken: string) => Promise<boolean>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => false,
  signup: async () => false,
  logout: () => {},
  isLoading: true,
  verifyOtp: async () => false,
  requestOtp: async() => false,
  verifyOtpAndReset : async() => false,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is stored in localStorage
    const storedUser = localStorage.getItem("connectify-user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    try {

      const response = await axios.post(`${API_BASE_URL}/auth/sign-in`, { email, password });

      if (response.data) {
        localStorage.setItem('token', response.data.token);
        alert('Login successful!');
        // Redirect to dashboard or another page
        window.location.href = '/';

        // Mock user data
        const userData = {
          id: "user-" + Math.random().toString(36).substr(2, 9),
          name: response.data.name,
          email,
        }

        setUser(userData)
        localStorage.setItem("connectify-user", JSON.stringify(userData))
        return true
      } else {
        console.error('Login failed. Please try again.');
        return false
      }
    } catch (error) {
      console.error("Login failed:", error)
      return false
    }
  }

  const signup = async (name: string, email: string, password: string) => {
    try {

      const response = await axios.post(`${API_BASE_URL}/auth/sign-up`, {name, email, password });

      if (response.data.success) {
        // Temporarily store user data
        tempUser = { name, email};
        return true
      } else {
        console.error('Signup failed. Please try again.');
        return false
      }
    } catch (error) {
      console.error("Signup failed:", error)
      return false
    }
  }

  const verifyOtp = async (otp: string) => {
    try {

      const response = await axios.post(`${API_BASE_URL}/auth/verify`, { otp });
      if (response.data) {

        // Mock user data
        const userData = {
          id: "user-" + Math.random().toString(36).substr(2, 9),
          name: tempUser.name,
          email: tempUser.email,
        }

        setUser(userData)
        localStorage.setItem("connectify-user", JSON.stringify(userData))
        return true

      } else {
        console.error('Signup failed. Please try again.');
        return false
      }
    } catch (error) {
      console.error("Signup failed:", error)
      return false
    }
  }

  const requestOtp = async (email: string) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/password-reset`, {email});
      if (response.data.otpToken) {
        localStorage.setItem('otpToken', response.data.otpToken);
        return true
      } else {
        return false
      }
    } catch (error) {
      console.error("Otp Request Failed", error)
      return false
    }
  }

  const verifyOtpAndReset = async (email: string, password: string, otp:string, otpToken:string) => {
   try {
     const response = await axios.post(`${API_BASE_URL}/auth/change-password`, {email, password, otp, otpToken});
     if (response.data) {
       return true
     } else {
       return false
     }
   } catch (error) {
     console.error("Password Reset Request Failed:", error)
     return false
   }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("connectify-user")
    localStorage.removeItem("token")
  }

  return <AuthContext.Provider value={{ user, login, signup, logout, isLoading, verifyOtp, requestOtp, verifyOtpAndReset}}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)

