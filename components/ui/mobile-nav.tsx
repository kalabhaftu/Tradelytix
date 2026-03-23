'use client'

import { cn } from "@/lib/utils"
import {
  BookOpen,
  BarChart3,
  LayoutGrid,
  Table2,
  Users
} from "lucide-react"
import { usePathname, useRouter } from 'next/navigation'

interface MobileNavItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string; weight?: any }>
  href: string
}

const mobileNavItems: MobileNavItem[] = [
  {
    id: 'widgets',
    label: 'Dashboard',
    icon: LayoutGrid,
    href: '/dashboard'
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: BarChart3,
    href: '/dashboard/reports'
  },
  {
    id: 'table',
    label: 'Trades',
    icon: Table2,
    href: '/dashboard/table'
  },
  {
    id: 'playbook',
    label: 'Playbook',
    icon: BookOpen,
    href: '/dashboard/playbook'
  },
  {
    id: 'accounts',
    label: 'Accounts',
    icon: Users,
    href: '/dashboard/accounts'
  }
]

export function MobileBottomNav() {
  const pathname = usePathname()
  const router = useRouter()

  const getActiveTab = () => {
    if (pathname === '/dashboard') return 'widgets'
    if (pathname?.startsWith('/dashboard/reports')) return 'reports'
    if (pathname?.startsWith('/dashboard/table')) return 'table'
    if (pathname?.startsWith('/dashboard/journal')) return 'journal'
    if (pathname?.startsWith('/dashboard/playbook')) return 'playbook'
    if (pathname?.startsWith('/dashboard/accounts')) return 'accounts'
    return null
  }

  const activeTab = getActiveTab()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-background/95 backdrop-blur-md border-t border-border/30 safe-area-inset-bottom">
      <div className="flex items-center justify-evenly h-14 max-w-md mx-auto">
        {mobileNavItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id

          return (
            <button
              key={item.id}
              onClick={() => router.push(item.href)}
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

