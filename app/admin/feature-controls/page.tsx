'use client'

import { useEffect, useState } from 'react'
import { AdminPageHeader, AdminShell } from '../components/admin-shell'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Spinner } from '@/components/ui/spinner'
import { ToggleLeft } from 'lucide-react'
import { toast } from 'sonner'

export default function AdminFeatureControlsPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/v1/admin/control-plane?type=features')
      .then((response) => response.json())
      .then((payload) => payload.success && setItems(payload.data))
      .finally(() => setLoading(false))
  }, [])

  const update = async (item: any, patch: Record<string, unknown>) => {
    const next = { ...item, ...patch }
    setItems((current) => current.map((row) => row.key === item.key ? next : row))
    const response = await fetch('/api/v1/admin/control-plane', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(next),
    })
    const payload = await response.json()
    if (!response.ok || !payload.success) toast.error(payload.error || 'Failed to update feature')
    else toast.success('Feature controls updated')
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        <AdminPageHeader
          title="Feature Controls"
          description="Manage platform-level feature visibility and rollout state."
          hint="Use these switches for guarded features only. Internal hides a feature from normal users; Enabled controls whether it is active at all."
        />
        {loading ? <div className="flex justify-center py-20"><Spinner size="lg" /></div> : (
          <section className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="flex items-center gap-2 border-b border-border px-5 py-4">
              <ToggleLeft className="h-4 w-4" />
              <h2 className="text-sm font-semibold">Rollout Flags</h2>
            </div>
            <div className="divide-y divide-border">
              {items.map((item) => (
                <div key={item.key} className="grid gap-4 px-5 py-4 md:grid-cols-[minmax(0,1fr)_120px_120px] md:items-center">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{item.label}</p>
                      <Badge variant="outline" className="font-mono text-[10px]">{item.key}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{item.description || 'No description'}</p>
                  </div>
                  <label className="flex items-center justify-between gap-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Enabled <Switch checked={item.enabled} onCheckedChange={(enabled) => update(item, { enabled })} />
                  </label>
                  <label className="flex items-center justify-between gap-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Internal <Switch checked={item.internalOnly} onCheckedChange={(internalOnly) => update(item, { internalOnly })} />
                  </label>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </AdminShell>
  )
}
