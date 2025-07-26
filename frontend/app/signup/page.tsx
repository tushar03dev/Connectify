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

export default function SignupPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const { signup, verifyOtp } = useAuth()
  const [showOtpInput, setShowOtpInput] = useState(false)
  const [otp, setOtp] = useState("")
  const [otpToken, setOtpToken] = useState('');
  const router = useRouter()
  const [errors, setErrors] = useState({ password: '' });


  const validatePassword = (pwd : string) => {
    if (pwd.length < 8) return 'Password must be at least 8 characters.';
    if (!/[A-Z]/.test(pwd)) return 'Password must include at least one uppercase letter.';
    if (!/[a-z]/.test(pwd)) return 'Password must include at least one lowercase letter.';
    if (!/[0-9]/.test(pwd)) return 'Password must include at least one number.';
    if (!/[^A-Za-z0-9]/.test(pwd)) return 'Password must include at least one special character.';
    return ''; // No error
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const pwdError = validatePassword(password);
    if (pwdError) {
      setErrors({ password: pwdError });
      return; // Don't submit
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    try {
      const success = await signup(name, email, password)
      if (success) {
        setShowOtpInput(true)
      } else {
        setError("Failed to create account")
      }
    } catch (err) {
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleOtpVerify = async () => {
    const verified = await verifyOtp(email,otp);
    if (verified) {
      alert("Account created successfully!");
      // Redirect to dashboard or another page
      router.push("/");
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <Link href="/" className="mb-4 flex items-center space-x-2">
        <span className="text-2xl font-bold">Connectify</span>
      </Link>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Create an account</CardTitle>
          <CardDescription>Enter your information to create a Connectify account</CardDescription>
        </CardHeader>
        <form onSubmit={handleSignup}>
          <CardContent className="space-y-4">
            {error && <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{error}</div>}
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
                  const value = e.target.value.trim();
                  setPassword(value);
                  setErrors({ ...errors, password: validatePassword(value)})
                }}
                required
              />
              {errors.password && <span style={{ color: 'red' }}>{errors.password}</span>}
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
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            {!showOtpInput ? (
                <Button type="button" className="w-full" onClick={handleSignup} disabled={isLoading}>
                  {isLoading ? "Creating account..." : "Sign Up"}
                </Button>
            ) : (
                <>
                  <div className="space-y-2 w-full">
                    <Label htmlFor="otp">Enter OTP</Label>
                    <Input
                        id="otp"
                        type="text"
                        placeholder="Enter OTP"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.trim())}
                    />
                  </div>
                  <Button type="button" className="w-full" onClick={handleOtpVerify}>
                    Verify OTP
                  </Button>
                </>
            )}

            <div className="text-center text-sm">
              Already have an account?{" "}
              <Link href="/login" className="text-primary underline underline-offset-4 hover:text-primary/90">
                Login
              </Link>
            </div>
          </CardFooter>

        </form>
      </Card>
    </div>
  )
}

