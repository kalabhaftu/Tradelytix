'use client'

import { useEffect, useState, useCallback } from 'react'
import { AdminShell } from '../components/admin-shell'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function AdminActivityPage() {
  const [activity, setActivity] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const limit = 50

  const fetchActivity = useCallback(() => {
    setLoading(true)
    fetch(`/api/v1/admin/activity?page=${page}&limit=${limit}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setActivity(data.data.activity)
          setTotal(data.data.total)
        }
      })
      .finally(() => setLoading(false))
  }, [page])

  useEffect(() => { fetchActivity() }, [fetchActivity])

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Activity Log</h1>
          <p className="text-muted-foreground text-sm mt-1">{total} entries</p>
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left text-xs font-medium text-muted-foreground p-3">Time</th>
                      <th className="text-left text-xs font-medium text-muted-foreground p-3">Action</th>
                      <th className="text-left text-xs font-medium text-muted-foreground p-3">Entity</th>
                      <th className="text-left text-xs font-medium text-muted-foreground p-3">User ID</th>
                      <th className="text-left text-xs font-medium text-muted-foreground p-3">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activity.map(item => (
                      <tr key={item.id} className="border-b border-border/50 hover:bg-muted/20">
                        <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(item.createdAt).toLocaleString()}
                        </td>
                        <td className="p-3 text-sm font-medium">{item.action}</td>
                        <td className="p-3 text-sm text-muted-foreground">{item.entity || '—'}</td>
                        <td className="p-3 text-xs text-muted-foreground font-mono">
                          <span className="block font-medium text-foreground">{item.User?.email || item.userId?.slice(0, 8)}</span>
                          <span className="text-[10px]">{item.userId}</span>
                        </td>
                        <td className="p-3 text-xs text-muted-foreground max-w-xs truncate">
                          {item.metadata ? JSON.stringify(item.metadata).slice(0, 80) : '—'}
                        </td>
                      </tr>
                    ))}
                    {activity.length === 0 && (
                      <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">No activity</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

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
