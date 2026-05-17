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
  CreditCard,
  Receipt,
  Ticket,
  Gift,
  SlidersHorizontal,
  LayoutTemplate,
  ToggleLeft,
  DatabaseZap,
  Tags,
  Share2,
  CircleHelp,
} from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
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
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar'
import { Logo } from '@/components/logo'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

const adminNavItems = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, href: '/admin', hint: 'Global admin health, site UI toggles, and broadcasts.' },
  { id: 'users', label: 'Users', icon: Users, href: '/admin/users', hint: 'Review user accounts, roles, access state, and account health.' },
  { id: 'feedback', label: 'Feedback', icon: MessageSquare, href: '/admin/feedback', hint: 'Triage user feedback, reply, and mark status.' },
  { id: 'errors', label: 'Error Logs', icon: AlertTriangle, href: '/admin/errors', hint: 'Investigate production errors before clearing or exporting logs.' },
  { id: 'activity', label: 'Activity', icon: Activity, href: '/admin/activity', hint: 'Audit sensitive admin/user actions and operational changes.' },
  { id: 'analytics', label: 'Analytics', icon: Globe, href: '/admin/analytics', hint: 'Track traffic, usage, browser/device mix, and growth signals.' },
  { id: 'widget-catalog', label: 'Widget Catalog', icon: SlidersHorizontal, href: '/admin/widget-catalog', hint: 'Control dashboard widget availability, labels, and lifecycle state.' },
  { id: 'dashboard-presets', label: 'Dashboard Presets', icon: LayoutTemplate, href: '/admin/dashboard-presets', hint: 'Manage reusable dashboard layouts users can adopt.' },
  { id: 'feature-controls', label: 'Feature Controls', icon: ToggleLeft, href: '/admin/feature-controls', hint: 'Enable or disable guarded platform features.' },
  { id: 'data-quality', label: 'Data Quality', icon: DatabaseZap, href: '/admin/data-quality', hint: 'Find duplicate, orphaned, or inconsistent production data.' },
  { id: 'taxonomy', label: 'Taxonomy', icon: Tags, href: '/admin/taxonomy', hint: 'Review user tags, symbols, strategies, and cleanup candidates.' },
  { id: 'sharing-governance', label: 'Sharing Governance', icon: Share2, href: '/admin/sharing-governance', hint: 'Monitor and govern public report sharing.' },
  { id: 'donations', label: 'Donations', icon: Heart, href: '/admin/donations', hint: 'Manage public donation addresses and visibility.' },
  { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard, href: '/admin/subscriptions', hint: 'Review and manually adjust subscription lifecycle state.' },
  { id: 'payments', label: 'Payments', icon: Receipt, href: '/admin/payments', hint: 'Inspect payment records and reconcile provider status.' },
  { id: 'promo-codes', label: 'Promo Codes', icon: Ticket, href: '/admin/promo-codes', hint: 'Create and manage limited discounts or access promos.' },
  { id: 'free-access', label: 'Free Access', icon: Gift, href: '/admin/free-access', hint: 'Grant temporary or permanent access outside normal billing.' },
]

export function AdminHint({ content }: { content: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-border/70 text-muted-foreground transition hover:border-primary/50 hover:text-foreground"
          aria-label="Help"
        >
          <CircleHelp className="h-3.5 w-3.5" />
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" align="center" className="max-w-xs text-xs leading-relaxed">
        {content}
      </TooltipContent>
    </Tooltip>
  )
}

export function AdminPageHeader({ title, description, hint }: { title: string; description?: string; hint?: string }) {
  return (
    <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {hint ? <AdminHint content={hint} /> : null}
        </div>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
    </div>
  )
}

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
      <SidebarHeader className="h-14 flex items-center justify-center border-b border-border">
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
                    <Link href={item.href} className="group/admin-nav">
                      <item.icon />
                      <span>{item.label}</span>
                      {!isCollapsed && (
                        <span className="ml-auto opacity-0 transition-opacity group-hover/admin-nav:opacity-100 group-focus-visible/admin-nav:opacity-100">
                          <AdminHint content={item.hint} />
                        </span>
                      )}
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
      <div className="flex min-h-screen w-full bg-background text-foreground">
        <AdminSidebarContent />
        <main className="flex-1 flex flex-col min-w-0 overflow-auto">
          <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur px-4">
            <SidebarTrigger className="-ml-1" />
          </header>
          <div className="flex-1 p-6 md:p-8 max-w-[1600px] mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}
