'use client'

import { useEffect, useState, useCallback } from 'react'
import { AdminShell } from '../components/admin-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { Input } from '@/components/ui/input'
import { Search, ChevronLeft, ChevronRight, Infinity, Info } from 'lucide-react'
import { toast } from 'sonner'

type AdminSubscriptionUser = {
  id: string
  email: string | null
  role: string
  Subscription: null | {
    id: string
    status: string
    currentPeriodEnd: string | null
    nextPaymentDue: string | null
    paymentStatus: string | null
    latestPaymentPaidAt: string | null
    latestPaymentCreatedAt: string | null
    latestPaymentAmountUsd: number | null
    hasOpenInvoice: boolean
    openInvoiceUrl: string | null
    resolvedAt: string | null
    isPaymentStale: boolean
    roleBypassAccess: boolean
    accessSource: 'paid' | 'free_access' | 'promo' | 'manual' | 'admin' | 'none'
    displayAccessStatus: string
    PromoCode?: { code: string } | null
    FreeAccess?: { note: string | null; type: string } | null
  }
}

export default function AdminSubscriptionsPage() {
  const [users, setUsers] = useState<AdminSubscriptionUser[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [extensionDays, setExtensionDays] = useState<Record<string, string>>({})
  const [syncingId, setSyncingId] = useState<string | null>(null)
  const limit = 25

  const load = useCallback(async (nextPage: number, nextSearch: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/v1/admin/subscriptions?page=${nextPage}&limit=${limit}&search=${encodeURIComponent(nextSearch)}`)
      const payload = await response.json()
      if (payload.success) {
        setUsers(payload.data)
        setTotal(payload.total)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load(page, appliedSearch)
  }, [page, appliedSearch, load])

  const handleSearch = () => {
    setPage(1)
    setAppliedSearch(search)
  }

  async function action(subscriptionId: string, actionName: string, extra?: Record<string, string>) {
    if (actionName === 'sync') setSyncingId(subscriptionId)
    try {
      const response = await fetch('/api/v1/admin/subscriptions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId, action: actionName, ...extra }),
      })
      const payload = await response.json()
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Failed to update subscription')
      }
      toast.success(payload.message || 'Subscription updated')
      await load(page, appliedSearch)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update subscription')
    } finally {
      if (actionName === 'sync') setSyncingId(null)
    }
  }

  const getStatusBadge = (status: string | undefined) => {
    switch (status) {
      case 'active': return <Badge variant="success">Active</Badge>
      case 'free_access': return <Badge variant="secondary">Free Access</Badge>
      case 'invited_free': return <Badge variant="secondary">Invited Free</Badge>
      case 'promo_active': return <Badge variant="warning">Promo Active</Badge>
      case 'admin_override': return <Badge variant="outline">Admin Override</Badge>
      case 'cancelled': return <Badge variant="destructive">Cancelled</Badge>
      case 'expired': return <Badge variant="destructive">Expired</Badge>
      case 'past_due': return <Badge variant="warning">Past Due</Badge>
      case 'unpaid': return <Badge variant="outline">Unpaid</Badge>
      case 'no_subscription': return <Badge variant="outline">No Subscription</Badge>
      case undefined: return <Badge variant="outline">No Subscription</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPaymentBadge = (status: string | null) => {
    if (!status) return <Badge variant="outline">No Payment</Badge>
    if (status === 'finished') return <Badge variant="success">Finished</Badge>
    if (['failed', 'expired', 'refunded'].includes(status)) return <Badge variant="destructive">{status}</Badge>
    return <Badge variant="warning">{status}</Badge>
  }

  const getAccessSourceLabel = (sub: AdminSubscriptionUser['Subscription'], role: string) => {
    if (!sub) return 'No access source'
    const roleLabel = sub.roleBypassAccess || role === 'admin' ? 'Admin access bypass' : null
    const sourceLabel = (() => {
      switch (sub.accessSource) {
        case 'free_access': return sub.FreeAccess?.type === 'lifetime' ? 'Lifetime free access' : 'Free access'
        case 'promo': return sub.PromoCode?.code ? `Promo: ${sub.PromoCode.code}` : 'Promo access'
        case 'manual': return 'Manual paid override'
        case 'paid': return 'Paid subscription'
        default: return 'No access source'
      }
    })()
    return roleLabel ? `${roleLabel} • ${sourceLabel}` : sourceLabel
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Subscriptions</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage user access, periods, and manual admin overrides.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search email..."
                className="pl-9 w-64"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button size="sm" onClick={handleSearch}>Search</Button>
          </div>
        </div>

        <Card className="border-border/60 bg-muted/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Info className="h-4 w-4" />
              How This Works
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm text-muted-foreground md:grid-cols-2 xl:grid-cols-3">
            <div><span className="font-medium text-foreground">Sync</span> re-runs payment reconciliation. It does not grant access by itself.</div>
            <div><span className="font-medium text-foreground">Activate</span> creates or restores standard paid access for regular subscription rows only.</div>
            <div><span className="font-medium text-foreground">Extend</span> adds days to a time-bounded paid/manual subscription.</div>
            <div><span className="font-medium text-foreground">Cancel</span> marks manual paid access as cancelled.</div>
            <div><span className="font-medium text-foreground">Expire</span> ends standard paid access immediately. Admin-role users still keep dashboard access through role bypass.</div>
            <div><span className="font-medium text-foreground">Invoice</span> only opens the provider checkout link. Payment status is separate from access status.</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-20"><Spinner size="lg" /></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="p-3 text-left font-medium text-muted-foreground">User</th>
                      <th className="p-3 text-left font-medium text-muted-foreground">Access Status</th>
                      <th className="p-3 text-left font-medium text-muted-foreground">Payment Status</th>
                      <th className="p-3 text-left font-medium text-muted-foreground">Period End</th>
                      <th className="p-3 text-left font-medium text-muted-foreground">Role / Source</th>
                      <th className="p-3 text-left font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => {
                      const sub = user.Subscription
                      const isLifetime = sub?.FreeAccess?.type === 'lifetime'
                      const currentDays = extensionDays[user.id] || '30'
                      const hasOpenPayment = Boolean(sub?.hasOpenInvoice && sub?.openInvoiceUrl)
                      const isManualPaidSource = sub?.accessSource === 'manual' || sub?.accessSource === 'paid'
                      const canActivate = Boolean(sub && !hasOpenPayment && isManualPaidSource)
                      const canExtend = Boolean(sub && !hasOpenPayment && isManualPaidSource && !isLifetime)
                      const canCancelOrExpire = Boolean(sub && !hasOpenPayment && isManualPaidSource)

                      return (
                        <tr key={user.id} className="border-b border-border/50 hover:bg-muted/5 transition-colors">
                          <td className="p-3">
                            <div className="font-medium">{user.email || user.id}</div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">{user.role}</span>
                              {isLifetime && <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary border-primary/20">LIFETIME</Badge>}
                            </div>
                          </td>
                          <td className="p-3">
                            {getStatusBadge(sub?.displayAccessStatus ?? sub?.status)}
                          </td>
                          <td className="p-3">
                            <div className="flex flex-col gap-1">
                              {getPaymentBadge(sub?.paymentStatus ?? null)}
                              {sub?.isPaymentStale && (
                                <span className="text-[10px] uppercase tracking-wide text-amber-500">Needs sync</span>
                              )}
                            </div>
                          </td>
                          <td className="p-3 text-muted-foreground">
                            {isLifetime ? (
                              <span className="flex items-center gap-1 text-primary font-medium">
                                <Infinity className="h-3 w-3" /> Life Time
                              </span>
                            ) : sub?.currentPeriodEnd ? (
                              new Date(sub.currentPeriodEnd).toLocaleDateString()
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="p-3 text-muted-foreground">
                            <div className="flex flex-col">
                              <span>{getAccessSourceLabel(sub, user.role)}</span>
                              <span className="text-xs text-primary/70">{sub?.FreeAccess?.note || ''}</span>
                              {sub?.latestPaymentPaidAt && (
                                <span className="text-xs">Paid {new Date(sub.latestPaymentPaidAt).toLocaleDateString()}</span>
                              )}
                              {sub?.resolvedAt && !sub.hasOpenInvoice && (
                                <span className="text-xs">Resolved {new Date(sub.resolvedAt).toLocaleDateString()}</span>
                              )}
                              {sub?.hasOpenInvoice && (
                                <span className="text-xs text-amber-500">
                                  Open invoice: {sub.paymentStatus || 'waiting'}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-3">
                            {sub ? (
                              <div className="flex flex-wrap items-center gap-2">
                                <Button size="sm" variant="ghost" onClick={() => action(sub.id, 'sync')} disabled={syncingId === sub.id}>
                                  {syncingId === sub.id ? 'Syncing...' : 'Sync'}
                                </Button>
                                {hasOpenPayment && sub.openInvoiceUrl && (
                                  <Button size="sm" variant="outline" onClick={() => window.open(sub.openInvoiceUrl!, '_blank')}>
                                    Invoice
                                  </Button>
                                )}
                                {canExtend && (
                                  <>
                                    <Input 
                                      className="h-8 w-14 text-center px-1" 
                                      value={currentDays} 
                                      onChange={(e) => setExtensionDays(prev => ({ ...prev, [user.id]: e.target.value }))} 
                                    />
                                    <Button size="sm" variant="outline" onClick={() => action(sub.id, 'extend', { days: currentDays })}>Extend</Button>
                                  </>
                                )}
                                {canActivate && (
                                  <>
                                    <Button size="sm" variant="outline" onClick={() => action(sub.id, 'activate')}>Activate</Button>
                                    {canCancelOrExpire && (
                                      <>
                                        <Button size="sm" variant="outline" onClick={() => action(sub.id, 'cancel')}>Cancel</Button>
                                        <Button size="sm" variant="destructive" onClick={() => action(sub.id, 'expire')}>Expire</Button>
                                      </>
                                    )}
                                  </>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground italic">No active sub record</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                    {users.length === 0 && (
                      <tr><td className="p-8 text-center text-muted-foreground" colSpan={6}>No subscriptions found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {total > limit && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} users
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" disabled={page >= Math.ceil(total / limit)} onClick={() => setPage(p => p + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  )
}
