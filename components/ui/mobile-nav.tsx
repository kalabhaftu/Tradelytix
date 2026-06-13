'use client'

import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  CalendarDays,
  LineChart,
  ListTodo,
  Briefcase
} from "lucide-react"
import { usePathname, useRouter } from 'next/navigation'
import { useData } from '@/context/data-provider'

interface MobileNavItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string; weight?: any }>
  href: string
}

const mobileNavItems: MobileNavItem[] = [
  {
    id: 'widgets',
    label: 'Overview',
    icon: LayoutDashboard,
    href: '/dashboard'
  },
  {
    id: 'journal',
    label: 'Journal',
    icon: CalendarDays,
    href: '/dashboard/journal'
  },
  {
    id: 'reports',
    label: 'Analytics',
    icon: LineChart,
    href: '/dashboard/reports'
  },
  {
    id: 'table',
    label: 'Log',
    icon: ListTodo,
    href: '/dashboard/table'
  },
  {
    id: 'accounts',
    label: 'Portfolios',
    icon: Briefcase,
    href: '/dashboard/accounts'
  }
]

export function MobileBottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const data = useData()
  const isDemoMode = data?.isDemoMode

  const getDemoAdjustedHref = (href: string) => {
    if (isDemoMode) {
      return href.replace('/dashboard', '/demo')
    }
    return href
  }

  const getActiveTab = () => {
    const p = pathname || ''
    const base = isDemoMode ? '/demo' : '/dashboard'
    if (p === base) return 'widgets'
    if (p.startsWith(`${base}/reports`)) return 'reports'
    if (p.startsWith(`${base}/table`)) return 'table'
    if (p.startsWith(`${base}/journal`)) return 'journal'
    if (p.startsWith(`${base}/playbook`)) return 'playbook'
    if (p.startsWith(`${base}/accounts`)) return 'accounts'
    return null
  }

  const activeTab = getActiveTab()

  return (
    <nav className="mobile-bottom-nav fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-background border-t border-border/30 safe-area-inset-bottom">
      <div className="flex items-center justify-evenly h-14 max-w-md mx-auto">
        {mobileNavItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id

          return (
            <button
              key={item.id}
              onClick={() => router.push(getDemoAdjustedHref(item.href))}
              className={cn(
                "flex flex-col items-center justify-center min-w-[56px] h-full py-1 transition-all duration-200 touch-manipulation",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground active:text-foreground"
              )}
            >
              <div className={cn(
                "flex items-center justify-center w-10 h-7 rounded-full transition-all duration-200",
                isActive && "bg-primary/15"
              )}>
                <Icon className="h-[18px] w-[18px] shrink-0" />
              </div>
              <span className={cn(
                "text-[9px] font-semibold tracking-wide mt-0.5",
                isActive ? "text-primary" : "text-muted-foreground/80"
              )}>
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

// Wrapper component for pages that should have bottom nav padding on mobile
export function MobileNavPadding({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      {/* Padding for mobile bottom nav */}
      <div className="h-20 lg:hidden" />
    </>
  )
}
