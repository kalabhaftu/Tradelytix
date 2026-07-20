'use client'

import Link from 'next/link'
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  BrainCircuit,
  CalendarDays,
  Check,
  ChevronRight,
  ClipboardPenLine,
  FileText,
  LineChart,
  Moon,
  ShieldCheck,
  Smartphone,
  Sun,
  Target,
  Upload,
} from 'lucide-react'

import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/auth-provider'
import { useTheme } from '@/context/theme-provider'
import { BRAND } from '@/lib/constants/brand'

const features = [
  {
    icon: ClipboardPenLine,
    title: 'Journal the decision',
    description: 'Capture the setup, context, execution, and lesson while the trade is still fresh.',
  },
  {
    icon: BarChart3,
    title: 'See the pattern',
    description: 'Move beyond win rate with equity, drawdown, expectancy, and setup-level performance.',
  },
  {
    icon: Upload,
    title: 'Bring your history',
    description: 'Import supported broker exports and keep your existing trading record in one place.',
  },
  {
    icon: BrainCircuit,
    title: 'Review with AI',
    description: 'Ask focused questions about your journal and receive analysis grounded in your own data.',
  },
  {
    icon: Target,
    title: 'Track the rules',
    description: 'Keep prop-firm phases, drawdown limits, goals, and daily discipline visible.',
  },
  {
    icon: Smartphone,
    title: 'Stay close to the work',
    description: 'Use the web workspace or the Flutter app when you need to log and review away from your desk.',
  },
] as const

const workflow = [
  ['01', 'Capture', 'Log what happened, what you saw, and what you felt.'],
  ['02', 'Connect', 'Link trades to setups, tags, accounts, and sessions.'],
  ['03', 'Adjust', 'Use the review to make one practical change for the next session.'],
] as const

export default function HomePage() {
  const { isAuthenticated } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const primaryHref = isAuthenticated ? '/dashboard' : '/login'

  return (
    <div className="min-h-screen overflow-x-clip bg-background selection:bg-primary/30">
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex min-w-0 items-center gap-3" aria-label="JJI home">
            <Logo className="h-8 w-8 shrink-0" />
            <div className="min-w-0 leading-none">
              <span className="block text-sm font-black tracking-tight text-foreground">{BRAND.name}</span>
              <span className="hidden text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground sm:block">
                {BRAND.fullName}
              </span>
            </div>
          </Link>

          <div className="hidden items-center gap-5 text-sm text-muted-foreground md:flex">
            <Link href="#features" className="transition-colors hover:text-foreground">Features</Link>
            <Link href="#workflow" className="transition-colors hover:text-foreground">How it works</Link>
            <Link href="/docs" className="transition-colors hover:text-foreground">Docs</Link>
            <Link href="/contact" className="transition-colors hover:text-foreground">Contact</Link>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button asChild size="sm" className="rounded-xl px-4">
              <Link href={primaryHref}>{isAuthenticated ? 'Open app' : 'Get started'}</Link>
            </Button>
          </div>
        </div>
      </nav>

      <main>
        <section className="relative isolate overflow-hidden">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_8%,hsl(var(--primary)/0.16),transparent_32%),radial-gradient(circle_at_88%_18%,hsl(var(--success)/0.11),transparent_28%)]" />
          <div className="mx-auto grid w-full max-w-7xl gap-14 px-4 pb-20 pt-16 sm:px-6 sm:pb-28 sm:pt-24 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-16 lg:px-8">
            <div className="max-w-2xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                A clearer trading practice
              </div>
              <h1 className="max-w-xl text-5xl font-semibold leading-[0.98] tracking-[-0.055em] text-foreground sm:text-7xl">
                Journal the trade. Find the edge.
              </h1>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                {BRAND.fullName} gives you one calm workspace for execution, journaling, analytics, and review—so every session leaves you with a clearer next decision.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button asChild size="lg" className="h-12 rounded-xl px-6">
                  <Link href={primaryHref}>
                    {isAuthenticated ? 'Open your workspace' : 'Start journaling'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-12 rounded-xl px-6">
                  <Link href="/demo">Preview the workspace</Link>
                </Button>
              </div>
              <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-primary" /> Web workspace</span>
                <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-primary" /> Flutter mobile app</span>
                <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-primary" /> Your data, your review</span>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-2xl lg:mx-0">
              <div aria-hidden="true" className="absolute -inset-8 rounded-[3rem] bg-primary/10 blur-3xl" />
              <div className="relative overflow-hidden rounded-[1.75rem] border border-border/80 bg-card/80 p-3 shadow-2xl shadow-primary/5 backdrop-blur sm:p-4">
                <div className="rounded-2xl border border-border/70 bg-background/90 p-4 sm:p-5">
                  <div className="flex items-center justify-between border-b border-border/60 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/12 text-primary"><LineChart className="h-4 w-4" /></div>
                      <div><p className="text-sm font-semibold">Trading overview</p><p className="text-[11px] text-muted-foreground">This week · all accounts</p></div>
                    </div>
                    <span className="rounded-lg border border-border/70 px-2 py-1 text-[10px] text-muted-foreground">Live view</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 py-4 sm:grid-cols-4">
                    {[
                      ['Net P&L', '+$2,480', 'text-emerald-400'],
                      ['Win rate', '64.2%', 'text-foreground'],
                      ['Expectancy', '$148', 'text-foreground'],
                      ['Drawdown', '−2.8%', 'text-amber-400'],
                    ].map(([label, value, color]) => (
                      <div key={label} className="rounded-xl border border-border/60 bg-card/60 p-3">
                        <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
                        <p className={`mt-2 text-lg font-semibold tracking-tight ${color}`}>{value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-xl border border-border/60 bg-card/45 p-4">
                    <div className="mb-4 flex items-center justify-between"><p className="text-xs font-semibold">Equity curve</p><p className="text-[10px] text-muted-foreground">Last 20 sessions</p></div>
                    <div className="relative h-36 overflow-hidden rounded-lg bg-gradient-to-b from-primary/10 to-transparent">
                      <svg viewBox="0 0 640 170" className="h-full w-full" role="img" aria-label="Illustration of an upward equity curve" preserveAspectRatio="none">
                        <path d="M0 143 C44 136 58 151 92 128 S140 132 170 109 S218 116 248 91 S294 102 324 78 S370 93 400 59 S448 73 478 48 S529 61 556 27 S607 42 640 12" fill="none" stroke="hsl(var(--primary))" strokeWidth="4" strokeLinecap="round" />
                        <path d="M0 143 C44 136 58 151 92 128 S140 132 170 109 S218 116 248 91 S294 102 324 78 S370 93 400 59 S448 73 478 48 S529 61 556 27 S607 42 640 12 V170 H0 Z" fill="url(#jji-fill)" opacity="0.35" />
                        <defs><linearGradient id="jji-fill" x1="0" x2="0" y1="0" y2="1"><stop stopColor="hsl(var(--primary))" /><stop offset="1" stopColor="hsl(var(--primary))" stopOpacity="0" /></linearGradient></defs>
                      </svg>
                    </div>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-[1.1fr_0.9fr]">
                    <div className="rounded-xl border border-border/60 bg-card/45 p-4"><div className="flex items-center gap-2 text-xs font-semibold"><CalendarDays className="h-4 w-4 text-primary" /> Review rhythm</div><p className="mt-3 text-sm text-muted-foreground">3 sessions reviewed this week</p><div className="mt-3 h-1.5 rounded-full bg-muted"><div className="h-full w-3/4 rounded-full bg-primary" /></div></div>
                    <div className="rounded-xl border border-border/60 bg-card/45 p-4"><div className="flex items-center gap-2 text-xs font-semibold"><BookOpen className="h-4 w-4 text-primary" /> Journal streak</div><p className="mt-3 text-2xl font-semibold">12 days</p><p className="text-[11px] text-muted-foreground">Keep the process visible.</p></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="border-y border-border/60 bg-card/25">
          <div className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
            <div className="max-w-2xl"><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">The workspace</p><h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">Everything around the trade, in one place.</h2><p className="mt-4 text-muted-foreground">JJI keeps the operational work close to the reflection that makes it useful.</p></div>
            <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-border/70 bg-border/70 sm:grid-cols-2 lg:grid-cols-3">
              {features.map(({ icon: Icon, title, description }) => <div key={title} className="bg-background/90 p-6 sm:p-7"><Icon className="h-5 w-5 text-primary" /><h3 className="mt-6 text-base font-semibold">{title}</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p></div>)}
            </div>
          </div>
        </section>

        <section id="workflow" className="mx-auto grid w-full max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[0.75fr_1.25fr] lg:items-center lg:px-8 lg:py-28">
          <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">A repeatable process</p><h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">The goal is not more data. It is better decisions.</h2><p className="mt-5 max-w-lg leading-relaxed text-muted-foreground">Build a review habit that connects your execution to the outcomes. Keep the process simple enough to use after every session.</p><Button asChild variant="outline" className="mt-7 rounded-xl"><Link href="/docs/getting-started">Read the quick start <ArrowUpRight className="ml-2 h-4 w-4" /></Link></Button></div>
          <div className="grid gap-3">{workflow.map(([number, title, description]) => <div key={number} className="flex gap-5 rounded-2xl border border-border/70 bg-card/55 p-5 sm:p-6"><span className="text-xs font-bold tracking-[0.16em] text-primary">{number}</span><div><h3 className="font-semibold">{title}</h3><p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p></div><ChevronRight className="ml-auto mt-1 hidden h-4 w-4 text-muted-foreground sm:block" /></div>)}</div>
        </section>

        <section className="border-y border-border/60 bg-primary/[0.045]">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-16 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
            <div className="max-w-2xl"><div className="flex items-center gap-2 text-sm font-semibold"><ShieldCheck className="h-4 w-4 text-primary" /> Built around your trading record</div><p className="mt-3 text-sm leading-relaxed text-muted-foreground">Learn how JJI handles data, storage, and account controls in the <Link href="/privacy" className="text-foreground underline underline-offset-4">Privacy Policy</Link>. Read the <Link href="/terms" className="text-foreground underline underline-offset-4">Terms of Service</Link> before using the platform.</p></div>
            <div className="flex shrink-0 flex-wrap gap-3"><Button asChild className="rounded-xl"><Link href="/contact">Contact JJI <ArrowRight className="ml-2 h-4 w-4" /></Link></Button><Button asChild variant="outline" className="rounded-xl"><Link href="/docs">Browse docs</Link></Button></div>
          </div>
        </section>

        <section className="mx-auto flex w-full max-w-7xl flex-col items-center px-4 py-20 text-center sm:px-6 lg:px-8 lg:py-28">
          <FileText className="h-6 w-6 text-primary" /><h2 className="mt-5 text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">Make the next session easier to review.</h2><p className="mt-4 max-w-xl text-muted-foreground">Start with the web workspace, then keep your journal close with the JJI mobile app.</p><Button asChild size="lg" className="mt-8 h-12 rounded-xl px-7"><Link href={primaryHref}>{isAuthenticated ? 'Open JJI' : 'Create your workspace'} <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
        </section>
      </main>
    </div>
  )
}
