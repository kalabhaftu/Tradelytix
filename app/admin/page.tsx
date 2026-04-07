'use client'

import { useEffect, useState } from 'react'
import { AdminShell } from './components/admin-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, MessageSquare, AlertTriangle, Activity, TrendingUp, Globe } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import { Badge } from '@/components/ui/badge'

interface AdminStats {
  totalUsers: number
  newUsersLast7d: number
  newUsersLast30d: number
  totalFeedback: number
  openFeedback: number
  totalErrors24h: number
  totalErrors7d: number
  recentActivity: Array<{
    id: string
    action: string
    entity: string
    userId: string
    createdAt: string
    User?: { email: string | null } | null
  }>
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/v1/admin/stats')
      .then(r => r.json())
      .then(data => {
        if (data.success) setStats(data.data)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin Overview</h1>
          <p className="text-muted-foreground text-sm mt-1">Platform health at a glance</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : stats ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Total Users"
                value={stats.totalUsers}
                subtitle={`+${stats.newUsersLast7d} this week`}
                icon={Users}
              />
              <StatCard
                title="Open Feedback"
                value={stats.openFeedback}
                subtitle={`${stats.totalFeedback} total`}
                icon={MessageSquare}
              />
              <StatCard
                title="Errors (24h)"
                value={stats.totalErrors24h}
                subtitle={`${stats.totalErrors7d} this week`}
                icon={AlertTriangle}
                variant={stats.totalErrors24h > 10 ? 'destructive' : 'default'}
              />
              <StatCard
                title="New Users (30d)"
                value={stats.newUsersLast30d}
                subtitle="registrations"
                icon={TrendingUp}
              />
            </div>

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
                    {stats.recentActivity.map((item) => (
                      <div key={item.id} className="flex items-start justify-between py-3 border-b border-border/50 last:border-0">
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
          </>
        ) : (
          <p className="text-muted-foreground">Failed to load stats</p>
        )}
      </div>
    </AdminShell>
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
  icon: React.ComponentType<{ className?: string }>
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
