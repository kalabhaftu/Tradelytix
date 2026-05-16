'use client'

import { useEffect, useState, useCallback } from 'react'
import { AdminShell } from '../components/admin-shell'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronLeft, ChevronRight, ChevronDown, Trash2, Download } from 'lucide-react'
import { toast } from 'sonner'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

const levelColors: Record<string, string> = {
  WARNING: 'bg-yellow-500/10 text-yellow-500',
  ERROR: 'bg-red-500/10 text-red-500',
  CRITICAL: 'bg-red-600/10 text-red-600 font-bold',
}

export default function AdminErrorsPage() {
  const [errors, setErrors] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [sourceFilter, setSourceFilter] = useState('all')
  const [levelFilter, setLevelFilter] = useState('all')
  const [exporting, setExporting] = useState(false)
  const limit = 30

  const fetchErrors = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (sourceFilter !== 'all') params.set('source', sourceFilter)
    if (levelFilter !== 'all') params.set('level', levelFilter)

    fetch(`/api/v1/admin/errors?${params}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setErrors(data.data.errors)
          setTotal(data.data.total)
        }
      })
      .finally(() => setLoading(false))
  }, [page, sourceFilter, levelFilter])

  useEffect(() => { fetchErrors() }, [fetchErrors])

  const handleCleanup = async (days: number | 'all') => {
    const isAll = days === 'all'
    if (isAll && !confirm('Are you sure you want to clear ALL error logs? This cannot be undone.')) return

    const params = isAll ? 'all=true&confirm=DELETE_ALL_ERROR_LOGS' : `olderThan=${days}`
    const res = await fetch(`/api/v1/admin/errors?${params}`, { method: 'DELETE' })
    const data = await res.json()
    if (data.success) {
      toast.success(isAll ? `Cleared all ${data.deleted} entries` : `Cleaned up ${data.deleted} old entries`)
      fetchErrors()
    } else {
      toast.error(data.error || 'Failed to clean up error logs')
    }
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const res = await fetch('/api/v1/admin/errors?export=true')
      const data = await res.json()
      if (data.success) {
        const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `error-logs-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success('Logs exported successfully')
      }
    } catch (err) {
      toast.error('Failed to export logs')
    } finally {
      setExporting(false)
    }
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Error Logs</h1>
            <p className="text-muted-foreground text-sm mt-1">{total} entries</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={sourceFilter} onValueChange={v => { setSourceFilter(v); setPage(1) }}>
              <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="CLIENT">Client</SelectItem>
                <SelectItem value="SERVER">Server</SelectItem>
                <SelectItem value="API">API</SelectItem>
              </SelectContent>
            </Select>
            <Select value={levelFilter} onValueChange={v => { setLevelFilter(v); setPage(1) }}>
              <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="WARNING">Warning</SelectItem>
                <SelectItem value="ERROR">Error</SelectItem>
                <SelectItem value="CRITICAL">Critical</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="text-xs h-8" onClick={handleExport} disabled={exporting}>
              <Download className="h-3.5 w-3.5 mr-1" />
              {exporting ? 'Exporting...' : 'Export JSON'}
            </Button>
            <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => handleCleanup(30)}>
              <Trash2 className="h-3.5 w-3.5 mr-1" />30d+
            </Button>
            <Button variant="destructive" size="sm" className="text-xs h-8" onClick={() => handleCleanup('all')}>
              <Trash2 className="h-3.5 w-3.5 mr-1" />Clear All
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>
        ) : errors.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">No errors logged</CardContent></Card>
        ) : (
          <div className="space-y-2">
            {errors.map(err => (
              <Collapsible key={err.id}>
                <Card>
                  <CollapsibleTrigger asChild>
                    <CardContent className="p-3 cursor-pointer hover:bg-muted/20 flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <Badge className={`text-[10px] shrink-0 ${levelColors[err.level] || ''}`}>
                          {err.level}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] shrink-0">{err.source}</Badge>
                        <p className="text-sm truncate">{err.message}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(err.createdAt).toLocaleString()}
                        </span>
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-3 pb-3 space-y-2">
                      {err.url && <p className="text-xs text-muted-foreground">URL: {err.url}</p>}
                      {err.userId && <p className="text-xs text-muted-foreground">User: {err.userId}</p>}
                      {err.stack && (
                        <pre className="text-[10px] bg-muted/50 p-2 rounded overflow-x-auto max-h-40 whitespace-pre-wrap">
                          {err.stack}
                        </pre>
                      )}
                      {err.metadata && (
                        <pre className="text-[10px] bg-muted/50 p-2 rounded overflow-x-auto max-h-20">
                          {JSON.stringify(err.metadata, null, 2)}
                        </pre>
                      )}
                    </div>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Page {page} of {Math.ceil(total / limit) || 1}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" disabled={page >= Math.ceil(total / limit)} onClick={() => setPage(p => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </AdminShell>
  )
}
