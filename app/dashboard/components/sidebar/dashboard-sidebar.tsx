'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard,
  BarChart3,
  BookOpen,
  Users,
  Table,
  List,
  FlaskConical,
  Settings,
  Database,
  FileText,
  RefreshCw,
  PanelLeftClose,
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
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar'
import { Logo } from '@/components/logo'
import { cn } from '@/lib/utils'
import { useData } from '@/context/data-provider'

const navItems = [
  { id: 'widgets', label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { id: 'reports', label: 'Reports', icon: BarChart3, href: '/dashboard/reports' },
  { id: 'table', label: 'Trades', icon: Table, href: '/dashboard/table' },
  { id: 'journal', label: 'Journal', icon: BookOpen, href: '/dashboard/journal' },
  { id: 'playbook', label: 'Playbook', icon: List, href: '/dashboard/playbook' },
  { id: 'accounts', label: 'Accounts', icon: Users, href: '/dashboard/accounts' },
  { id: 'backtesting', label: 'Backtesting', icon: FlaskConical, href: '/dashboard/backtesting' },
]

// Utility items at the bottom
const utilityItems = [
  { id: 'docs', label: 'Documentation', icon: FileText, href: '/docs' },
  { id: 'data', label: 'Data', icon: Database, href: '/dashboard/data' },
  { id: 'settings', label: 'Settings', icon: Settings, href: '/dashboard/settings' },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const { refreshTrades } = useData()
  const { state, toggleSidebar } = useSidebar()
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
    <Sidebar collapsible="icon" className="border-r border-border">
      {/* Header — Logo */}
      <SidebarHeader className="h-12 flex items-center justify-center border-b border-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
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
      <SidebarContent className="flex flex-col">
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
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

        {/* Spacer to push utility items to bottom */}
        <div className="flex-1 min-h-0" />

        <SidebarSeparator />

        {/* Utility items at bottom of content area */}
        <SidebarGroup>
          <SidebarGroupLabel>Utilities</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Refresh Data action */}
              <SidebarMenuItem>
                <SidebarMenuButton
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
      </SidebarContent>

      {/* Footer — Collapse button anchored at absolute bottom */}
      <SidebarFooter className="border-t border-border p-2 mt-auto">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={toggleSidebar} tooltip="Collapse" className="w-full justify-start text-muted-foreground hover:text-foreground">
              <PanelLeftClose />
              <span>Collapse</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
