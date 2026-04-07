'use client'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { ChevronRight, ArrowRight, BarChart3, Building, BookOpen, Zap, Shield, TrendingUp, Database, Lock, FileCode, Filter, GitBranch, Rocket, CheckCircle2, Sparkles, Code, Globe, Upload, Activity, History, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function DocsHome() {
  return (
    <div className="space-y-12 pb-20">
      {/* Hero Section */}
      <section className="relative pt-4 pb-8">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider animate-pulse">
            <Sparkles className="h-3 w-3" />
            Platform Update v2.0
          </div>

          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
            The Professional <br />
            <span className="text-primary">Trading Edge.</span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed font-medium">
            Deltalytix is a high-performance analytics engine built for disciplined traders. 
            Bridge the gap between raw data and actionable intelligence with institutional-grade 
            metrics and behavioral analysis.
          </p>

          <div className="flex flex-wrap gap-4 pt-6">
            <Button asChild size="lg" className="h-12 px-8 font-bold bg-white text-black hover:bg-neutral-200 dark:bg-white dark:text-black shadow-lg transition-all">
              <Link href="/docs/getting-started">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 px-8 font-bold border-2 hover:bg-accent/50 transition-all">
              <Link href="/docs/features/importing">
                Explore Features
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* v2.0 Release Highlights */}
      <section className="relative overflow-hidden rounded-3xl border-2 border-primary/20 bg-primary/5 p-8 md:p-12">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Rocket className="h-32 w-32 text-primary" />
        </div>
        
        <div className="relative space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-black uppercase tracking-tighter italic">v2.0 Release Notes</h2>
            <div className="h-1 w-20 bg-primary rounded-full" />
          </div>
          
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-1 p-1.5 rounded-lg bg-primary/20">
                  <Activity className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground italic uppercase text-sm">Lexical Engine Integration</h3>
                  <p className="text-sm text-muted-foreground leading-snug mt-1">
                    New rich-text journaling engine with support for screenshots, emotional tagging, and deep market context.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1 p-1.5 rounded-lg bg-primary/20">
                  <Layers className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground italic uppercase text-sm">Dynamic Widget Architecture</h3>
                  <p className="text-sm text-muted-foreground leading-snug mt-1">
                    Re-engineered dashboard grid with 20+ performance-optimized widgets and persistent custom layouts.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-1 p-1.5 rounded-lg bg-primary/20">
                  <History className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground italic uppercase text-sm">Prop Firm Protocol v2</h3>
                  <p className="text-sm text-muted-foreground leading-snug mt-1">
                    Enhanced breach detection, automated profit target tracking, and multi-phase evaluation history.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1 p-1.5 rounded-lg bg-primary/20">
                  <Zap className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground italic uppercase text-sm">Sub-Second Execution</h3>
                  <p className="text-sm text-muted-foreground leading-snug mt-1">
                    Infrastructure migration to Next.js 15 for faster data hydration and real-time P&L updates.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Vision */}
      <section className="space-y-10 py-8">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-black uppercase tracking-tighter">The Vision</h2>
          <p className="text-muted-foreground font-medium max-w-2xl mx-auto uppercase text-xs tracking-[0.2em]">
            Institutional analysis for the retail environment.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {[
            { icon: Globe, title: 'Multi-Asset Sync', desc: 'Native support for Forex, Indices, and Crypto through automated CSV processing.' },
            { icon: Building, title: 'Evaluation Guard', desc: 'Stay compliant with prop firm rules through real-time drawdown monitoring.' },
            { icon: Sparkles, title: 'Behavioral Alpha', desc: 'Identify your edge by correlating emotional states with P&L performance.' }
          ].map((item, i) => (
            <div key={i} className="group p-8 rounded-2xl border-2 border-border/50 bg-card hover:border-primary/40 transition-all duration-300">
              <item.icon className="h-8 w-8 text-primary mb-4" />
              <h3 className="font-black uppercase tracking-tight mb-2 italic">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Feature Navigation */}
      <section className="space-y-8 pt-8 border-t border-border/50">
        <div className="flex items-end justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-black uppercase tracking-tighter">Core Systems</h2>
            <p className="text-xs font-bold text-muted-foreground/50 uppercase tracking-widest">Documentation Explorer</p>
          </div>
          <Link href="/docs/features/importing" className="text-[10px] font-black uppercase tracking-widest text-primary hover:opacity-80 flex items-center gap-1 group">
            View all modules <ChevronRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Link href="/docs/features/importing" className="group">
            <Card className="h-full border-2 border-border/50 hover:border-primary/50 transition-all duration-300 overflow-hidden bg-card/50">
              <CardHeader className="p-6">
                <div className="p-3 bg-primary/10 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg font-black uppercase italic group-hover:text-primary transition-colors">Trade Ingest</CardTitle>
                <CardDescription className="text-xs font-medium uppercase tracking-tight mt-1">AI-Powered Data Normalization</CardDescription>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <ul className="space-y-3">
                  {['Auto-column detection', '10k+ Trade processing', 'Manual verification'].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-xs font-bold text-muted-foreground/80">
                      <div className="h-1 w-1 rounded-full bg-primary" />
                      {item.toUpperCase()}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </Link>

          <Link href="/docs/features/dashboard" className="group">
            <Card className="h-full border-2 border-border/50 hover:border-primary/50 transition-all duration-300 overflow-hidden bg-card/50">
              <CardHeader className="p-6">
                <div className="p-3 bg-primary/10 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg font-black uppercase italic group-hover:text-primary transition-colors">Performance Grid</CardTitle>
                <CardDescription className="text-xs font-medium uppercase tracking-tight mt-1">Real-Time Metric Hydration</CardDescription>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <ul className="space-y-3">
                  {['20+ Analytical widgets', 'Custom layout persistence', 'Dynamic filtering'].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-xs font-bold text-muted-foreground/80">
                      <div className="h-1 w-1 rounded-full bg-primary" />
                      {item.toUpperCase()}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </Link>

          <Link href="/docs/features/prop-firm" className="group">
            <Card className="h-full border-2 border-border/50 hover:border-primary/50 transition-all duration-300 overflow-hidden bg-card/50">
              <CardHeader className="p-6">
                <div className="p-3 bg-primary/10 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform">
                  <Building className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg font-black uppercase italic group-hover:text-primary transition-colors">Capital Guard</CardTitle>
                <CardDescription className="text-xs font-medium uppercase tracking-tight mt-1">Compliance & Risk Logic</CardDescription>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <ul className="space-y-3">
                  {['Drawdown breach detection', 'Phase progression logic', 'Consitency tracking'].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-xs font-bold text-muted-foreground/80">
                      <div className="h-1 w-1 rounded-full bg-primary" />
                      {item.toUpperCase()}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </Link>
        </div>
      </section>

      {/* Tech Reference Links */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 pt-12">
        {[
          { href: '/docs/getting-started', icon: Rocket, title: 'Deployment Guide' },
          { href: '/docs/for-developers/architecture', icon: GitBranch, title: 'Logic Architecture' },
          { href: '/docs/for-developers/database', icon: Database, title: 'Schema Reference' }
        ].map((link, i) => (
          <Link key={i} href={link.href} className="group flex items-center justify-between p-4 rounded-xl border-2 border-border/50 bg-card hover:border-primary/50 transition-all">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <link.icon className="h-4 w-4 text-primary" />
              </div>
              <span className="text-xs font-black uppercase tracking-tight group-hover:text-primary transition-colors italic">{link.title}</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </Link>
        ))}
      </section>
    </div>
  )
}
