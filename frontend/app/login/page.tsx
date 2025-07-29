"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ThemeToggle } from "@/components/theme-toggle"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [otp, setOtp] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isForgotPassword, setIsForgotPassword] = useState(false)
  const [isOtpSent, setIsOtpSent] = useState(false)
  const [error, seterror] = useState("")
  const { login, requestOtp, verifyOtpAndReset } = useAuth()
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    seterror("")

    try {
      const success = await login(email, password)
      if (success) {
        router.push("/")
      } else {
        seterror("Invalid email or password")
      }
    } catch (err) {
      seterror("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    seterror("")

    try {
      const success = await requestOtp(email)
      if (success) {
        setIsOtpSent(true)
        seterror("OTP sent successfully")
      } else {
        seterror("Failed to send OTP. Please try again.")
      }
    } catch (err) {
      seterror("An error occurred while sending OTP. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOtpAndReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    seterror("")

    try {
      const success = await verifyOtpAndReset(email, newPassword, otp)
      if (success) {
        seterror("Password reset successfully")
        setIsForgotPassword(false)
        setIsOtpSent(false)
        setEmail("")
        setOtp("")
        setNewPassword("")
      } else {
        seterror("Invalid OTP or reset failed")
      }
    } catch (err) {
      seterror("An error occurred while verifying OTP. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
        <div className="absolute right-4 top-4">
          <ThemeToggle />
        </div>
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">
              {isForgotPassword ? (isOtpSent ? "Reset Password" : "Forgot Password") : "Login"}
            </CardTitle>
            <CardDescription>
              {isForgotPassword
                  ? isOtpSent
                      ? "Enter the OTP and your new password"
                      : "Enter your email to receive an OTP"
                  : "Enter your email and password to access your account"}
            </CardDescription>
          </CardHeader>
          {isForgotPassword ? (
              isOtpSent ? (
                  <form onSubmit={handleVerifyOtpAndReset}>
                    <CardContent className="space-y-4">
                      {error && <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{error}</div>}
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="name@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="otp">OTP</Label>
                        <Input
                            id="otp"
                            type="text"
                            placeholder="Enter OTP"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-password">New Password</Label>
                        <Input
                            id="new-password"
                            type="password"
                            placeholder="Enter new password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                        />
                      </div>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4">
                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? "Resetting Password..." : "Reset Password"}
                      </Button>
                      <div className="text-center text-sm">
                        <button
                            type="button"
                            onClick={() => {
                              setIsForgotPassword(false)
                              setIsOtpSent(false)
                              setOtp("")
                              setNewPassword("")
                            }}
                            className="text-primary underline underline-offset-4 hover:text-primary/90"
                        >
                          Back to Login
                        </button>
                      </div>
                    </CardFooter>
                  </form>
              ) : (
                  <form onSubmit={handleForgotPassword}>
                    <CardContent className="space-y-4">
                      {error && <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{error}</div>}
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="name@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                      </div>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4">
                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? "Sending OTP..." : "Send OTP"}
                      </Button>
                      <div className="text-center text-sm">
                        <button
                            type="button"
                            onClick={() => setIsForgotPassword(false)}
                            className="text-primary underline underline-offset-4 hover:text-primary/90"
                        >
                          Back to Login
                        </button>
                      </div>
                    </CardFooter>
                  </form>
              )
          ) : (
              <form onSubmit={handleLogin}>
                <CardContent className="space-y-4">
                  {error && <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{error}</div>}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      <button
                          type="button"
                          onClick={() => setIsForgotPassword(true)}
                          className="text-xs text-muted-foreground underline underline-offset-4 hover:text-primary"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Logging in..." : "Login"}
                  </Button>
                  <div className="text-center text-sm">
                    Don't have an account?{" "}
                    <Link href="/signup" className="text-primary underline underline-offset-4 hover:text-primary/90">
                      Sign up
                    </Link>
                  </div>
                </CardFooter>
              </form>
          )}
        </Card>
      </div>
  )
}