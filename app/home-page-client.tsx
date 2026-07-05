'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Moon, Sun, ChevronRight, LineChart, CalendarDays, BookOpen, Fingerprint } from 'lucide-react'

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
              aria-label="Toggle theme"
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

      <main className="flex-1 flex flex-col">
        {/* Hero */}
        <section className="flex-1 flex flex-col justify-center pt-32 pb-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="animate-in fade-in duration-500">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-6">
              This platform was built for my personal use. If other users need to use it, a paid subscription is required.
            </div>
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
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 bg-secondary/10 border-t border-border/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4">Everything you need to scale</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Tradelytix provides professional-grade tools to journal, analyze, and optimize your trading strategy.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="flex flex-col p-6 rounded-2xl bg-background border border-border/50">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 text-primary">
                <LineChart className="w-5 h-5" />
              </div>
              <h3 className="font-bold mb-2">Deep Analytics</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Visualize equity curves, drawdowns, and precise metrics to uncover hidden edges in your trading performance.
              </p>
            </div>
            <div className="flex flex-col p-6 rounded-2xl bg-background border border-border/50">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 text-primary">
                <CalendarDays className="w-5 h-5" />
              </div>
              <h3 className="font-bold mb-2">Smart Calendar</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Review your daily PnL, win rates, and daily trade records with an interactive, rich calendar view.
              </p>
            </div>
            <div className="flex flex-col p-6 rounded-2xl bg-background border border-border/50">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 text-primary">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="font-bold mb-2">Detailed Journaling</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Log setups, strategies, and psychological states. Attach chart screenshots to learn from every setup.
              </p>
            </div>
            <div className="flex flex-col p-6 rounded-2xl bg-background border border-border/50">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 text-primary">
                <Fingerprint className="w-5 h-5" />
              </div>
              <h3 className="font-bold mb-2">Prop Firm Ready</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Built-in tracking for phase transitions, drawdown limits, and rules tailored for prop firm traders.
              </p>
            </div>
          </div>
        </div>
      </section>

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
      </main>

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
