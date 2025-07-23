import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { UserNav } from "@/components/user-nav"
import { AuthCheck } from "@/components/auth-check"
import { Play, Users, Video, MessageCircle, Share2, ArrowRight, CheckCircle, Zap, Shield, Globe } from "lucide-react"

export const metadata: Metadata = {
  title: "Connectify - Watch Together",
  description: "Synchronize video playback across multiple devices",
}

export default function Home() {
  return (
      <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-navy-900 dark:via-slate-800 dark:to-slate-900">
        {/* Elegant grid background */}
        <div className="fixed inset-0 elegant-grid opacity-40"></div>

        {/* Subtle floating elements */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-20 left-20 w-32 h-32 bg-blue-200/20 dark:bg-blue-400/10 rounded-full blur-xl animate-gentle-float"></div>
          <div className="absolute top-40 right-32 w-24 h-24 bg-indigo-200/20 dark:bg-indigo-400/10 rounded-full blur-xl animate-gentle-float delay-200"></div>
          <div className="absolute bottom-32 left-32 w-28 h-28 bg-slate-200/20 dark:bg-slate-400/10 rounded-full blur-xl animate-gentle-float delay-400"></div>
        </div>

        {/* Header */}
        <header className="sticky  z-50 w-full border-b border-white/20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
          <div className="container flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="relative">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-lg"></div>
                <div className="absolute inset-0 w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-lg animate-pulse opacity-75"></div>
              </div>
              <span className="text-2xl font-bold text-gradient group-hover:scale-105 transition-transform duration-300">
              Connectify
            </span>
            </Link>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <AuthCheck
                  fallback={
                    <div className="flex gap-3">
                      <Button asChild variant="ghost" size="sm" className="hover:bg-slate-100 dark:hover:bg-slate-800">
                        <Link href="/login">Login</Link>
                      </Button>
                      <Button
                          asChild
                          size="sm"
                          className="elegant-button bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg"
                      >
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

        <main className="flex-1 z-10">
          {/* Hero Section */}
          <section className="py-24 md:py-32 lg:py-20">
            <div className="container">
              <div className="flex flex-col items-center space-y-8 text-center">
                {/* Badge */}
                <div className="opacity-0 animate-fade-in-up">
                  <div className="inline-flex items-center rounded-full border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950 px-4 py-2 text-sm font-medium text-blue-700 dark:text-blue-300">
                    <Zap className="mr-2 h-4 w-4" />
                    Next-generation video synchronization
                  </div>
                </div>

                {/* Main heading */}
                <div className="space-y-6 opacity-0 animate-fade-in-up delay-100">
                  <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                    Watch videos together,
                    <br />
                    <span className="text-gradient">perfectly synchronized</span>
                  </h1>
                  <p className="mx-auto max-w-[700px] text-lg text-slate-600 dark:text-slate-300 md:text-xl leading-relaxed">
                    Experience seamless video synchronization across multiple devices. Perfect for remote movie nights,
                    educational sessions, and collaborative viewing experiences.
                  </p>
                </div>

                {/* CTA buttons */}
                <div className="flex flex-col sm:flex-row gap-4 opacity-0 animate-fade-in-up delay-200">
                  <Button
                      asChild
                      size="lg"
                      className="elegant-button bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-8 py-6 text-lg shadow-xl"
                  >
                    <Link href="/rooms" className="flex items-center space-x-2">
                      <Play className="w-5 h-5" />
                      <span>Start Watching</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                  <Button
                      asChild
                      variant="outline"
                      size="lg"
                      className="border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 px-8 py-6 text-lg bg-transparent"
                  >
                    <Link href="#features" className="flex items-center space-x-2">
                      <Video className="w-5 h-5" />
                      <span>Learn More</span>
                    </Link>
                  </Button>
                </div>

                {/* Trust indicators */}
                <div className="grid grid-cols-3 gap-8 mt-16 opacity-0 animate-fade-in-up delay-300">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">10,000+</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Active Users</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">99.9%</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Uptime</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">50ms</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Avg Latency</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section id="features" className="w-full py-20 md:py-25 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
            <div className="container px-4 md:px-6">
              <div className="text-center mb-16">
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl text-gradient mb-4 pb-4">
                  Elegant Features
                </h2>
                <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
                  Everything you need for the perfect synchronized viewing experience, designed with simplicity and
                  elegance in mind.
                </p>
              </div>

              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {[
                  {
                    icon: Video,
                    title: "Perfect Synchronization",
                    description:
                        "Millisecond-precise video synchronization across all devices with advanced buffering algorithms.",
                    delay: "delay-100",
                  },
                  {
                    icon: MessageCircle,
                    title: "Real-time Communication",
                    description:
                        "Integrated chat system with emoji reactions and typing indicators for seamless interaction.",
                    delay: "delay-200",
                  },
                  {
                    icon: Share2,
                    title: "Effortless Sharing",
                    description: "One-click room sharing with customizable privacy settings and access controls.",
                    delay: "delay-300",
                  },
                  {
                    icon: Users,
                    title: "Unlimited Participants",
                    description: "Host viewing sessions for any number of participants with intelligent load balancing.",
                    delay: "delay-400",
                  },
                  {
                    icon: Shield,
                    title: "Enterprise Security",
                    description: "End-to-end encryption and enterprise-grade security for all your viewing sessions.",
                    delay: "delay-500",
                  },
                  {
                    icon: Globe,
                    title: "Global Infrastructure",
                    description: "Worldwide CDN with edge servers ensuring optimal performance from anywhere.",
                    delay: "delay-600",
                  },
                ].map((feature, index) => (
                    <div key={index} className={`elegant-card rounded-xl p-8 opacity-0 animate-scale-in ${feature.delay}`}>
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white mb-6">
                        <feature.icon className="w-6 h-6" />
                      </div>
                      <h3 className="text-xl font-semibold mb-3 text-slate-900 dark:text-white">{feature.title}</h3>
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{feature.description}</p>
                    </div>
                ))}
              </div>
            </div>
          </section>

          {/* Benefits Section */}
          <section className="w-full py-24 md:py-32">
            <div className="container px-4 md:px-6">
              <div className="grid gap-16 lg:grid-cols-2 items-center">
                <div className="space-y-8 opacity-0 animate-fade-in-left">
                  <div>
                    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-gradient mb-4">
                      Why Choose Connectify?
                    </h2>
                    <p className="text-lg text-slate-600 dark:text-slate-300">
                      Built for modern teams and families who want to stay connected through shared experiences.
                    </p>
                  </div>

                  <div className="space-y-6">
                    {[
                      "Zero-latency synchronization technology",
                      "Cross-platform compatibility",
                      "Professional-grade reliability",
                      "Intuitive user experience",
                    ].map((benefit, index) => (
                        <div key={index} className="flex items-center space-x-3">
                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                          <span className="text-slate-700 dark:text-slate-300">{benefit}</span>
                        </div>
                    ))}
                  </div>

                  <Button
                      asChild
                      size="lg"
                      className="elegant-button bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-8 py-6 shadow-xl"
                  >
                    <Link href="/signup" className="flex items-center space-x-2">
                      <span>Get Started Today</span>
                      <ArrowRight className="w-5 h-5" />
                    </Link>
                  </Button>
                </div>

                <div className="opacity-0 animate-fade-in-right">
                  <div className="relative">
                    <div className="elegant-card rounded-2xl p-8 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full"></div>
                            <div>
                              <div className="font-semibold text-slate-900 dark:text-white">Movie Night</div>
                              <div className="text-sm text-slate-600 dark:text-slate-400">5 participants</div>
                            </div>
                          </div>
                          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        </div>

                        <div className="bg-slate-900 rounded-lg aspect-video flex items-center justify-center">
                          <Play className="w-12 h-12 text-white" />
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 bg-blue-500 rounded-full text-xs text-white flex items-center justify-center">
                              A
                            </div>
                            <div className="bg-slate-100 dark:bg-slate-800 rounded-lg px-3 py-2 text-sm">
                              This scene is amazing! 🎬
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 justify-end">
                            <div className="bg-blue-500 text-white rounded-lg px-3 py-2 text-sm">Totally agree!</div>
                            <div className="w-6 h-6 bg-green-500 rounded-full text-xs text-white flex items-center justify-center">
                              B
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="w-full py-24 md:py-32 bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
            <div className="container px-4 md:px-6">
              <div className="text-center space-y-8">
                <div className="space-y-4">
                  <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                    Ready to start watching together?
                  </h2>
                  <p className="text-xl text-blue-100 max-w-2xl mx-auto">
                    Join thousands of users who are already enjoying synchronized video experiences.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                      asChild
                      size="lg"
                      variant="secondary"
                      className="elegant-button bg-white text-blue-600 hover:bg-blue-50 px-8 py-6 text-lg shadow-xl"
                  >
                    <Link href="/signup" className="flex items-center space-x-2">
                      <span>Start Free Trial</span>
                      <ArrowRight className="w-5 h-5" />
                    </Link>
                  </Button>
                  <Button
                      asChild
                      size="lg"
                      variant="outline"
                      className="border-white/30 text-white hover:bg-white/10 px-8 py-6 text-lg bg-transparent"
                  >
                    <Link href="/rooms">Try Demo</Link>
                  </Button>
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200 dark:border-slate-800 py-12 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded"></div>
                <span className="text-sm text-slate-600 dark:text-slate-400">
                © {new Date().getFullYear()} Connectify. Crafted with precision.
              </span>
              </div>
              <div className="flex items-center gap-6">
                <Link
                    href="/terms"
                    className="text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Terms
                </Link>
                <Link
                    href="/privacy"
                    className="text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Privacy
                </Link>
                <Link
                    href="/contact"
                    className="text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Contact
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
  )
}
