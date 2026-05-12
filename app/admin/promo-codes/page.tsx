'use client'

import { useEffect, useState } from 'react'
import { AdminShell } from '../components/admin-shell'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type PromoCode = {
  id: string
  code: string
  type: string
  applicability: string
  value: number
  maxUses: number | null
  usesCount: number
  validUntil: string | null
  isActive: boolean
}

export default function AdminPromoCodesPage() {
  const [codes, setCodes] = useState<PromoCode[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ code: '', type: 'percentage_discount', applicability: 'signup_only', value: '', maxUses: '', validUntil: '' })

  async function load() {
    setLoading(true)
    const response = await fetch('/api/v1/admin/promo-codes')
    const payload = await response.json()
    if (payload.success) setCodes(payload.data)
    setLoading(false)
  }

  async function createPromo() {
    await fetch('/api/v1/admin/promo-codes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setForm({ code: '', type: 'percentage_discount', applicability: 'signup_only', value: '', maxUses: '', validUntil: '' })
    await load()
  }

  async function togglePromo(id: string, isActive: boolean) {
    await fetch('/api/v1/admin/promo-codes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, isActive }),
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
          <h1 className="text-2xl font-bold tracking-tight">Promo Codes</h1>
          <p className="text-sm text-muted-foreground mt-1">Create and disable signup or renewal promo codes.</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-3 md:grid-cols-6">
              <Input placeholder="Code" value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value.toUpperCase() })} />
              <Select value={form.type} onValueChange={(type) => setForm({ ...form, type })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage_discount">Percent</SelectItem>
                  <SelectItem value="fixed_discount">Fixed</SelectItem>
                  <SelectItem value="free_months">Free Months</SelectItem>
                  <SelectItem value="lifetime_free">Lifetime</SelectItem>
                </SelectContent>
              </Select>
              <Select value={form.applicability} onValueChange={(applicability) => setForm({ ...form, applicability })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="signup_only">Signup</SelectItem>
                  <SelectItem value="renewal_only">Renewal</SelectItem>
                  <SelectItem value="any">Any</SelectItem>
                </SelectContent>
              </Select>
              <Input placeholder="Value" value={form.value} onChange={(event) => setForm({ ...form, value: event.target.value })} />
              <Input placeholder="Max uses" value={form.maxUses} onChange={(event) => setForm({ ...form, maxUses: event.target.value })} />
              <Button onClick={createPromo} disabled={!form.code || !form.value}>Create</Button>
            </div>
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
                      <th className="p-3 text-left">Code</th>
                      <th className="p-3 text-left">Type</th>
                      <th className="p-3 text-left">Applies</th>
                      <th className="p-3 text-left">Uses</th>
                      <th className="p-3 text-left">Status</th>
                      <th className="p-3 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {codes.map((code) => (
                      <tr key={code.id} className="border-b border-border/50">
                        <td className="p-3 font-mono">{code.code}</td>
                        <td className="p-3">{code.type} ({code.value})</td>
                        <td className="p-3">{code.applicability}</td>
                        <td className="p-3">{code.usesCount}/{code.maxUses ?? '∞'}</td>
                        <td className="p-3"><Badge variant={code.isActive ? 'success' : 'outline'}>{code.isActive ? 'active' : 'inactive'}</Badge></td>
                        <td className="p-3">
                          <Button size="sm" variant="outline" onClick={() => togglePromo(code.id, !code.isActive)}>
                            {code.isActive ? 'Disable' : 'Enable'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {codes.length === 0 && (
                      <tr><td className="p-8 text-center text-muted-foreground" colSpan={6}>No promo codes found</td></tr>
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
