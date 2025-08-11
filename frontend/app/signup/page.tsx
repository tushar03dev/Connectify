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

export default function SignupPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [frontendErrors, setFrontendErrors] = useState("")
  const { signup, verifyOtp, errors } = useAuth()
  const [showOtpInput, setShowOtpInput] = useState(false)
  const [otp, setOtp] = useState("")
  const router = useRouter()
  const [passwordErrors, setPasswordErrors] = useState({ password: "" })

  const validatePassword = (pwd: string) => {
    if (pwd.length < 8) return "Password must be at least 8 characters."
    if (!/[A-Z]/.test(pwd)) return "Password must include at least one uppercase letter."
    if (!/[a-z]/.test(pwd)) return "Password must include at least one lowercase letter."
    if (!/[0-9]/.test(pwd)) return "Password must include at least one number."
    if (!/[^A-Za-z0-9]/.test(pwd)) return "Password must include at least one special character."
    return "" // No error
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setFrontendErrors("")

    const pwdError = validatePassword(password)
    if (pwdError) {
      setPasswordErrors({ password: pwdError })
      return // Don't submit
    }

    if (password !== confirmPassword) {
      setFrontendErrors("Passwords do not match")
      setIsLoading(false)
      return
    }

    try {
      const success = await signup(name, email, password)
      if (success) {
        setShowOtpInput(true)
      } else {
        console.log(errors)
        console.log("hello")
        setFrontendErrors(errors)
      }
    } catch (err) {
      setFrontendErrors("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleOtpVerify = async () => {
    const verified = await verifyOtp(email, otp)
    if (verified) {
      alert("Account created successfully!")
      // Redirect to dashboard or another page
      router.push("/")
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
            <CardTitle className="text-2xl font-bold">Create your account</CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">
              Join Connectify and start watching together
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {!showOtpInput && <OAuthButtonGroup mode="signup" />}

            {errors && <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{errors}</div>}
            {frontendErrors && (
                <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{frontendErrors}</div>
            )}

            {!showOtpInput ? (
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                        id="name"
                        placeholder="Your name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value.trim())}
                        required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => {
                          const value = e.target.value.trim()
                          setPassword(value)
                          setPasswordErrors({ ...passwordErrors, password: validatePassword(value) })
                        }}
                        required
                    />
                    {passwordErrors.password && <span className="text-sm text-destructive">{passwordErrors.password}</span>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input
                        id="confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value.trim())}
                        required
                    />
                  </div>
                  <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg"
                      disabled={isLoading}
                  >
                    {isLoading ? "Creating account..." : "Create account"}
                  </Button>
                </form>
            ) : (
                <div className="space-y-4">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Verify your email</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      We've sent a verification code to {email}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="otp">Verification Code</Label>
                    <Input
                        id="otp"
                        type="text"
                        placeholder="Enter verification code"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.trim())}
                        className="text-center text-lg tracking-widest"
                    />
                  </div>
                  <Button
                      type="button"
                      className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg"
                      onClick={handleOtpVerify}
                  >
                    Verify & Create Account
                  </Button>
                </div>
            )}
          </CardContent>

          <CardFooter className="text-center">
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Already have an account?{" "}
              <Link
                  href="/login"
                  className="text-blue-600 dark:text-blue-400 underline underline-offset-4 hover:text-blue-700 dark:hover:text-blue-300 transition-colors font-medium"
              >
                Sign in
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
  )
}
