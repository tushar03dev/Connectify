import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { UserNav } from "@/components/user-nav"
import { AuthCheck } from "@/components/auth-check"

export const metadata: Metadata = {
  title: "Connectify - Watch Together",
  description: "Synchronize video playback across multiple devices",
}

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold">Connectify</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <AuthCheck
              fallback={
                <div className="flex gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href="/login">Login</Link>
                  </Button>
                  <Button asChild size="sm">
                    <Link href="/signup">Sign Up</Link>
                  </Button>
                </div>
              }
            >
              <UserNav />
            </AuthCheck>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  Watch Videos Together, Anywhere
                </h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                  Synchronize video playback across multiple devices. Perfect for remote movie nights with friends and
                  family.
                </p>
              </div>
              <div className="space-x-4">
                <Button asChild size="lg">
                  <Link href="/rooms">Create Room</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/how-it-works">How It Works</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-lg border bg-card p-6 shadow-sm">
                <div className="flex flex-col space-y-2">
                  <h3 className="text-xl font-bold">Synchronized Playback</h3>
                  <p className="text-muted-foreground">
                    Play, pause, and seek videos in perfect sync across all connected devices.
                  </p>
                </div>
              </div>
              <div className="rounded-lg border bg-card p-6 shadow-sm">
                <div className="flex flex-col space-y-2">
                  <h3 className="text-xl font-bold">Real-time Chat</h3>
                  <p className="text-muted-foreground">Discuss what you're watching with built-in text chat.</p>
                </div>
              </div>
              <div className="rounded-lg border bg-card p-6 shadow-sm">
                <div className="flex flex-col space-y-2">
                  <h3 className="text-xl font-bold">Easy Sharing</h3>
                  <p className="text-muted-foreground">
                    Share room links with friends to invite them to your viewing session.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            © {new Date().getFullYear()} Connectify. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="text-sm underline underline-offset-4 hover:text-primary">
              Terms
            </Link>
            <Link href="/privacy" className="text-sm underline underline-offset-4 hover:text-primary">
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

