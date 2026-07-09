'use client'

import { useRouter } from 'next/navigation'
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
    <div className="bg-background selection:bg-primary/30 flex flex-col h-full w-full">
      {/* Nav */}
      <nav className="border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo className="w-7 h-7" />
            <span className="font-bold tracking-tight">JJI</span>
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

      <main className="flex-1 flex flex-col pt-24 px-6 max-w-4xl mx-auto w-full mb-24">
        {/* Simple Text Hero */}
        <section className="flex flex-col gap-8 py-16">
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-foreground">
            Trading analytics.
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
            A journal and analytics platform for traders. Track performance, analyze setups, and review your metrics.
          </p>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Button
              size="lg"
              className="h-11 px-8"
              onClick={() => router.push('/demo')}
            >
              Try Demo
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-11 px-8"
              onClick={() => router.push('/docs')}
            >
              Explore Docs
            </Button>
          </div>
        </section>

        {/* Minimal Features List */}
        <section className="py-12 border-t border-border/40">
          <h2 className="text-xl font-semibold tracking-tight mb-8">Platform Features</h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm text-muted-foreground">
            <li className="flex flex-col gap-2">
              <span className="font-medium text-foreground">Analytics</span>
              <span>View equity curves, drawdowns, and metrics about your trading performance.</span>
            </li>
            <li className="flex flex-col gap-2">
              <span className="font-medium text-foreground">Trading Calendar</span>
              <span>Review daily PnL, win rates, and daily trade records in a calendar view.</span>
            </li>
            <li className="flex flex-col gap-2">
              <span className="font-medium text-foreground">Journal</span>
              <span>Log setups, strategies, and notes. Attach chart screenshots to review your trades.</span>
            </li>
            <li className="flex flex-col gap-2">
              <span className="font-medium text-foreground">Prop Firm Tracking</span>
              <span>Track phases, drawdown limits, and rules for prop firm evaluations.</span>
            </li>
          </ul>
        </section>
      </main>
    </div>
  )
}
