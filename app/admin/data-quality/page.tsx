'use client'

import { useEffect, useState } from 'react'
import { AdminShell } from '../components/admin-shell'
import { Progress } from '@/components/ui/progress'
import { Spinner } from '@/components/ui/spinner'
import { AlertTriangle, DatabaseZap } from 'lucide-react'

function CoverageRow({ label, value }: { label: string; value: { count: number; percentage: number } }) {
  return (
    <div className="grid gap-3 border-b border-border/50 px-5 py-4 last:border-0 md:grid-cols-[180px_minmax(0,1fr)_80px] md:items-center">
      <p className="text-sm font-semibold">{label}</p>
      <Progress value={value.percentage} />
      <p className="text-right font-mono text-sm font-black">{value.percentage}%</p>
    </div>
  )
}

export default function AdminDataQualityPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/v1/admin/data-quality')
      .then((response) => response.json())
      .then((payload) => payload.success && setData(payload.data))
      .finally(() => setLoading(false))
  }, [])

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Data Quality</h1>
          <p className="mt-1 text-sm text-muted-foreground">Coverage and health checks for advanced analytics readiness.</p>
        </div>
        {loading ? <div className="flex justify-center py-20"><Spinner size="lg" /></div> : (
          <>
            <section className="overflow-hidden rounded-xl border border-border bg-card">
              <div className="flex items-center gap-2 border-b border-border px-5 py-4">
                <DatabaseZap className="h-4 w-4" />
                <h2 className="text-sm font-semibold">Analytics Coverage</h2>
                <span className="ml-auto font-mono text-xs font-bold text-muted-foreground">{data?.totalTrades || 0} trades</span>
              </div>
              <CoverageRow label="Stop Loss / R Data" value={data?.stopLossCoverage || { count: 0, percentage: 0 }} />
              <CoverageRow label="MAE / MFE Data" value={data?.excursionCoverage || { count: 0, percentage: 0 }} />
              <CoverageRow label="Tags" value={data?.tagCoverage || { count: 0, percentage: 0 }} />
              <CoverageRow label="Playbooks" value={data?.playbookCoverage || { count: 0, percentage: 0 }} />
            </section>
            <section className="grid gap-4 md:grid-cols-3">
              {[
                ['Broken Rule Trades', data?.brokenRules || 0],
                ['Malformed Trades', data?.malformedTrades || 0],
                ['Failed / Cancelled Imports', data?.staleImports || 0],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-border bg-card px-5 py-4">
                  <div className="flex items-center gap-2 text-muted-foreground"><AlertTriangle className="h-4 w-4" /><span className="text-[10px] font-black uppercase tracking-widest">{label}</span></div>
                  <p className="mt-3 font-mono text-3xl font-black">{Number(value).toLocaleString()}</p>
                </div>
              ))}
            </section>
          </>
        )}
      </div>
    </AdminShell>
  )
}
