'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { AdminShell } from '../components/admin-shell'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { BarChart3, Eye, Globe, LockKeyhole, Share2, TrendingUp, Users } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface SharedReportAdminRow {
  id: string
  slug: string
  title: string
  isPublic: boolean
  viewCount: number
  expiresAt: string | null
  createdAt: string
  User?: { email: string | null } | null
}

interface SharedReportAdminStats {
  total: number
  publicCount: number
  privateCount: number
  expiredCount: number
  createdLast30d: number
  totalViews: number
  recent: SharedReportAdminRow[]
}

export default function AdminAnalyticsPage() {
  const [geoData, setGeoData] = useState<any[]>([])
  const [trends, setTrends] = useState<any[]>([])
  const [sharedReports, setSharedReports] = useState<SharedReportAdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/v1/admin/analytics?type=geo').then(r => r.json()),
      fetch('/api/v1/admin/analytics?type=trends').then(r => r.json()),
      fetch('/api/v1/admin/analytics?type=sharedReports').then(r => r.json()),
    ])
      .then(([geoRes, trendRes, sharedRes]) => {
        if (geoRes.success) setGeoData(geoRes.data)
        if (trendRes.success) setTrends(trendRes.data)
        if (sharedRes.success) setSharedReports(sharedRes.data)
      })
      .finally(() => setLoading(false))
  }, [])

  const maxCount = Math.max(...geoData.map(g => g.count), 1)
  const maxTrend = useMemo(() => Math.max(...trends.map((t: any) => t.count), 1), [trends])

  const toggleSharedReport = async (report: SharedReportAdminRow) => {
    setUpdatingId(report.id)
    try {
      const response = await fetch('/api/v1/admin/analytics', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: report.id, isPublic: !report.isPublic }),
      })
      const payload = await response.json()

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Failed to update report visibility')
      }

      setSharedReports((current) => {
        if (!current) return current
        const recent = current.recent.map((item) => item.id === report.id ? payload.data : item)
        const publicCount = current.publicCount + (payload.data.isPublic ? 1 : -1)

        return {
          ...current,
          recent,
          publicCount,
          privateCount: Math.max(0, current.total - publicCount),
        }
      })
      toast.success(payload.data.isPublic ? 'Shared report restored' : 'Shared report revoked')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update report visibility')
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground text-sm mt-1">User distribution, growth, and public report controls</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>
        ) : (
          <>
            <section className="overflow-hidden rounded-xl border border-border bg-card">
              <div className="grid divide-y divide-border md:grid-cols-4 md:divide-x md:divide-y-0">
                <AdminMetric icon={Users} label="Countries" value={geoData.length} />
                <AdminMetric icon={TrendingUp} label="30d Registrations" value={trends.reduce((sum: number, item: any) => sum + item.count, 0)} />
                <AdminMetric icon={Share2} label="Shared Reports" value={sharedReports?.total ?? 0} />
                <AdminMetric icon={Eye} label="Shared Views" value={sharedReports?.totalViews ?? 0} />
              </div>
            </section>

            <div className="grid gap-6 lg:grid-cols-2">
              <section className="rounded-xl border border-border bg-card">
                <div className="flex items-center gap-2 border-b border-border px-5 py-4">
                  <Globe className="h-4 w-4" />
                  <h2 className="text-sm font-semibold">Users by Latest Country</h2>
                </div>
                <div className="p-5">
                  {geoData.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No geo data yet</p>
                  ) : (
                    <div className="space-y-3">
                      {geoData.map((item, i) => (
                        <div key={i} className="grid grid-cols-[72px_minmax(0,1fr)_40px] items-center gap-3 text-sm">
                          <span className="font-mono text-xs text-muted-foreground">{item.countryCode || '??'}</span>
                          <div>
                            <div className="mb-1 flex items-center justify-between gap-3">
                              <span className="font-medium">{item.country || 'Unknown'}</span>
                            </div>
                            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                              <div className="h-full rounded-full bg-primary" style={{ width: `${(item.count / maxCount) * 100}%` }} />
                            </div>
                          </div>
                          <span className="text-right font-mono text-xs font-bold">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>

              <section className="rounded-xl border border-border bg-card">
                <div className="flex items-center gap-2 border-b border-border px-5 py-4">
                  <BarChart3 className="h-4 w-4" />
                  <h2 className="text-sm font-semibold">Registrations (30d)</h2>
                </div>
                <div className="p-5">
                  {trends.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No trend data yet</p>
                  ) : (
                    <div className="space-y-2">
                      {trends.slice(-14).map((item: any, i: number) => (
                        <div key={i} className="grid grid-cols-[58px_minmax(0,1fr)_32px] items-center gap-3">
                          <span className="text-[10px] text-muted-foreground">{item.date.slice(5)}</span>
                          <div className="h-2 overflow-hidden rounded-full bg-muted">
                            <div className="h-full rounded-full bg-primary/70" style={{ width: `${(item.count / maxTrend) * 100}%` }} />
                          </div>
                          <span className="text-right text-xs text-muted-foreground">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            </div>

            <section className="overflow-hidden rounded-xl border border-border bg-card">
              <div className="flex flex-col gap-3 border-b border-border px-5 py-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-2">
                  <Share2 className="h-4 w-4" />
                  <h2 className="text-sm font-semibold">Public Shared Reports</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{sharedReports?.publicCount ?? 0} public</Badge>
                  <Badge variant="outline">{sharedReports?.privateCount ?? 0} revoked</Badge>
                  <Badge variant="outline">{sharedReports?.expiredCount ?? 0} expired</Badge>
                  <Badge variant="outline">{sharedReports?.createdLast30d ?? 0} created in 30d</Badge>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30 text-left">
                      {['Report', 'Owner', 'Views', 'Expires', 'Status', 'Control'].map((heading) => (
                        <th key={heading} className="px-5 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">{heading}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(sharedReports?.recent ?? []).length === 0 ? (
                      <tr><td colSpan={6} className="px-5 py-8 text-center text-muted-foreground">No shared reports yet</td></tr>
                    ) : (
                      sharedReports?.recent.map((report) => (
                        <tr key={report.id} className="border-b border-border/70 last:border-b-0">
                          <td className="px-5 py-3">
                            <Link href={`/reports/shared/${report.slug}`} className="font-semibold hover:underline" target="_blank">
                              {report.title}
                            </Link>
                            <p className="mt-1 text-[11px] text-muted-foreground">{new Date(report.createdAt).toLocaleString()}</p>
                          </td>
                          <td className="px-5 py-3 text-muted-foreground">{report.User?.email || 'Unknown'}</td>
                          <td className="px-5 py-3 font-mono font-bold">{report.viewCount}</td>
                          <td className="px-5 py-3 text-muted-foreground">{report.expiresAt ? new Date(report.expiresAt).toLocaleDateString() : 'Never'}</td>
                          <td className="px-5 py-3">
                            <Badge variant={report.isPublic ? 'default' : 'secondary'} className={cn(!report.isPublic && 'gap-1')}>
                              {!report.isPublic && <LockKeyhole className="h-3 w-3" />}
                              {report.isPublic ? 'Public' : 'Revoked'}
                            </Badge>
                          </td>
                          <td className="px-5 py-3">
                            <Button
                              variant={report.isPublic ? 'destructive' : 'outline'}
                              size="sm"
                              disabled={updatingId === report.id}
                              onClick={() => toggleSharedReport(report)}
                            >
                              {report.isPublic ? 'Revoke' : 'Restore'}
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </AdminShell>
  )
}

function AdminMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number
}) {
  return (
    <div className="flex items-center gap-3 px-5 py-4">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
        <p className="font-mono text-2xl font-black">{value.toLocaleString()}</p>
      </div>
    </div>
  )
}
