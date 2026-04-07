'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  AlertTriangle,
  Activity,
  Globe,
  Heart,
  ArrowLeft,
  Shield,
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
  SidebarProvider,
  useSidebar,
} from '@/components/ui/sidebar'
import { Logo } from '@/components/logo'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

const adminNavItems = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, href: '/admin' },
  { id: 'users', label: 'Users', icon: Users, href: '/admin/users' },
  { id: 'feedback', label: 'Feedback', icon: MessageSquare, href: '/admin/feedback' },
  { id: 'errors', label: 'Error Logs', icon: AlertTriangle, href: '/admin/errors' },
  { id: 'activity', label: 'Activity', icon: Activity, href: '/admin/activity' },
  { id: 'analytics', label: 'Analytics', icon: Globe, href: '/admin/analytics' },
  { id: 'donations', label: 'Donations', icon: Heart, href: '/admin/donations' },
]

function AdminSidebarContent() {
  const pathname = usePathname()
  const { state } = useSidebar()
  const isCollapsed = state === 'collapsed'

  const getActiveId = () => {
    if (pathname === '/admin') return 'overview'
    for (const item of adminNavItems) {
      if (item.href !== '/admin' && pathname?.startsWith(item.href)) return item.id
    }
    return 'overview'
  }

  const activeId = getActiveId()

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="h-12 flex items-center justify-center border-b border-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/admin" className={cn("flex items-center", isCollapsed ? "justify-center" : "gap-2")}>
                <Shield className="h-5 w-5 shrink-0 text-red-500" />
                {!isCollapsed && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold tracking-tight">Admin</span>
                    <Badge variant="destructive" className="h-4 px-1 text-[9px]">PANEL</Badge>
                  </div>
                )}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="flex flex-col">
        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminNavItems.map((item) => (
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

        <div className="flex-1 min-h-0" />

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Back to App" asChild>
                  <Link href="/dashboard">
                    <ArrowLeft />
                    <span>Back to App</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AdminSidebarContent />
        <main className="flex-1 overflow-auto">
          <div className="p-6 max-w-[1400px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}
