"use client"

import type React from "react"

import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export function AuthCheck({
  children,
  fallback,
  redirectTo,
}: {
  children: React.ReactNode
  fallback?: React.ReactNode
  redirectTo?: string
}) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user && redirectTo) {
      router.push(redirectTo)
    }
  }, [user, isLoading, router, redirectTo])

  if (isLoading) {
    return <div className="flex justify-center p-4">Loading...</div>
  }

  if (!user) {
    return fallback || null
  }

  return <>{children}</>
}

