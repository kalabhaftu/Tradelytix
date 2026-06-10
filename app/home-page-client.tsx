'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Moon, Sun, ChevronRight } from 'lucide-react'

import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/auth-provider'
import { useTheme } from '@/context/theme-provider'

export default function HomePage() {
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="min-h-screen bg-background selection:bg-primary/30 flex flex-col">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo className="w-7 h-7" />
            <span className="font-bold tracking-tight">Tradelytix</span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => toggleTheme()}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            {isAuthenticated ? (
              <Button size="sm" onClick={() => router.push('/dashboard')}>
                Dashboard <ChevronRight className="ml-1 h-3 w-3" />
              </Button>
            ) : (
              <Button size="sm" onClick={() => router.push('/login')}>
                Sign In
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col justify-center pt-32 pb-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-5xl sm:text-7xl font-bold tracking-tighter leading-[1.1] mb-6">
              Master Your Edge.
            </h1>
            <p className="text-xl text-muted-foreground font-medium mb-10">
              The professional analytics platform for data-driven traders.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                className="h-12 px-8 text-sm w-full sm:w-auto"
                onClick={() => router.push(isAuthenticated ? '/dashboard' : '/login')}
              >
                {isAuthenticated ? 'Go to Dashboard' : 'Start now'}
              </Button>
              <Button
                variant="secondary"
                size="lg"
                className="h-12 px-8 text-sm w-full sm:w-auto"
                onClick={() => router.push('/demo')}
              >
                Try Demo
              </Button>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Pricing */}
      <section className="py-24 px-6 border-t border-border/20">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between p-8 sm:p-12 rounded-3xl bg-secondary/20 border border-border/30">
            <div className="mb-8 md:mb-0 text-center md:text-left">
              <h2 className="text-3xl font-bold tracking-tight mb-2">Tradelytix</h2>
              <p className="text-muted-foreground">Unlimited access to all features and analytics.</p>
            </div>
            <div className="flex flex-col items-center md:items-end gap-4">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black">$10</span>
                <span className="text-muted-foreground font-medium">/month</span>
              </div>
              <Button
                className="w-full sm:w-auto h-12 px-8"
                onClick={() => router.push(isAuthenticated ? '/subscribe' : '/login?next=/subscribe')}
              >
                Get Access
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/20 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Logo className="w-5 h-5" />
            <span className="text-xs text-muted-foreground font-medium">
              &copy; {new Date().getFullYear()} Tradelytix.
            </span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/docs" className="text-xs text-muted-foreground hover:text-foreground transition-colors font-medium">
              Docs
            </Link>
            <Link href="/privacy" className="text-xs text-muted-foreground hover:text-foreground transition-colors font-medium">
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
