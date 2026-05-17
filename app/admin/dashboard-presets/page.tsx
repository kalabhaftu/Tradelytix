'use client'

import { useEffect, useState } from 'react'
import { AdminPageHeader, AdminShell } from '../components/admin-shell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { LayoutTemplate } from 'lucide-react'
import { toast } from 'sonner'

export default function AdminDashboardPresetsPage() {
  const [presets, setPresets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')

  const load = () => {
    fetch('/api/v1/admin/control-plane?type=presets')
      .then((response) => response.json())
      .then((payload) => payload.success && setPresets(payload.data))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const createPreset = async () => {
    if (!name.trim()) return
    const response = await fetch('/api/v1/admin/control-plane', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), description: 'Admin curated dashboard preset', recommended: true }),
    })
    const payload = await response.json()
    if (!response.ok || !payload.success) toast.error(payload.error || 'Failed to create preset')
    else {
      toast.success('Preset created')
      setName('')
      load()
    }
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        <AdminPageHeader
          title="Dashboard Presets"
          description="Curate product-owned starter layouts without touching user-owned templates."
          hint="Use presets for curated layouts users can choose from. This does not rewrite existing user templates."
        />
        <section className="rounded-xl border border-border bg-card p-5">
          <div className="flex flex-col gap-3 md:flex-row">
            <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Preset name" />
            <Button onClick={createPreset} className="gap-2"><LayoutTemplate className="h-4 w-4" /> Create Preset</Button>
          </div>
        </section>
        {loading ? <div className="flex justify-center py-20"><Spinner size="lg" /></div> : (
          <section className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="divide-y divide-border">
              {presets.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-muted-foreground">No admin presets yet.</p>
              ) : presets.map((preset) => (
                <div key={preset.id} className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-semibold">{preset.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{preset.description || 'No description'} / {Array.isArray(preset.layout) ? preset.layout.length : 0} widgets</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={preset.active ? 'default' : 'secondary'}>{preset.active ? 'Active' : 'Inactive'}</Badge>
                    {preset.recommended && <Badge variant="outline">Recommended</Badge>}
                    <Badge variant="outline">{preset.segment}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </AdminShell>
  )
}
