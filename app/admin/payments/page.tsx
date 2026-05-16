'use client'

import { useEffect, useState, useCallback } from 'react'
import { AdminShell } from '../components/admin-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Input } from '@/components/ui/input'
import { Search, ChevronLeft, ChevronRight, ExternalLink, Info } from 'lucide-react'
import { toast } from 'sonner'

type AdminPayment = {
  id: string
  amountUsd: number
  providerStatus: string | null
  providerInvoiceId: string | null
  providerPaymentId: string | null
  invoiceUrl: string | null
  paidAt: string | null
  createdAt: string
  updatedAt: string
  resolvedAt: string | null
  accessStatus: string
  isPending: boolean
  isTerminal: boolean
  isStale: boolean
  userEmail: string | null
  promoCode: string | null
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<AdminPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [syncingId, setSyncingId] = useState<string | null>(null)
  const [syncingUser, setSyncingUser] = useState(false)
  const limit = 25

  const load = useCallback(async (nextPage: number, nextSearch: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/v1/admin/payments?page=${nextPage}&limit=${limit}&search=${encodeURIComponent(nextSearch)}`)
      const payload = await response.json()
      if (payload.success) {
        setPayments(payload.data)
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

  const getAccessBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge variant="success">Active</Badge>
      case 'cancelled': return <Badge variant="destructive">Cancelled</Badge>
      case 'expired': return <Badge variant="destructive">Expired</Badge>
      case 'unpaid': return <Badge variant="outline">Unpaid</Badge>
      case 'past_due': return <Badge variant="warning">Past Due</Badge>
      default: return <Badge variant="outline">{status || 'Unknown'}</Badge>
    }
  }

  const syncPayment = async (paymentRecordId: string) => {
    setSyncingId(paymentRecordId)
    try {
      const response = await fetch('/api/v1/admin/payments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync_payment', paymentRecordId }),
      })
      const payload = await response.json()
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Failed to sync payment')
      }
      toast.success('Payment status synced')
      await load(page, appliedSearch)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to sync payment')
    } finally {
      setSyncingId(null)
    }
  }

  const syncUserPayments = async () => {
    if (!appliedSearch.trim()) return
    setSyncingUser(true)
    try {
      const response = await fetch('/api/v1/admin/payments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync_user', email: appliedSearch.trim() }),
      })
      const payload = await response.json()
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Failed to sync user payments')
      }
      toast.success('User payments synced')
      await load(page, appliedSearch)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to sync user payments')
    } finally {
      setSyncingUser(false)
    }
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Payments</h1>
            <p className="text-sm text-muted-foreground mt-1">Provider invoice statuses and customer payment history.</p>
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
            <Button size="sm" variant="outline" onClick={syncUserPayments} disabled={!appliedSearch.trim() || syncingUser}>
              {syncingUser ? 'Syncing...' : 'Sync User'}
            </Button>
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
            <div><span className="font-medium text-foreground">Payment Status</span> mirrors NOWPayments state such as waiting, finished, failed, or expired.</div>
            <div><span className="font-medium text-foreground">Access Status</span> is the current subscription state, which can differ from payment history.</div>
            <div><span className="font-medium text-foreground">Sync</span> refreshes provider status for a record or an email search result.</div>
            <div><span className="font-medium text-foreground">Invoice</span> opens the provider checkout page only. It does not change status.</div>
            <div><span className="font-medium text-foreground">Resolved</span> shows when a payment became paid or terminal.</div>
            <div><span className="font-medium text-foreground">Needs sync</span> marks a pending invoice that has been open long enough to verify again.</div>
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
                      <th className="p-3 text-left font-medium text-muted-foreground">Payment Status</th>
                      <th className="p-3 text-left font-medium text-muted-foreground">Access Status</th>
                      <th className="p-3 text-left font-medium text-muted-foreground">Amount</th>
                      <th className="p-3 text-left font-medium text-muted-foreground">Created</th>
                      <th className="p-3 text-left font-medium text-muted-foreground">Resolved</th>
                      <th className="p-3 text-left font-medium text-muted-foreground">Invoice</th>
                      <th className="p-3 text-left font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => {
                      return (
                        <tr key={payment.id} className="border-b border-border/50 hover:bg-muted/5 transition-colors">
                          <td className="p-3">
                            <div className="font-medium">{payment.userEmail || '—'}</div>
                            <div className="text-[10px] text-muted-foreground uppercase tracking-tight">
                              ID: {payment.id.slice(-8)}
                            </div>
                          </td>
                          <td className="p-3">
                            <Badge 
                              variant={payment.providerStatus === 'finished' ? 'success' : ['failed', 'expired', 'refunded'].includes(payment.providerStatus || '') ? 'destructive' : 'warning'}
                              className="text-[10px] font-bold"
                            >
                              {payment.providerStatus?.toUpperCase() || 'PENDING'}
                            </Badge>
                            {payment.isStale && (
                              <div className="mt-1 text-[10px] uppercase text-amber-500 font-medium">Needs sync</div>
                            )}
                          </td>
                          <td className="p-3">
                            {getAccessBadge(payment.accessStatus)}
                          </td>
                          <td className="p-3">
                            <div className="font-bold text-sm">${payment.amountUsd.toFixed(2)}</div>
                            {payment.paidAt && (
                              <div className="text-[10px] text-muted-foreground">Paid {new Date(payment.paidAt).toLocaleDateString()}</div>
                            )}
                            {payment.promoCode && (
                              <Badge variant="outline" className="mt-2 text-[10px] text-primary border-primary/30 bg-primary/5">
                                {payment.promoCode}
                              </Badge>
                            )}
                          </td>
                          <td className="p-3 text-muted-foreground text-xs">
                            {new Date(payment.createdAt).toLocaleDateString()}<br/>
                            {new Date(payment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="p-3 text-muted-foreground text-xs">
                            {payment.resolvedAt ? (
                              <>
                                {new Date(payment.resolvedAt).toLocaleDateString()}<br/>
                                {new Date(payment.resolvedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="p-3 text-right">
                            {payment.invoiceUrl ? (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-8 gap-2 px-3" 
                                onClick={() => window.open(payment.invoiceUrl!, '_blank')}
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                                <span className="text-xs">Invoice</span>
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="p-3">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => syncPayment(payment.id)}
                              disabled={syncingId === payment.id}
                            >
                              {syncingId === payment.id ? 'Syncing...' : 'Sync'}
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                    {payments.length === 0 && (
                      <tr><td className="p-8 text-center text-muted-foreground" colSpan={8}>No payments found</td></tr>
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
              Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} records
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
