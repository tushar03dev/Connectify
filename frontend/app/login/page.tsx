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
import { OAuthButtonGroup } from "@/components/oauth-buttons"

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
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4">
        <div className="absolute right-4 top-4">
          <ThemeToggle />
        </div>

        <Link href="/" className="mb-6 flex items-center space-x-3 group">
          <div className="relative">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-lg"></div>
            <div className="absolute inset-0 w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-lg animate-pulse opacity-75"></div>
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">
          Connectify
        </span>
        </Link>

        <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">
              {isForgotPassword ? (isOtpSent ? "Reset Password" : "Forgot Password") : "Welcome back"}
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">
              {isForgotPassword
                  ? isOtpSent
                      ? "Enter the OTP and your new password"
                      : "Enter your email to receive an OTP"
                  : "Sign in to your Connectify account"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {!isForgotPassword && <OAuthButtonGroup mode="login" />}

            {error && <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{error}</div>}

            {isForgotPassword ? (
                isOtpSent ? (
                    <form onSubmit={handleVerifyOtpAndReset} className="space-y-4">
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
                      <Button
                          type="submit"
                          className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                          disabled={isLoading}
                      >
                        {isLoading ? "Resetting Password..." : "Reset Password"}
                      </Button>
                    </form>
                ) : (
                    <form onSubmit={handleForgotPassword} className="space-y-4">
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
                      <Button
                          type="submit"
                          className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                          disabled={isLoading}
                      >
                        {isLoading ? "Sending OTP..." : "Send OTP"}
                      </Button>
                    </form>
                )
            ) : (
                <form onSubmit={handleLogin} className="space-y-4">
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
                          className="text-xs text-muted-foreground underline underline-offset-4 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
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
                  <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg"
                      disabled={isLoading}
                  >
                    {isLoading ? "Signing in..." : "Sign in"}
                  </Button>
                </form>
            )}
          </CardContent>

          <CardFooter className="text-center">
            {isForgotPassword ? (
                <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(false)
                      setIsOtpSent(false)
                      setOtp("")
                      setNewPassword("")
                    }}
                    className="text-sm text-blue-600 dark:text-blue-400 underline underline-offset-4 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                >
                  Back to Sign in
                </button>
            ) : (
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Don't have an account?{" "}
                  <Link
                      href="/signup"
                      className="text-blue-600 dark:text-blue-400 underline underline-offset-4 hover:text-blue-700 dark:hover:text-blue-300 transition-colors font-medium"
                  >
                    Sign up
                  </Link>
                </div>
            )}
          </CardFooter>
        </Card>
      </div>
  )
}
