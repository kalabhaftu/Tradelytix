'use client'

import { useEffect, useState } from 'react'
import { AdminShell } from '../components/admin-shell'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { Tags } from 'lucide-react'

export default function AdminTaxonomyPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/v1/admin/taxonomy')
      .then((response) => response.json())
      .then((payload) => payload.success && setData(payload.data))
      .finally(() => setLoading(false))
  }, [])

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Taxonomy</h1>
          <p className="mt-1 text-sm text-muted-foreground">Review tag and playbook consistency across the platform.</p>
        </div>
        {loading ? <div className="flex justify-center py-20"><Spinner size="lg" /></div> : (
          <div className="grid gap-6 lg:grid-cols-2">
            <section className="overflow-hidden rounded-xl border border-border bg-card">
              <div className="flex items-center gap-2 border-b border-border px-5 py-4">
                <Tags className="h-4 w-4" />
                <h2 className="text-sm font-semibold">Tags</h2>
                <Badge variant="outline" className="ml-auto">{data?.tags?.length || 0}</Badge>
              </div>
              <div className="max-h-[520px] overflow-auto divide-y divide-border">
                {(data?.tags || []).map((tag: any) => (
                  <div key={tag.id} className="flex items-center justify-between gap-4 px-5 py-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: tag.color }} />
                      <span className="truncate text-sm font-semibold">{tag.name}</span>
                    </div>
                    <span className="font-mono text-[10px] text-muted-foreground">{tag.userId.slice(0, 8)}</span>
                  </div>
                ))}
              </div>
            </section>
            <section className="overflow-hidden rounded-xl border border-border bg-card">
              <div className="flex items-center gap-2 border-b border-border px-5 py-4">
                <h2 className="text-sm font-semibold">Playbooks</h2>
                <Badge variant="outline" className="ml-auto">{data?.models?.length || 0}</Badge>
              </div>
              <div className="max-h-[520px] overflow-auto divide-y divide-border">
                {(data?.models || []).map((model: any) => (
                  <div key={model.id} className="px-5 py-3">
                    <p className="truncate text-sm font-semibold">{model.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{Array.isArray(model.rules) ? model.rules.length : 0} rules / {Array.isArray(model.setups) ? model.setups.length : 0} setups</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </AdminShell>
  )
}
