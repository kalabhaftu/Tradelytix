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
  const { state, toggleSidebar, isOverlay, setOpenMobile } = useSidebar()
  const isCollapsed = state === 'collapsed' && !isOverlay

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

  const handleMobileClose = () => {
    if (isOverlay) {
      setOpenMobile(false)
    }
  }

  return (
    <Sidebar collapsible="icon" className="border-r border-border/40 bg-sidebar">
      <div className="grid h-full min-h-0 grid-rows-[auto_1fr_auto] bg-sidebar">
        <SidebarHeader className={cn('px-3', isOverlay ? 'pt-5 pb-3' : 'py-2')}>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                className={cn(
                  'h-12 rounded-2xl data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground',
                  isCollapsed && 'justify-center'
                )}
                asChild
              >
                <Link
                  href="/dashboard"
                  onClick={handleMobileClose}
                  className={cn('flex items-center', isCollapsed ? 'justify-center' : 'gap-3')}
                >
                  <Logo className="h-6 w-6 shrink-0" />
                  {(!isCollapsed || isOverlay) && (
                    <span className="text-sm font-bold tracking-tight">Deltalytix</span>
                  )}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent className={cn('min-h-0 px-2', isOverlay ? 'overflow-hidden px-3 pb-3' : '')}>
          <div className={cn('flex min-h-0 flex-1 flex-col', isOverlay ? 'overflow-y-auto overscroll-contain pr-1' : '')}>
            <SidebarGroup className={cn('pt-0', isOverlay && 'px-0')}>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className={cn(isOverlay && 'gap-1.5')}>
                  {navItems.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        size={isOverlay ? 'lg' : 'default'}
                        tooltip={item.label}
                        isActive={activeId === item.id}
                        asChild
                        className={cn(
                          isOverlay && 'h-12 rounded-2xl px-4 text-base [&>svg]:size-[18px]',
                          isCollapsed && 'justify-center'
                        )}
                      >
                        <Link href={item.href} onClick={handleMobileClose}>
                          <item.icon />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <div className="flex-1 min-h-6" />

            <SidebarGroup className={cn(isOverlay && 'px-0 pb-0')}>
              <SidebarGroupLabel>Utilities</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className={cn(isOverlay && 'gap-1.5')}>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      size={isOverlay ? 'lg' : 'default'}
                      tooltip="Refresh Data"
                      className={cn(isOverlay && 'h-12 rounded-2xl px-4 text-base [&>svg]:size-[18px]')}
                      onClick={() => {
                        refreshTrades()
                        handleMobileClose()
                      }}
                    >
                      <RefreshCw />
                      <span>Refresh Data</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  {utilityItems.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        size={isOverlay ? 'lg' : 'default'}
                        tooltip={item.label}
                        isActive={activeId === item.id}
                        asChild
                        className={cn(
                          isOverlay && 'h-12 rounded-2xl px-4 text-base [&>svg]:size-[18px]',
                          isCollapsed && 'justify-center'
                        )}
                      >
                        <Link href={item.href} onClick={handleMobileClose}>
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

        <SidebarFooter
          className={cn(
            'border-t border-sidebar-border/60 bg-sidebar',
            isOverlay ? 'px-3 py-2 pb-[calc(max(0.75rem,env(safe-area-inset-bottom))+0.35rem)]' : 'p-2'
          )}
        >
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size={isOverlay ? 'lg' : 'default'}
                onClick={toggleSidebar}
                tooltip="Collapse"
                className={cn(
                  'w-full justify-start text-muted-foreground hover:text-foreground',
                  isOverlay && 'h-12 rounded-2xl px-4 text-base [&>svg]:size-[18px]'
                )}
              >
                <PanelLeftClose />
                <span>Collapse</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </div>
    </Sidebar>
  )
}
