'use client'

import { useEffect, useState } from 'react'
import { AdminShell } from '../components/admin-shell'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

type FreeAccessInvite = {
  id: string
  email: string
  type: string
  expiresAt: string | null
  note: string | null
  isActive: boolean
  registeredAt: string | null
  grantedAt: string
}

export default function AdminFreeAccessPage() {
  const [invites, setInvites] = useState<FreeAccessInvite[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ email: '', type: 'until_date', expiresAt: '', note: '' })

  async function load() {
    setLoading(true)
    try {
      const response = await fetch('/api/v1/admin/free-access')
      const payload = await response.json()
      if (!response.ok || !payload.success) throw new Error(payload.error || 'Failed to load free access invites')
      setInvites(payload.data)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load free access invites')
    } finally {
      setLoading(false)
    }
  }

  async function grant() {
    setSaving(true)
    try {
      const response = await fetch('/api/v1/admin/free-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, expiresAt: form.expiresAt || null, note: form.note || null }),
      })
      const payload = await response.json()
      if (!response.ok || !payload.success) throw new Error(payload.error || 'Failed to grant free access')

      setForm({ email: '', type: 'until_date', expiresAt: '', note: '' })
      toast.success('Free access granted')
      await load()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to grant free access')
    } finally {
      setSaving(false)
    }
  }

  async function revoke(email: string) {
    try {
      const response = await fetch('/api/v1/admin/free-access', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, action: 'revoke' }),
      })
      const payload = await response.json()
      if (!response.ok || !payload.success) throw new Error(payload.error || 'Failed to revoke free access')
      toast.success('Free access revoked')
      await load()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to revoke free access')
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Free Access</h1>
          <p className="text-sm text-muted-foreground mt-1">Grant invitation or admin-managed free access by email.</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-3 md:grid-cols-5">
              <Input placeholder="Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value.toLowerCase() })} />
              <Select value={form.type} onValueChange={(type) => setForm({ ...form, type })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="until_date">Until Date</SelectItem>
                  <SelectItem value="lifetime">Lifetime</SelectItem>
                  <SelectItem value="one_time_signup">One-Time Signup</SelectItem>
                </SelectContent>
              </Select>
              <Input type="date" value={form.expiresAt} disabled={form.type !== 'until_date'} onChange={(event) => setForm({ ...form, expiresAt: event.target.value })} />
              <Input placeholder="Note" value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} />
              <Button onClick={grant} disabled={saving || !form.email || (form.type === 'until_date' && !form.expiresAt)}>{saving ? 'Granting...' : 'Grant'}</Button>
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
                      <th className="p-3 text-left">Email</th>
                      <th className="p-3 text-left">Type</th>
                      <th className="p-3 text-left">Expires</th>
                      <th className="p-3 text-left">Registered</th>
                      <th className="p-3 text-left">Status</th>
                      <th className="p-3 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invites.map((invite) => (
                      <tr key={invite.id} className="border-b border-border/50">
                        <td className="p-3 font-medium">{invite.email}</td>
                        <td className="p-3">{invite.type}</td>
                        <td className="p-3 text-muted-foreground">{invite.expiresAt ? new Date(invite.expiresAt).toLocaleDateString() : '—'}</td>
                        <td className="p-3 text-muted-foreground">{invite.registeredAt ? new Date(invite.registeredAt).toLocaleDateString() : 'not yet'}</td>
                        <td className="p-3"><Badge variant={invite.isActive ? 'success' : 'outline'}>{invite.isActive ? 'active' : 'revoked'}</Badge></td>
                        <td className="p-3">
                          {invite.isActive ? (
                            <Button size="sm" variant="destructive" onClick={() => revoke(invite.email)}>Revoke</Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {invites.length === 0 && (
                      <tr><td className="p-8 text-center text-muted-foreground" colSpan={6}>No free access invites found</td></tr>
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
