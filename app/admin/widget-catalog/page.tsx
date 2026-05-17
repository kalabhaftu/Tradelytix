'use client'

import { useEffect, useState } from 'react'
import { AdminPageHeader, AdminShell } from '../components/admin-shell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Spinner } from '@/components/ui/spinner'
import { SlidersHorizontal } from 'lucide-react'
import { toast } from 'sonner'

export default function AdminWidgetCatalogPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    fetch('/api/v1/admin/widget-catalog')
      .then((response) => response.json())
      .then((payload) => payload.success && setItems(payload.data))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const update = async (item: any, patch: Record<string, unknown>) => {
    setSaving(item.widgetType)
    const next = { ...item, ...patch }
    setItems((current) => current.map((row) => row.widgetType === item.widgetType ? next : row))
    try {
      const response = await fetch('/api/v1/admin/widget-catalog', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ widgetType: item.widgetType, ...patch }),
      })
      const payload = await response.json()
      if (!response.ok || !payload.success) throw new Error(payload.error || 'Failed to update widget')
      toast.success('Widget catalog updated')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update widget')
      load()
    } finally {
      setSaving(null)
    }
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        <AdminPageHeader
          title="Widget Catalog"
          description="Control what appears in the dashboard widget library."
          hint="Visible controls whether users can add the widget. Recommended boosts it in the picker. Premium marks widgets that should require paid access."
        />

        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : (
          <section className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="flex items-center gap-2 border-b border-border px-5 py-4">
              <SlidersHorizontal className="h-4 w-4" />
              <h2 className="text-sm font-semibold">Catalog Controls</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30 text-left">
                    {['Widget', 'Label', 'Status', 'Visible', 'Recommended', 'Premium', ''].map((heading) => (
                      <th key={heading} className="px-5 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">{heading}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.widgetType} className="border-b border-border/70 last:border-0">
                      <td className="px-5 py-3">
                        <p className="font-mono text-xs font-bold">{item.widgetType}</p>
                        <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{item.description || 'No description override'}</p>
                      </td>
                      <td className="px-5 py-3">
                        <Input value={item.label || ''} onChange={(event) => setItems((current) => current.map((row) => row.widgetType === item.widgetType ? { ...row, label: event.target.value } : row))} onBlur={() => update(item, { label: item.label || null })} className="h-8 min-w-[180px]" />
                      </td>
                      <td className="px-5 py-3"><Badge variant={item.deprecated ? 'secondary' : item.status === 'review' ? 'outline' : 'default'}>{item.status}</Badge></td>
                      <td className="px-5 py-3"><Switch checked={item.visible} disabled={saving === item.widgetType} onCheckedChange={(visible) => update(item, { visible })} /></td>
                      <td className="px-5 py-3"><Switch checked={item.recommended} disabled={saving === item.widgetType} onCheckedChange={(recommended) => update(item, { recommended })} /></td>
                      <td className="px-5 py-3"><Switch checked={item.premiumOnly} disabled={saving === item.widgetType} onCheckedChange={(premiumOnly) => update(item, { premiumOnly })} /></td>
                      <td className="px-5 py-3 text-right">
                        <Button size="sm" variant="outline" disabled={saving === item.widgetType} onClick={() => update(item, { deprecated: !item.deprecated })}>
                          {item.deprecated ? 'Restore' : 'Deprecate'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </AdminShell>
  )
}
