'use client'

import { ReactNode, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Fuse from 'fuse.js'
import {
  BookOpenText,
  ChevronRight,
  Code,
  FileText,
  List,
  Rocket,
  Search,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

type DocsNavItem = {
  title: string
  href: string
  subsections?: Array<{
    title: string
    href: string
  }>
}

type DocsNavSection = {
  title: string
  icon: typeof Rocket
  items: DocsNavItem[]
}

const docsNavigation: DocsNavSection[] = [
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
      {
        title: 'FAQ & Troubleshooting',
        href: '/docs/faq',
        subsections: [
          { title: 'Is Tradelytix free?', href: '/docs/faq#is-tradelytix-free' },
          { title: 'What can I import?', href: '/docs/faq#what-can-i-import' },
          { title: 'Where is my data stored?', href: '/docs/faq#where-is-my-data-stored' },
          { title: 'Why does the dashboard look empty?', href: '/docs/faq#why-does-the-dashboard-look-empty' },
        ],
      },
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
      { title: 'Data Model Principles', href: '/docs/for-developers/database' },
      { title: 'Prisma Optimization', href: '/docs/for-developers/prisma-optimization' },
      { title: 'Performance Baseline', href: '/docs/for-developers/performance-baseline' },
      { title: 'TradeZella Comparison', href: '/docs/for-developers/tradezella-comparison' },
      { title: 'Architecture Divergences', href: '/docs/for-developers/architecture-divergences' },
    ],
  },
]

const searchablePages = docsNavigation.flatMap((section) =>
  section.items.flatMap((item) => {
    const pages = [
      {
        title: item.title,
        href: item.href,
        section: section.title,
        parentTitle: null as string | null,
      },
    ]

    if (!item.subsections) {
      return pages
    }

    return pages.concat(
      item.subsections.map((subsection) => ({
        title: subsection.title,
        href: subsection.href,
        section: section.title,
        parentTitle: item.title,
      }))
    )
  })
)

const docsSearch = new Fuse(searchablePages, {
  keys: ['title', 'section', 'parentTitle'],
  threshold: 0.34,
  ignoreLocation: true,
})

function normalizeHref(href: string) {
  return href.split('#')[0]
}

function DocsNav({
  pathname,
  onNavigate,
}: {
  pathname: string
  onNavigate?: () => void
}) {
  return (
    <nav className="space-y-6">
      {docsNavigation.map((section) => (
        <section key={section.title} className="space-y-2">
          <div className="flex items-center gap-2 px-1 text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground/70">
            <section.icon className="h-3.5 w-3.5" />
            <span>{section.title}</span>
          </div>

          <div className="space-y-1">
            {section.items.map((item) => {
              const itemPath = normalizeHref(item.href)
              const itemActive = pathname === itemPath

              return (
                <div key={item.href} className="space-y-1">
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      'group flex items-center gap-2 rounded-2xl px-3 py-2.5 text-sm transition-colors',
                      itemActive
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
                    )}
                  >
                    <span className="truncate">{item.title}</span>
                    <ChevronRight
                      className={cn(
                        'ml-auto h-3.5 w-3.5 transition-transform',
                        itemActive ? 'text-primary-foreground/80' : 'translate-x-0.5 text-muted-foreground/60'
                      )}
                    />
                  </Link>

                  {item.subsections && pathname === itemPath && (
                    <div className="ml-3 space-y-1 border-l border-border/70 pl-4">
                      {item.subsections.map((subsection) => (
                        <Link
                          key={subsection.href}
                          href={subsection.href}
                          onClick={onNavigate}
                          className="block rounded-lg px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
                        >
                          {subsection.title}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      ))}
    </nav>
  )
}

function DocsSearchPanel({
  searchQuery,
  setSearchQuery,
  searchResults,
}: {
  searchQuery: string
  setSearchQuery: (value: string) => void
  searchResults: Array<{ title: string; href: string; section: string; parentTitle: string | null }>
}) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={searchQuery}
        onChange={(event) => setSearchQuery(event.target.value)}
        placeholder="Search docs..."
        className="h-10 rounded-2xl border-border/70 bg-background pl-9 text-sm shadow-none"
      />

      {searchResults.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border bg-popover shadow-2xl">
          <div className="max-h-[22rem] overflow-y-auto p-2">
            {searchResults.map((result) => (
              <Link
                key={result.href}
                href={result.href}
                className="flex items-start justify-between gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-accent/60"
                onClick={() => setSearchQuery('')}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {result.parentTitle ? `${result.parentTitle} / ` : ''}
                    {result.title}
                  </p>
                  <p className="truncate text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    {result.section}
                  </p>
                </div>
                <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function DocsLayoutClient({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) {
      return []
    }

    return docsSearch.search(searchQuery.trim()).slice(0, 8).map((result) => result.item)
  }, [searchQuery])

  useEffect(() => {
    setMobileMenuOpen(false)
    setSearchQuery('')
  }, [pathname])

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:py-8">
      <div className="grid min-h-[calc(100vh-5.5rem)] grid-cols-1 items-start gap-6 md:grid-cols-[19rem_minmax(0,1fr)] xl:grid-cols-[20rem_minmax(0,1fr)]">
        <aside className="hidden md:block">
          <div className="sticky top-[4.75rem] h-[calc(100dvh-5.5rem)]">
            <div className="flex h-full flex-col rounded-[1.75rem] border border-border/70 bg-card/60 shadow-[0_18px_60px_-34px_rgba(0,0,0,0.42)] backdrop-blur-sm">
              <div className="border-b border-border/70 px-4 py-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.22em] text-muted-foreground">
                      Documentation
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Product guides, feature references, and safe developer notes.
                    </p>
                  </div>
                  <Badge variant="outline" className="hidden rounded-full px-2.5 text-[10px] font-bold uppercase tracking-[0.18em] lg:inline-flex">
                    Public
                  </Badge>
                </div>
                <DocsSearchPanel
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  searchResults={searchResults}
                />
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
                <DocsNav pathname={pathname} />
              </div>
            </div>
          </div>
        </aside>

        <main className="min-w-0">
          <div className="mb-4 flex items-center justify-between gap-3 md:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="rounded-2xl">
                  <List className="mr-2 h-4 w-4" />
                  Browse Docs
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[22rem] border-r bg-background p-0">
                <div className="flex h-full flex-col">
                  <div className="border-b border-border/70 px-4 py-4">
                    <p className="text-[11px] font-black uppercase tracking-[0.22em] text-muted-foreground">
                      Documentation
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Search, browse, and jump between the current product guides.
                    </p>
                    <div className="mt-3">
                      <DocsSearchPanel
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        searchResults={searchResults}
                      />
                    </div>
                  </div>
                  <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
                    <DocsNav pathname={pathname} onNavigate={() => setMobileMenuOpen(false)} />
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <Badge variant="outline" className="rounded-full px-2.5 text-[10px] font-bold uppercase tracking-[0.18em]">
              Knowledge Base
            </Badge>
          </div>

          <div className="rounded-[2rem] border border-border/70 bg-card/40 px-5 py-8 shadow-[0_24px_80px_-42px_rgba(0,0,0,0.45)] backdrop-blur-sm sm:px-7 lg:px-10 lg:py-10">
            <div
              className="prose prose-invert max-w-none
                prose-headings:scroll-mt-24
                prose-headings:font-bold
                prose-h1:mb-8 prose-h1:border-b prose-h1:pb-4 prose-h1:text-4xl
                prose-h2:mb-6 prose-h2:mt-12 prose-h2:border-b prose-h2:pb-3 prose-h2:text-3xl
                prose-h3:mb-4 prose-h3:mt-10 prose-h3:text-2xl
                prose-h4:mb-3 prose-h4:mt-8 prose-h4:text-xl
                prose-p:my-4 prose-p:leading-7 prose-p:text-muted-foreground
                prose-li:my-2 prose-li:leading-7 prose-li:text-muted-foreground
                prose-ul:my-6 prose-ol:my-6
                prose-code:rounded-md prose-code:border prose-code:bg-accent/50 prose-code:px-2 prose-code:py-1 prose-code:text-sm prose-code:text-foreground prose-code:before:content-[''] prose-code:after:content-['']
                prose-pre:my-6 prose-pre:overflow-x-auto prose-pre:rounded-xl prose-pre:border prose-pre:border-border prose-pre:bg-accent/30 prose-pre:p-4
                prose-a:font-medium prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                prose-strong:text-foreground prose-strong:font-semibold
                prose-img:my-8 prose-img:rounded-xl prose-img:border
                prose-table:my-8 prose-table:border
                prose-th:bg-accent prose-th:p-3 prose-th:font-semibold
                prose-td:p-3
                prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-muted-foreground
                prose-hr:my-12 prose-hr:border-border"
            >
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
