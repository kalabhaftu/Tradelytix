'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  BarChart3, Shield, Zap, TrendingUp, BookOpen, Bell,
  ArrowRight, CheckCircle2, Moon, Sun, ChevronRight
} from 'lucide-react'

import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/auth-provider'
import { useTheme } from '@/context/theme-provider'

const FEATURES = [
  {
    icon: BarChart3,
    title: 'Track trades',
    description: 'Record entries, exits, screenshots, tags, notes, and outcomes in one place.',
  },
  {
    icon: BookOpen,
    title: 'Journal decisions',
    description: 'Write down mistakes, emotions, execution notes, and setup observations.',
  },
  {
    icon: Shield,
    title: 'Review risk',
    description: 'Follow account performance, prop firm rules, and drawdown context.',
  },
  {
    icon: TrendingUp,
    title: 'Analyze setups',
    description: 'Compare symbols, sessions, outcomes, trade duration, and strategy tags.',
  },
  {
    icon: Bell,
    title: 'Calendar and analytics',
    description: 'Use calendar views and reports to spot repeated patterns over time.',
  },
  {
    icon: Zap,
    title: 'Improve consistency',
    description: 'Keep a clear record so you can review what is working and what is not.',
  },
]

const PRICING_FEATURES = [
  'Unlimited trade tracking',
  'Advanced analytics dashboard',
  'Prop firm phase management',
  'AI-powered trade reviews',
  'Custom dashboard templates',
  'Shareable performance reports',
  'Risk & drawdown alerts',
  'Priority support',
]

export default function HomePage() {
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="min-h-screen bg-background selection:bg-primary/30">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo className="w-7 h-7" />
            <span className="font-bold tracking-tight">Deltalytix</span>
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
              <>
                <Button variant="ghost" size="sm" onClick={() => router.push('/login')}>
                  Sign In
                </Button>
                <Button size="sm" onClick={() => router.push('/login')}>
                  Get Started <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-6 border border-primary/20">
              <Zap className="h-3 w-3" />
              Trading journal and analytics
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-4">
              Deltalytix{' '}
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Pro
              </span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Track trades, review performance, analyze setups, journal mistakes and emotions, and improve your consistency.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button
                size="lg"
                className="h-12 px-6 text-sm font-medium"
                onClick={() => router.push(isAuthenticated ? '/dashboard' : '/login')}
              >
                {isAuthenticated ? 'Go to Dashboard' : 'Start now'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="h-12 px-6 text-sm"
                onClick={() => {
                  document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })
                }}
              >
                View Pricing
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6 border-t border-border/40">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
              Tools for structured trade review
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Keep your trading records organized across journaling, calendar review, analytics, and account tracking.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-xl border border-border/50 bg-card/30 p-5 hover:bg-card/60 transition-colors"
              >
                <feature.icon className="h-5 w-5 text-primary mb-3" />
                <h3 className="font-semibold text-sm mb-1">{feature.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-6 border-t border-border/40">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">Simple Pricing</h2>
            <p className="text-muted-foreground text-sm">One plan with crypto payment through NOWPayments.</p>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="rounded-2xl border-2 border-primary/30 bg-card/50 backdrop-blur-sm p-6 shadow-xl shadow-primary/5"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-lg">Pro</h3>
                <p className="text-xs text-muted-foreground">Full access to everything</p>
              </div>
              <div className="text-right">
                <div className="flex items-baseline gap-0.5">
                  <span className="text-3xl font-bold">$10</span>
                  <span className="text-muted-foreground text-sm">/mo</span>
                </div>
                <p className="text-[10px] text-muted-foreground">Pay with crypto</p>
              </div>
            </div>

            <div className="border-t border-border/40 pt-4 mb-6">
              <div className="grid grid-cols-1 gap-2">
                {PRICING_FEATURES.map((feature, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span className="text-muted-foreground text-xs">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <Button
              className="w-full h-11"
              onClick={() => router.push(isAuthenticated ? '/subscribe' : '/login?next=/subscribe')}
            >
              {isAuthenticated ? 'Subscribe Now' : 'Get Started'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Logo className="w-5 h-5" />
            <span className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} Deltalytix. All rights reserved.
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/docs" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Docs
            </Link>
            <Link href="/privacy" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
