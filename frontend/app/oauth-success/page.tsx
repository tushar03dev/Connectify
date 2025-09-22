"use client"

import { OAuthSuccessHandler } from "@/components/oauth-buttons"

export default function OAuthSuccessPage() {
    return (
        <div className="flex h-screen items-center justify-center">
            <p className="text-lg">Finishing login...</p>
            <OAuthSuccessHandler />
        </div>
    )
}
