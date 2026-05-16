'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard,
  LineChart,
  CalendarDays,
  Briefcase,
  ListTodo,
  BookOpen,
  FlaskConical,
  Settings,
  Database,
  BookMarked,
  RefreshCw,
  PanelLeftClose,
  PanelLeftOpen,
  MessageSquare,
  Heart,
  Trophy,
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
import type { SiteUiSettingsPayload } from '@/server/site-ui-settings'

const coreNavItems = [
  { id: 'widgets', label: 'Overview', icon: LayoutDashboard, href: '/dashboard' },
  { id: 'journal', label: 'Daily Journal', icon: CalendarDays, href: '/dashboard/journal' },
  { id: 'reports', label: 'Analytics', icon: LineChart, href: '/dashboard/reports' },
  { id: 'table', label: 'Trade Log', icon: ListTodo, href: '/dashboard/table' },
  { id: 'accounts', label: 'Portfolios', icon: Briefcase, href: '/dashboard/accounts' },
]

const toolItems = [
  { id: 'playbook', label: 'Playbook', icon: BookOpen, href: '/dashboard/playbook' },
  { id: 'backtesting', label: 'Backtesting', icon: FlaskConical, href: '/dashboard/backtesting' },
  { id: 'goals', label: 'Goals', icon: Trophy, href: '/dashboard/goals' },
]

export function DashboardSidebar({ siteUiSettings }: { siteUiSettings: SiteUiSettingsPayload }) {
  const pathname = usePathname()
  const { refreshTrades } = useData()
  const { state, toggleSidebar, isOverlay, setOpenMobile } = useSidebar()
  const isCollapsed = state === 'collapsed' && !isOverlay
  const utilityItems = [
    ...(siteUiSettings.showFeedbackButton
      ? [{ id: 'feedback', label: 'Feedback', icon: MessageSquare, href: '/feedback' }]
      : []),
    ...(siteUiSettings.showDonateButton
      ? [{ id: 'donate', label: 'Donate', icon: Heart, href: '/donate' }]
      : []),
    { id: 'docs', label: 'Documentation', icon: BookMarked, href: '/docs' },
    { id: 'data', label: 'Data', icon: Database, href: '/dashboard/data' },
    { id: 'settings', label: 'Settings', icon: Settings, href: '/dashboard/settings' },
  ]

  const getActiveId = () => {
    if (pathname === '/dashboard') return 'widgets'
    if (pathname?.startsWith('/dashboard/table')) return 'table'
    if (pathname?.startsWith('/dashboard/accounts')) return 'accounts'
    if (pathname?.startsWith('/dashboard/journal')) return 'journal'
    if (pathname?.startsWith('/dashboard/backtesting')) return 'backtesting'
    if (pathname?.startsWith('/dashboard/playbook')) return 'playbook'
    if (pathname?.startsWith('/dashboard/goals')) return 'goals'
    if (pathname?.startsWith('/dashboard/reports')) return 'reports'
    if (pathname?.startsWith('/dashboard/settings')) return 'settings'
    if (pathname?.startsWith('/dashboard/data')) return 'data'
    if (pathname?.startsWith('/docs')) return 'docs'
    return 'widgets'
  }

  const activeId = getActiveId()
  const collapseLabel = isCollapsed ? 'Expand' : 'Collapse'
  const CollapseIcon = isCollapsed ? PanelLeftOpen : PanelLeftClose

  const handleMobileClose = () => {
    if (isOverlay) {
      setOpenMobile(false)
    }
  }

  return (
    <Sidebar collapsible="icon" className="border-r border-border/40 bg-sidebar">
      <div className={cn('grid h-full min-h-0 bg-sidebar', isOverlay ? 'grid-rows-[auto_1fr_auto]' : 'grid-rows-[auto_1fr_auto]')}>
        <SidebarHeader className={cn('border-b border-sidebar-border/40', isOverlay ? 'px-4 pt-4 pb-2.5' : 'px-2 py-2')}>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                variant={isCollapsed ? 'icon' : 'default'}
                className={cn(
                  'rounded-2xl data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground',
                  isOverlay ? 'h-11' : 'h-12',
                  !isCollapsed && !isOverlay && 'px-3'
                )}
                asChild
                tooltip="Dashboard Home"
              >
                <Link
                  href="/dashboard"
                  onClick={handleMobileClose}
                  className={cn('flex w-full items-center', isCollapsed ? 'justify-center' : 'gap-3')}
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

        <SidebarContent className={cn('min-h-0', isOverlay ? 'overflow-hidden px-4 py-2.5' : 'overflow-y-auto px-2 py-2')}>
          <div className={cn('flex flex-1 flex-col', isOverlay ? 'min-h-full overflow-y-auto overscroll-contain' : 'min-h-0')}>
            <SidebarGroup className={cn('pt-0', isOverlay ? 'px-0' : 'px-0')}>
              <SidebarGroupLabel className={cn(isOverlay && 'h-7 px-1 text-[11px] tracking-wide')}>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className={cn(isOverlay && 'gap-1')}>
                  {coreNavItems.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        size={isOverlay ? 'lg' : 'default'}
                        variant={isCollapsed ? 'icon' : 'default'}
                        tooltip={item.label}
                        isActive={activeId === item.id}
                        asChild
                        className={cn(
                          isOverlay && 'h-11 rounded-2xl px-4 text-[15px] [&>svg]:size-[17px]',
                          !isOverlay && !isCollapsed && 'px-3'
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

            <SidebarGroup className={cn('pt-4', isOverlay ? 'px-0' : 'px-0')}>
              <SidebarGroupLabel className={cn(isOverlay && 'h-7 px-1 text-[11px] tracking-wide')}>Tools</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className={cn(isOverlay && 'gap-1')}>
                  {toolItems.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        size={isOverlay ? 'lg' : 'default'}
                        variant={isCollapsed ? 'icon' : 'default'}
                        tooltip={item.label}
                        isActive={activeId === item.id}
                        asChild
                        className={cn(
                          isOverlay && 'h-11 rounded-2xl px-4 text-[15px] [&>svg]:size-[17px]',
                          !isOverlay && !isCollapsed && 'px-3'
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

            <SidebarGroup className={cn('mt-auto', isOverlay ? 'px-0 pb-0 pt-6' : 'px-0 pb-0 pt-6')}>
              <SidebarGroupLabel className={cn(isOverlay && 'h-7 px-1 text-[11px] tracking-wide')}>Utilities</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className={cn(isOverlay && 'gap-1')}>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      size={isOverlay ? 'lg' : 'default'}
                      variant={isCollapsed ? 'icon' : 'default'}
                      tooltip="Refresh Data"
                      className={cn(
                        isOverlay && 'h-11 rounded-2xl px-4 text-[15px] [&>svg]:size-[17px]',
                        !isOverlay && !isCollapsed && 'px-3'
                      )}
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
                        variant={isCollapsed ? 'icon' : 'default'}
                        tooltip={item.label}
                        isActive={activeId === item.id}
                        asChild
                        className={cn(
                          isOverlay && 'h-11 rounded-2xl px-4 text-[15px] [&>svg]:size-[17px]',
                          !isOverlay && !isCollapsed && 'px-3'
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
            isOverlay ? 'px-4 py-2 pb-[calc(max(0.5rem,env(safe-area-inset-bottom))+0.25rem)]' : 'p-2'
          )}
        >
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size={isOverlay ? 'lg' : 'default'}
                variant={isCollapsed ? 'icon' : 'default'}
                onClick={toggleSidebar}
                tooltip={collapseLabel}
                className={cn(
                  'w-full text-muted-foreground hover:text-foreground',
                  isOverlay && 'h-11 rounded-2xl px-4 text-[15px] [&>svg]:size-[17px]',
                  !isOverlay && !isCollapsed && 'justify-start px-3'
                )}
              >
                <CollapseIcon />
                {(!isCollapsed || isOverlay) && <span>{collapseLabel}</span>}
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </div>
    </Sidebar>
  )
}
