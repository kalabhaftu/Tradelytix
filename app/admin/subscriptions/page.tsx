'use client'

import { useEffect, useState } from 'react'
import { AdminShell } from '../components/admin-shell'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { Input } from '@/components/ui/input'

type AdminSubscriptionUser = {
  id: string
  email: string | null
  role: string
  Subscription: null | {
    id: string
    status: string
    currentPeriodEnd: string | null
    nextPaymentDue: string | null
    PaymentRecord: Array<{ providerStatus: string | null; amountUsd: number; paidAt: string | null }>
    PromoCode?: { code: string } | null
    FreeAccess?: { note: string | null } | null
  }
}

export default function AdminSubscriptionsPage() {
  const [users, setUsers] = useState<AdminSubscriptionUser[]>([])
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState('30')

  async function load() {
    setLoading(true)
    const response = await fetch('/api/v1/admin/subscriptions')
    const payload = await response.json()
    if (payload.success) setUsers(payload.data)
    setLoading(false)
  }

  async function action(subscriptionId: string, actionName: string, extra?: Record<string, string>) {
    await fetch('/api/v1/admin/subscriptions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscriptionId, action: actionName, ...extra }),
    })
    await load()
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Subscriptions</h1>
          <p className="text-sm text-muted-foreground mt-1">User access, current periods, due dates, and manual admin actions.</p>
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-20"><Spinner size="lg" /></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="p-3 text-left">User</th>
                      <th className="p-3 text-left">Status</th>
                      <th className="p-3 text-left">Period End</th>
                      <th className="p-3 text-left">Last Payment</th>
                      <th className="p-3 text-left">Source</th>
                      <th className="p-3 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => {
                      const sub = user.Subscription
                      return (
                        <tr key={user.id} className="border-b border-border/50">
                          <td className="p-3">
                            <div className="font-medium">{user.email || user.id}</div>
                            <div className="text-xs text-muted-foreground">{user.role}</div>
                          </td>
                          <td className="p-3">
                            <Badge variant={sub?.status === 'active' ? 'success' : sub ? 'warning' : 'outline'}>
                              {sub?.status || 'no_subscription'}
                            </Badge>
                          </td>
                          <td className="p-3 text-muted-foreground">
                            {sub?.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString() : '—'}
                          </td>
                          <td className="p-3 text-muted-foreground">
                            {sub?.PaymentRecord?.[0]?.paidAt ? new Date(sub.PaymentRecord[0].paidAt).toLocaleDateString() : sub?.PaymentRecord?.[0]?.providerStatus || '—'}
                          </td>
                          <td className="p-3 text-muted-foreground">
                            {sub?.PromoCode?.code || sub?.FreeAccess?.note || '—'}
                          </td>
                          <td className="p-3">
                            {sub ? (
                              <div className="flex flex-wrap items-center gap-2">
                                <Input className="h-8 w-16" value={days} onChange={(event) => setDays(event.target.value)} />
                                <Button size="sm" variant="outline" onClick={() => action(sub.id, 'extend', { days })}>Extend</Button>
                                <Button size="sm" variant="outline" onClick={() => action(sub.id, 'activate')}>Activate</Button>
                                <Button size="sm" variant="outline" onClick={() => action(sub.id, 'cancel')}>Cancel</Button>
                                <Button size="sm" variant="destructive" onClick={() => action(sub.id, 'expire')}>Expire</Button>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">Create access from Free Access</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                    {users.length === 0 && (
                      <tr><td className="p-8 text-center text-muted-foreground" colSpan={6}>No users found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  )
}
