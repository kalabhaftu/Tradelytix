'use client'

import React from 'react'
import { AdminShell } from './components/admin-shell'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export default function AdminLoading() {
  return (
    <AdminShell>
      <div className="space-y-6">
        {/* Generic Page Header Skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-8 w-48 bg-muted/40" />
          <Skeleton className="h-4 w-72 bg-muted/25" />
        </div>

        {/* Grid of 3 Generic Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="border-border/30 bg-card/60">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-3 w-20 bg-muted/30" />
                    <Skeleton className="h-8 w-24 bg-muted/45" />
                  </div>
                  <Skeleton className="h-10 w-10 rounded-xl bg-muted/20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Table/List Skeleton */}
        <Card className="border-border/30 bg-card/60">
          <CardHeader className="space-y-2">
            <Skeleton className="h-4.5 w-40 bg-muted/35" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-border/10 last:border-0">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-1/3 bg-muted/35" />
                  <Skeleton className="h-3 w-1/2 bg-muted/20" />
                </div>
                <Skeleton className="h-8 w-20 bg-muted/30 rounded-lg" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  )
}
