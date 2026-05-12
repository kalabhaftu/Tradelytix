'use client'

import { useEffect, useState } from 'react'
import { AdminShell } from '../components/admin-shell'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'

type AdminPayment = {
  id: string
  amountUsd: number
  providerStatus: string | null
  providerInvoiceId: string | null
  providerPaymentId: string | null
  invoiceUrl: string | null
  paidAt: string | null
  createdAt: string
  Subscription: { User: { email: string | null } }
  PromoCode?: { code: string } | null
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<AdminPayment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/v1/admin/payments')
      .then((response) => response.json())
      .then((payload) => {
        if (payload.success) setPayments(payload.data)
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payments</h1>
          <p className="text-sm text-muted-foreground mt-1">NOWPayments invoices, provider statuses, and payment history.</p>
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
                      <th className="p-3 text-left">Amount</th>
                      <th className="p-3 text-left">Invoice</th>
                      <th className="p-3 text-left">Payment</th>
                      <th className="p-3 text-left">Created</th>
                      <th className="p-3 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => (
                      <tr key={payment.id} className="border-b border-border/50">
                        <td className="p-3">{payment.Subscription.User.email || '—'}</td>
                        <td className="p-3">
                          <Badge variant={payment.providerStatus === 'finished' ? 'success' : ['failed', 'expired', 'refunded'].includes(payment.providerStatus || '') ? 'destructive' : 'warning'}>
                            {payment.providerStatus || 'pending'}
                          </Badge>
                        </td>
                        <td className="p-3">${payment.amountUsd.toFixed(2)}</td>
                        <td className="p-3 font-mono text-xs">{payment.providerInvoiceId || '—'}</td>
                        <td className="p-3 font-mono text-xs">{payment.providerPaymentId || '—'}</td>
                        <td className="p-3 text-muted-foreground">{new Date(payment.createdAt).toLocaleString()}</td>
                        <td className="p-3">
                          {payment.invoiceUrl ? (
                            <Button size="sm" variant="outline" onClick={() => window.open(payment.invoiceUrl!, '_blank')}>Open</Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {payments.length === 0 && (
                      <tr><td className="p-8 text-center text-muted-foreground" colSpan={7}>No payments found</td></tr>
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
