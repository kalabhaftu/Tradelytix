'use client'

import { ReactNode, useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Home, Search, List, ChevronRight, BookOpenText, Rocket, Code, FileText, Terminal, Database as DatabaseIcon, Zap, Heart, MessageSquare, LogIn } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import Fuse from 'fuse.js'


const navigation = [
  {
    title: 'Getting Started',
    icon: Rocket,
    items: [
      { title: 'Introduction', href: '/docs' },
      { title: 'Quick Start', href: '/docs/getting-started' },
      { title: 'Application Flow', href: '/docs/features/app-flow' },
    ],
  },
  {
    title: 'Features',
    icon: BookOpenText,
    items: [
      { title: 'Trade Import', href: '/docs/features/importing' },
      { title: 'Dashboard', href: '/docs/features/dashboard' },
      { title: 'Prop Firm Tracking', href: '/docs/features/prop-firm' },
      { title: 'Journal & Notes', href: '/docs/features/journal' },
      { title: 'Trade Table', href: '/docs/features/trade-table' },
      { title: 'Accounts', href: '/docs/features/accounts' },
      { title: 'Playbook & Models', href: '/docs/features/playbook' },
      { title: 'Backtesting', href: '/docs/features/backtesting' },
      { title: 'Widget Customization', href: '/docs/features/widgets' },
      { title: 'Data Management', href: '/docs/features/data-management' },
      { title: 'Settings', href: '/docs/features/settings' },
      { title: 'Keyboard Shortcuts', href: '/docs/features/shortcuts' },
    ],
  },
  {
    title: 'Resources',
    icon: FileText,
    items: [
      { title: 'FAQ & Troubleshooting', href: '/docs/faq' },
      { title: 'Feedback Guide', href: '/docs/feedback' },
      { title: 'Support the Project', href: '/docs/donate' },
    ],
  },
  {
    title: 'For Developers',
    icon: Code,
    items: [
      { title: 'Tech Stack', href: '/docs/for-developers/tech-stack' },
      { title: 'Frontend Guidelines', href: '/docs/for-developers/frontend' },
      { title: 'Backend Structure', href: '/docs/for-developers/backend' },
      { title: 'Architecture', href: '/docs/for-developers/architecture' },
      { title: 'Database Schema', href: '/docs/for-developers/database' },
      { title: 'Prisma Optimization', href: '/docs/for-developers/prisma-optimization' },
      { title: 'Performance Baseline', href: '/docs/for-developers/performance-baseline' },
      { title: 'TradeZella Comparison', href: '/docs/for-developers/tradezella-comparison' },
      { title: 'Architecture Divergences', href: '/docs/for-developers/architecture-divergences' },
    ],
  },
]

// Build flat list for search
const allDocPages = navigation.flatMap(section =>
  section.items.map(item => ({ ...item, section: section.title }))
)

const fuse = new Fuse(allDocPages, {
  keys: ['title', 'section'],
  threshold: 0.6,
  ignoreLocation: true,
  findAllMatches: true,
  useExtendedSearch: true,
})


function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname()

  return (
    <div className={cn("space-y-8", className)}>
      {navigation.map((section) => (
        <div key={section.title}>
          <h4 className="mb-2 px-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50 flex items-center gap-2">
            <section.icon className="h-3 w-3" />
            {section.title}
          </h4>
          <div className="space-y-0.5">
            {section.items.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group flex items-center rounded-lg px-2 py-1.5 text-xs transition-colors",
                    isActive
                      ? "bg-primary/5 text-primary font-semibold"
                      : "hover:bg-accent/50 text-muted-foreground hover:text-foreground"
                  )}
                >
                  {item.title}
                  {isActive && <div className="ml-auto w-1 h-1 rounded-full bg-primary" />}
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function DocsLayout({ children }: { children: ReactNode }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  // Check auth status via cookie presence (client-side heuristic)
  useEffect(() => {
    const hasSbCookie = document.cookie.split(';').some(c => c.trim().startsWith('sb-'))
    setIsLoggedIn(hasSbCookie)
  }, [])

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return []
    return fuse.search(searchQuery).map(r => r.item)
  }, [searchQuery])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
        <div className="flex h-12 items-center gap-4 px-4 justify-between">
          <div className="flex items-center gap-2">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <List className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 pr-0">
                <div className="pr-6 pt-4">
                  <Link href="/" className="flex items-center gap-2 mb-6">
                    <Logo className="w-7 h-7 fill-foreground" />
                    <span className="font-semibold text-lg">Deltalytix</span>
                  </Link>
                  <Sidebar />
                </div>
              </SheetContent>
            </Sheet>

            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Logo className="w-6 h-6" />
              <span className="text-sm font-bold tracking-tight hidden sm:inline">Deltalytix</span>
              <Badge variant="outline" className="ml-2 h-5 px-1.5 text-[10px] hidden sm:inline-flex uppercase tracking-wider">Docs</Badge>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative hidden sm:block w-48 lg:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search docs..."
                className="pl-9 h-8 text-xs bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-primary/20"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchResults.length > 0 && searchQuery && (
                <div className="absolute top-full mt-1 left-0 right-0 bg-popover border rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                  {searchResults.map((result) => (
                    <Link
                      key={result.href}
                      href={result.href}
                      className="flex items-center justify-between px-3 py-2 text-xs hover:bg-accent transition-colors"
                      onClick={() => setSearchQuery('')}
                    >
                      <span className="font-medium">{result.title}</span>
                      <span className="text-[10px] text-muted-foreground">{result.section}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Button asChild variant="ghost" size="sm" className="h-8 text-xs">
              <Link href="/donate">
                <Heart className="h-3.5 w-3.5 mr-1" />
                <span className="hidden lg:inline">Donate</span>
              </Link>
            </Button>

            {isLoggedIn ? (
              <Button asChild variant="ghost" size="sm" className="h-8 text-xs">
                <Link href="/dashboard">
                  <Home className="h-3.5 w-3.5 mr-1" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>
              </Button>
            ) : (
              <Button asChild size="sm" className="h-8 text-xs">
                <Link href="/">
                  <LogIn className="h-3.5 w-3.5 mr-1" />
                  <span className="hidden sm:inline">Sign In</span>
                </Link>
              </Button>
            )}
          </div>

        </div>
      </header>

      <div className="mx-auto w-full max-w-[1440px]">
        <div className="flex-1 md:grid md:grid-cols-[240px_minmax(0,1fr)] lg:grid-cols-[260px_minmax(0,1fr)]">
          {/* Desktop Sidebar */}
          <aside className="fixed top-12 z-30 hidden h-[calc(100vh-3rem)] w-[240px] lg:w-[260px] shrink-0 overflow-y-auto md:sticky md:block border-r px-4 py-4 scrollbar-none">
            <Sidebar />
          </aside>

          {/* Main Content */}
          <main className="relative px-6 py-8 md:px-8 lg:px-12">
            <div className="mx-auto w-full min-w-0 max-w-4xl">
              <div className="prose prose-invert max-w-none
                prose-headings:scroll-mt-20
                prose-headings:font-bold
                prose-h1:text-4xl
                prose-h1:border-b
                prose-h1:pb-4
                prose-h1:mb-8
                prose-h2:text-3xl
                prose-h2:mt-12
                prose-h2:mb-6
                prose-h2:border-b
                prose-h2:pb-3
                prose-h3:text-2xl
                prose-h3:mt-10
                prose-h3:mb-4
                prose-h4:text-xl
                prose-h4:mt-8
                prose-h4:mb-3
                prose-p:text-muted-foreground
                prose-p:leading-7
                prose-p:my-4
                prose-li:text-muted-foreground
                prose-li:leading-7
                prose-li:my-2
                prose-ul:my-6
                prose-ol:my-6
                prose-code:bg-accent/50
                prose-code:border
                prose-code:px-2
                prose-code:py-1
                prose-code:rounded-md
                prose-code:text-sm
                prose-code:font-mono
                prose-code:text-foreground
                prose-code:before:content-['']
                prose-code:after:content-['']
                prose-pre:bg-accent/30
                prose-pre:border-2
                prose-pre:border-border
                prose-pre:rounded-lg
                prose-pre:p-4
                prose-pre:my-6
                prose-pre:overflow-x-auto
                prose-a:text-primary
                prose-a:no-underline
                prose-a:font-medium
                hover:prose-a:underline
                prose-strong:text-foreground
                prose-strong:font-semibold
                prose-img:rounded-lg
                prose-img:border
                prose-img:my-8
                prose-table:border
                prose-table:my-8
                prose-th:bg-accent
                prose-th:font-semibold
                prose-th:p-3
                prose-td:p-3
                prose-blockquote:border-l-4
                prose-blockquote:border-primary
                prose-blockquote:pl-4
                prose-blockquote:italic
                prose-blockquote:text-muted-foreground
                prose-hr:my-12
                prose-hr:border-border"
              >
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
