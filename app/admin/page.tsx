'use client'

import { useEffect, useMemo, useState, type ComponentType } from 'react'
import { AdminShell } from './components/admin-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, MessageSquare, AlertTriangle, Activity, ShieldAlert, UserCog } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { LexicalEditor } from '@/components/ui/editor/lexical-editor'
import { toast } from 'sonner'

interface SiteUiSettings {
  showDonateButton: boolean
  showFeedbackButton: boolean
}

interface AdminStats {
  totalUsers: number
  newUsersLast7d: number
  newUsersLast30d: number
  orphanedDbUsers: number
  authUsersMissingDbRows: number
  totalFeedback: number
  openFeedback: number
  totalErrors24h: number
  totalErrors7d: number
  recentActivity: Array<{
    id: string
    action: string
    entity: string
    userId: string
    metadata?: Record<string, any> | null
    createdAt: string
    User?: { email: string | null } | null
  }>
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [siteUiSettings, setSiteUiSettings] = useState<SiteUiSettings | null>(null)
  const [isSavingSiteUi, setIsSavingSiteUi] = useState(false)
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false)
  const [broadcastForm, setBroadcastForm] = useState({
    title: '',
    content: '',
    priority: 'MEDIUM',
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/v1/admin/stats').then((response) => response.json()),
      fetch('/api/v1/admin/site-ui').then((response) => response.json()),
    ])
      .then(([statsPayload, siteUiPayload]) => {
        if (statsPayload.success) setStats(statsPayload.data)
        if (siteUiPayload.success) setSiteUiSettings(siteUiPayload.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSendBroadcast = async () => {
    if (!broadcastForm.title.trim() || !broadcastForm.content.trim()) {
      toast.error('Broadcast title and content are required')
      return
    }

    setIsSendingBroadcast(true)
    try {
      const response = await fetch('/api/v1/admin/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(broadcastForm),
      })
      const payload = await response.json()

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Failed to send broadcast')
      }

      setBroadcastForm({
        title: '',
        content: '',
        priority: 'MEDIUM',
      })
      toast.success(`Broadcast sent to ${payload.data.recipients} users`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send broadcast')
    } finally {
      setIsSendingBroadcast(false)
    }
  }

  const handleToggleSiteUi = async (
    key: keyof SiteUiSettings,
    value: boolean
  ) => {
    if (!siteUiSettings) return

    const optimistic = { ...siteUiSettings, [key]: value }
    setSiteUiSettings(optimistic)
    setIsSavingSiteUi(true)

    try {
      const response = await fetch('/api/v1/admin/site-ui', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value }),
      })
      const payload = await response.json()

      if (!response.ok || !payload.success) {
        throw new Error('Failed to update site UI settings')
      }

      setSiteUiSettings(payload.data)
    } catch {
      setSiteUiSettings(siteUiSettings)
    } finally {
      setIsSavingSiteUi(false)
    }
  }

  const needsAttention = useMemo(() => {
    if (!stats) return []

    return [
      stats.orphanedDbUsers > 0 ? `${stats.orphanedDbUsers} orphaned DB user record(s) need cleanup review` : null,
      stats.authUsersMissingDbRows > 0 ? `${stats.authUsersMissingDbRows} auth user(s) are missing app profiles` : null,
      stats.openFeedback > 0 ? `${stats.openFeedback} feedback item(s) are still open` : null,
      stats.totalErrors24h > 0 ? `${stats.totalErrors24h} error log(s) in the last 24 hours` : null,
    ].filter(Boolean) as string[]
  }, [stats])

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin Overview</h1>
          <p className="text-muted-foreground text-sm mt-1">Operations-first view of platform health</p>
        </div>

        {loading ? (
          <div className="space-y-6">
            {/* Grid of 5 Stat Cards */}
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Card key={i} className="border-border/30 bg-card/60">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-3 w-20 bg-muted/30" />
                        <Skeleton className="h-8 w-24 bg-muted/45" />
                        <Skeleton className="h-3 w-32 bg-muted/25" />
                      </div>
                      <Skeleton className="h-11 w-11 rounded-xl bg-muted/20" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Needs Attention and Recent Activity Section */}
            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <Card className="border-border/30 bg-card/60">
                <CardHeader className="space-y-2">
                  <Skeleton className="h-4 w-32 bg-muted/35" />
                </CardHeader>
                <CardContent className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-xl border border-border/40 bg-muted/10 px-4 py-3">
                      <Skeleton className="h-5 w-5 rounded-md bg-muted/30 shrink-0" />
                      <Skeleton className="h-4 w-72 bg-muted/20" />
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-border/30 bg-card/60">
                <CardHeader className="space-y-2">
                  <Skeleton className="h-4 w-28 bg-muted/35" />
                </CardHeader>
                <CardContent className="space-y-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-36 bg-muted/30" />
                        <Skeleton className="h-3 w-24 bg-muted/20" />
                      </div>
                      <Skeleton className="h-4 w-12 bg-muted/25" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Support Buttons Toggle Card */}
            <Card className="border-border/30 bg-card/60">
              <CardHeader className="space-y-2">
                <Skeleton className="h-4 w-40 bg-muted/35" />
              </CardHeader>
              <CardContent className="space-y-4">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between gap-4 rounded-xl border border-border/40 bg-muted/10 px-4 py-3">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-28 bg-muted/30" />
                      <Skeleton className="h-3 w-72 bg-muted/20" />
                    </div>
                    <Skeleton className="h-6 w-11 rounded-full bg-muted/30" />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Broadcast update skeleton */}
            <Card className="border-border/30 bg-card/60">
              <CardHeader className="space-y-2">
                <Skeleton className="h-4 w-32 bg-muted/35" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Skeleton className="h-3 w-10 bg-muted/30" />
                  <Skeleton className="h-10 w-full bg-muted/20 rounded-md" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-3 w-16 bg-muted/30" />
                  <Skeleton className="h-[220px] w-full bg-muted/15 rounded-md" />
                </div>
                <div className="flex justify-between items-center">
                  <Skeleton className="h-3 w-96 bg-muted/20" />
                  <Skeleton className="h-10 w-32 bg-muted/35 rounded-md" />
                </div>
              </CardContent>
            </Card>
          </div>
        ) : stats ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <StatCard
                title="Live Users"
                value={stats.totalUsers}
                subtitle={`+${stats.newUsersLast7d} in the last 7 days`}
                icon={Users}
              />
              <StatCard
                title="Open Feedback"
                value={stats.openFeedback}
                subtitle={`${stats.totalFeedback} total submissions`}
                icon={MessageSquare}
              />
              <StatCard
                title="Errors (24h)"
                value={stats.totalErrors24h}
                subtitle={`${stats.totalErrors7d} in the last 7 days`}
                icon={AlertTriangle}
                variant={stats.totalErrors24h > 0 ? 'destructive' : 'default'}
              />
              <StatCard
                title="Orphaned DB Users"
                value={stats.orphanedDbUsers}
                subtitle="Deleted in auth, still in DB"
                icon={ShieldAlert}
                variant={stats.orphanedDbUsers > 0 ? 'destructive' : 'default'}
              />
              <StatCard
                title="Missing App Profiles"
                value={stats.authUsersMissingDbRows}
                subtitle={`+${stats.newUsersLast30d} users in the last 30 days`}
                icon={UserCog}
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4" />
                    Needs Attention
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {needsAttention.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nothing critical is currently flagged.</p>
                  ) : (
                    <div className="space-y-3">
                      {needsAttention.map((item) => (
                        <div key={item} className="flex items-start gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-3">
                          <AlertTriangle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
                          <p className="text-sm">{item}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {stats.recentActivity.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No recent activity</p>
                  ) : (
                    <div className="space-y-2">
                      {stats.recentActivity.slice(0, 8).map((item) => (
                        <div key={item.id} className="flex items-start justify-between gap-3 py-3 border-b border-border/50 last:border-0">
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-[10px] uppercase">{item.action}</Badge>
                              <span className="text-sm font-medium">{item.entity}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              by {item.User?.email || item.userId}
                            </span>
                          </div>
                          <span className="text-[11px] text-muted-foreground whitespace-nowrap pt-1">
                            {new Date(item.createdAt).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Public Support Buttons
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <SiteUiToggleRow
                  label="Feedback button"
                  description="Shows or hides feedback entry points in public and dashboard navigation."
                  checked={siteUiSettings?.showFeedbackButton ?? true}
                  disabled={!siteUiSettings || isSavingSiteUi}
                  onCheckedChange={(checked) => handleToggleSiteUi('showFeedbackButton', checked)}
                />
                <SiteUiToggleRow
                  label="Donate button"
                  description="Shows or hides donate entry points while keeping the route available."
                  checked={siteUiSettings?.showDonateButton ?? true}
                  disabled={!siteUiSettings || isSavingSiteUi}
                  onCheckedChange={(checked) => handleToggleSiteUi('showDonateButton', checked)}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Broadcast Update
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Title</Label>
                  <Input
                    value={broadcastForm.title}
                    onChange={(event) =>
                      setBroadcastForm((prev) => ({ ...prev, title: event.target.value }))
                    }
                    placeholder="Platform update title"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Post body</Label>
                  <LexicalEditor
                    value={broadcastForm.content}
                    onChange={(value) =>
                      setBroadcastForm((prev) => ({ ...prev, content: value }))
                    }
                    placeholder="Write the announcement users should read in their notification panel..."
                    minHeight="220px"
                  />
                </div>
                <div className="flex items-center justify-between gap-4">
                  <p className="text-xs text-muted-foreground">
                    Sends a readable announcement to the in-app notification panel for {stats.totalUsers.toLocaleString()} users.
                  </p>
                  <Button onClick={handleSendBroadcast} disabled={isSendingBroadcast}>
                    {isSendingBroadcast ? 'Sending...' : 'Send Broadcast'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <p className="text-muted-foreground">Failed to load stats</p>
        )}
      </div>
    </AdminShell>
  )
}

function SiteUiToggleRow({
  label,
  description,
  checked,
  disabled,
  onCheckedChange,
}: {
  label: string
  description: string
  checked: boolean
  disabled: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </div>
      <Switch checked={checked} disabled={disabled} onCheckedChange={onCheckedChange} />
    </div>
  )
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'default',
}: {
  title: string
  value: number
  subtitle: string
  icon: ComponentType<{ className?: string }>
  variant?: 'default' | 'destructive'
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
            <p className={`text-3xl font-bold mt-1 ${variant === 'destructive' ? 'text-destructive' : ''}`}>
              {value.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          </div>
          <div className={`p-3 rounded-xl ${variant === 'destructive' ? 'bg-destructive/10' : 'bg-primary/10'}`}>
            <Icon className={`h-5 w-5 ${variant === 'destructive' ? 'text-destructive' : 'text-primary'}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
