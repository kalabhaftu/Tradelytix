'use client'

import { useEffect, useState } from 'react'
import { AdminShell } from '../components/admin-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { Globe, BarChart3 } from 'lucide-react'

export default function AdminAnalyticsPage() {
  const [geoData, setGeoData] = useState<any[]>([])
  const [trends, setTrends] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/v1/admin/analytics?type=geo').then(r => r.json()),
      fetch('/api/v1/admin/analytics?type=trends').then(r => r.json()),
    ])
      .then(([geoRes, trendRes]) => {
        if (geoRes.success) setGeoData(geoRes.data)
        if (trendRes.success) setTrends(trendRes.data)
      })
      .finally(() => setLoading(false))
  }, [])

  const maxCount = Math.max(...geoData.map(g => g.count), 1)

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground text-sm mt-1">User distribution and trends</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Users by Country
                </CardTitle>
              </CardHeader>
              <CardContent>
                {geoData.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No geo data yet</p>
                ) : (
                  <div className="space-y-3">
                    {geoData.map((item, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">
                              {item.countryCode || '??'}
                            </span>
                            <span>{item.country || 'Unknown'}</span>
                          </div>
                          <span className="text-muted-foreground font-medium">{item.count}</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${(item.count / maxCount) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Activity Trend (30d)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {trends.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No trend data yet</p>
                ) : (
                  <div className="space-y-2">
                    {trends.slice(-14).map((item: any, i: number) => {
                      const maxTrend = Math.max(...trends.map((t: any) => t.count), 1)
                      return (
                        <div key={i} className="flex items-center gap-3">
                          <span className="text-[10px] text-muted-foreground w-16 shrink-0">{item.date.slice(5)}</span>
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary/70 rounded-full"
                              style={{ width: `${(item.count / maxTrend) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground w-6 text-right">{item.count}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AdminShell>
  )
}
