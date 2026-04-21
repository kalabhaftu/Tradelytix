'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard,
  TrendingUp,
  BookOpen,
  Users,
  Table2,
  Target,
  FlaskConical,
  Settings,
  Database,
  BookMarked,
  RefreshCw,
  PanelLeftClose,
  MessageSquare,
  Heart,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { Logo } from '@/components/logo'
import { cn } from '@/lib/utils'
import { useData } from '@/context/data-provider'

const navItems = [
  { id: 'widgets', label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { id: 'reports', label: 'Reports', icon: TrendingUp, href: '/dashboard/reports' },
  { id: 'table', label: 'Trades', icon: Table2, href: '/dashboard/table' },
  { id: 'journal', label: 'Journal', icon: BookOpen, href: '/dashboard/journal' },
  { id: 'playbook', label: 'Playbook', icon: Target, href: '/dashboard/playbook' },
  { id: 'accounts', label: 'Accounts', icon: Users, href: '/dashboard/accounts' },
  { id: 'backtesting', label: 'Backtesting', icon: FlaskConical, href: '/dashboard/backtesting' },
]

// Utility items at the bottom
const utilityItems = [
  { id: 'feedback', label: 'Feedback', icon: MessageSquare, href: '/feedback' },
  { id: 'donate', label: 'Donate', icon: Heart, href: '/donate' },
  { id: 'docs', label: 'Documentation', icon: BookMarked, href: '/docs' },
  { id: 'data', label: 'Data', icon: Database, href: '/dashboard/data' },
  { id: 'settings', label: 'Settings', icon: Settings, href: '/dashboard/settings' },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const { refreshTrades } = useData()
  const { state, toggleSidebar, isMobile } = useSidebar()
  const isCollapsed = state === 'collapsed'

  const getActiveId = () => {
    if (pathname === '/dashboard') return 'widgets'
    if (pathname?.startsWith('/dashboard/table')) return 'table'
    if (pathname?.startsWith('/dashboard/accounts')) return 'accounts'
    if (pathname?.startsWith('/dashboard/journal')) return 'journal'
    if (pathname?.startsWith('/dashboard/backtesting')) return 'backtesting'
    if (pathname?.startsWith('/dashboard/playbook')) return 'playbook'
    if (pathname?.startsWith('/dashboard/reports')) return 'reports'
    if (pathname?.startsWith('/dashboard/settings')) return 'settings'
    if (pathname?.startsWith('/dashboard/data')) return 'data'
    if (pathname?.startsWith('/docs')) return 'docs'
    return 'widgets'
  }

  const activeId = getActiveId()

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50">
      {/* Header — Logo */}
      <SidebarHeader className={cn("flex items-center justify-center px-2", isMobile ? "h-12 pt-2 pb-1" : "h-12")}>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size={isMobile ? "default" : "lg"}
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              asChild
            >
              <Link href="/dashboard" className={cn(
                "flex items-center",
                isCollapsed ? "justify-center" : "gap-2"
              )}>
                <Logo className="h-6 w-6 shrink-0" />
                {!isCollapsed && (
                  <span className="text-sm font-bold tracking-tight">Deltalytix</span>
                )}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Main nav */}
      <SidebarContent className={cn("flex flex-1 min-h-0 flex-col", isMobile && "gap-0 px-1 pb-0 overflow-hidden")}>
        <div className={cn("flex min-h-0 flex-1 flex-col", isMobile && "overflow-y-auto overscroll-contain")}>
        <SidebarGroup className={cn(isMobile && "p-1.5 pt-0")}>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className={cn(isMobile && "gap-0.5")}>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    size={isMobile ? "sm" : "default"}
                    tooltip={item.label}
                    isActive={activeId === item.id}
                    asChild
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="flex-1 min-h-3" />

        {/* Utility items at bottom of content area */}
        <SidebarGroup className={cn(isMobile && "p-1.5 pb-0")}>
          <SidebarGroupLabel>Utilities</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className={cn(isMobile && "gap-0.5")}>
              {/* Refresh Data action */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  size={isMobile ? "sm" : "default"}
                  tooltip="Refresh Data"
                  onClick={() => refreshTrades()}
                >
                  <RefreshCw />
                  <span>Refresh Data</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {utilityItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    size={isMobile ? "sm" : "default"}
                    tooltip={item.label}
                    isActive={activeId === item.id}
                    asChild
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        </div>
      </SidebarContent>

      {/* Footer — Collapse button anchored at absolute bottom */}
      <SidebarFooter className={cn("mt-auto", isMobile ? "p-1.5 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]" : "p-2")}>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size={isMobile ? "sm" : "default"} onClick={toggleSidebar} tooltip="Collapse" className="w-full justify-start text-muted-foreground hover:text-foreground">
              <PanelLeftClose />
              <span>Collapse</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
