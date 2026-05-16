'use client'

import { useEffect, useState } from 'react'
import { AdminShell } from '../components/admin-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Spinner } from '@/components/ui/spinner'
import { Share2 } from 'lucide-react'
import { toast } from 'sonner'

export default function AdminSharingGovernancePage() {
  const [policy, setPolicy] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/v1/admin/control-plane?type=sharing')
      .then((response) => response.json())
      .then((payload) => payload.success && setPolicy(payload.data))
      .finally(() => setLoading(false))
  }, [])

  const save = async () => {
    const response = await fetch('/api/v1/admin/control-plane', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'sharing', ...policy }),
    })
    const payload = await response.json()
    if (!response.ok || !payload.success) toast.error(payload.error || 'Failed to save sharing policy')
    else {
      setPolicy(payload.data)
      toast.success('Sharing policy saved')
    }
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sharing Governance</h1>
          <p className="mt-1 text-sm text-muted-foreground">Control default behavior for public statement and report sharing.</p>
        </div>
        {loading ? <div className="flex justify-center py-20"><Spinner size="lg" /></div> : (
          <section className="max-w-3xl rounded-xl border border-border bg-card">
            <div className="flex items-center gap-2 border-b border-border px-5 py-4">
              <Share2 className="h-4 w-4" />
              <h2 className="text-sm font-semibold">Default Sharing Policy</h2>
            </div>
            <div className="space-y-5 p-5">
              <label className="flex items-center justify-between gap-4">
                <span>
                  <span className="block text-sm font-semibold">Public sharing enabled</span>
                  <span className="text-xs text-muted-foreground">Allows users to create public shared reports.</span>
                </span>
                <Switch checked={policy?.publicSharingEnabled ?? true} onCheckedChange={(publicSharingEnabled) => setPolicy((current: any) => ({ ...current, publicSharingEnabled }))} />
              </label>
              <label className="flex items-center justify-between gap-4">
                <span>
                  <span className="block text-sm font-semibold">Require expiration</span>
                  <span className="text-xs text-muted-foreground">Forces shared reports to expire by policy.</span>
                </span>
                <Switch checked={policy?.requireExpiration ?? false} onCheckedChange={(requireExpiration) => setPolicy((current: any) => ({ ...current, requireExpiration }))} />
              </label>
              <div>
                <label className="text-sm font-semibold">Default expiration days</label>
                <Input className="mt-2 max-w-xs" type="number" min={1} value={policy?.defaultExpirationDays ?? ''} onChange={(event) => setPolicy((current: any) => ({ ...current, defaultExpirationDays: event.target.value }))} placeholder="Never" />
              </div>
              <Button onClick={save}>Save Policy</Button>
            </div>
          </section>
        )}
      </div>
    </AdminShell>
  )
}
