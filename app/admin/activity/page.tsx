'use client'

import { useEffect, useState, useCallback } from 'react'
import { AdminShell } from '../components/admin-shell'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { ChevronLeft, ChevronRight } from 'lucide-react'

type ActivityItem = {
  id: string
  action: string
  entity: string
  entityId?: string | null
  userId: string
  metadata?: Record<string, any> | null
  createdAt: string
  User?: { email: string | null } | null
}

function formatActivitySummary(item: ActivityItem) {
  const metadata = item.metadata ?? {}

  switch (item.action) {
    case 'TRADES_IMPORTED': {
      const count = typeof metadata.count === 'number' ? metadata.count : metadata.totalTrades
      const accountName = typeof metadata.accountName === 'string' ? metadata.accountName : null
      const accountId = typeof metadata.accountId === 'string' ? metadata.accountId : null
      const pieces = [
        count ? `Imported ${count} trade${count === 1 ? '' : 's'}` : 'Imported trades',
        accountName ? `into ${accountName}` : null,
        accountId ? `(${accountId})` : null,
      ].filter(Boolean)
      return pieces.join(' ')
    }
    case 'PROFILE_UPDATED': {
      const updatedFields = Array.isArray(metadata.updatedFields) ? metadata.updatedFields : []
      return updatedFields.length > 0
        ? `Updated ${updatedFields.join(', ')}`
        : 'Profile updated'
    }
    case 'USER_LOGIN':
      return 'Signed in successfully'
    case 'USER_LOGOUT':
      return 'Signed out'
    case 'USER_SIGNUP':
      return 'Completed account signup'
    default:
      return item.metadata ? null : '—'
  }
}

export default function AdminActivityPage() {
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const limit = 50

  const fetchActivity = useCallback(() => {
    setLoading(true)
    fetch(`/api/v1/admin/activity?page=${page}&limit=${limit}`)
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          setActivity(data.data.activity)
          setTotal(data.data.total)
        }
      })
      .finally(() => setLoading(false))
  }, [page])

  useEffect(() => {
    fetchActivity()
  }, [fetchActivity])

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
                    {activity.map((item) => {
                      const summary = formatActivitySummary(item)
                      const rawMetadata = item.metadata ? JSON.stringify(item.metadata, null, 2) : null

                      return (
                        <tr key={item.id} className="border-b border-border/50 hover:bg-muted/20 align-top">
                          <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(item.createdAt).toLocaleString()}
                          </td>
                          <td className="p-3 text-sm font-medium">{item.action}</td>
                          <td className="p-3 text-sm text-muted-foreground">{item.entity || '—'}</td>
                          <td className="p-3 text-xs text-muted-foreground font-mono">
                            <span className="block font-medium text-foreground">{item.User?.email || item.userId?.slice(0, 8)}</span>
                            <span className="text-[10px] break-all">{item.userId}</span>
                          </td>
                          <td className="p-3 text-xs text-muted-foreground min-w-[280px]">
                            <div className="space-y-2">
                              <p className="text-foreground/90">{summary || 'Raw metadata available below'}</p>
                              {rawMetadata && (
                                <details className="rounded-md border border-border/60 bg-muted/20 px-2 py-1.5">
                                  <summary className="cursor-pointer text-[11px] text-muted-foreground">View raw metadata</summary>
                                  <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-words text-[10px] text-muted-foreground">
                                    {rawMetadata}
                                  </pre>
                                </details>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
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
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" disabled={page >= Math.ceil(total / limit)} onClick={() => setPage((current) => current + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </AdminShell>
  )
}
