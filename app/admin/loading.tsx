import React from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export default function AdminLoading() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <Skeleton className="h-8 w-48 bg-muted/40" />
        <Skeleton className="h-4 w-72 mt-2 bg-muted/25" />
      </div>

      {/* Grid of 5 Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="border-border/30 bg-card/60">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-3 w-20 bg-muted/30" />
                  <Skeleton className="h-8 w-24 bg-muted/45" />
                  <Skeleton className="h-3 w-32 bg-muted/25" />
                </div>
                <Skeleton className="h-11 w-11 rounded-xl bg-muted/20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Needs Attention and Recent Activity Section */}
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-border/30 bg-card/60">
          <CardHeader className="space-y-2">
            <Skeleton className="h-4 w-32 bg-muted/35" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg border border-border/40 bg-muted/10 px-3 py-3">
                <Skeleton className="h-4 w-4 rounded-full bg-muted/30" />
                <Skeleton className="h-4 flex-1 bg-muted/25" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/30 bg-card/60">
          <CardHeader className="space-y-2">
            <Skeleton className="h-4 w-32 bg-muted/35" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-border/30 last:border-0">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-12 bg-muted/30" />
                    <Skeleton className="h-4 w-20 bg-muted/35" />
                  </div>
                  <Skeleton className="h-3 w-32 bg-muted/20" />
                </div>
                <Skeleton className="h-3.5 w-24 bg-muted/20" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Support Buttons Toggle Card */}
      <Card className="border-border/30 bg-card/60">
        <CardHeader className="space-y-2">
          <Skeleton className="h-4 w-40 bg-muted/35" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between gap-4 rounded-xl border border-border/40 bg-muted/10 px-4 py-3">
              <div className="space-y-2">
                <Skeleton className="h-4 w-28 bg-muted/30" />
                <Skeleton className="h-3 w-72 bg-muted/20" />
              </div>
              <Skeleton className="h-6 w-11 rounded-full bg-muted/30" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Broadcast update skeleton */}
      <Card className="border-border/30 bg-card/60">
        <CardHeader className="space-y-2">
          <Skeleton className="h-4 w-32 bg-muted/35" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-3 w-10 bg-muted/30" />
            <Skeleton className="h-10 w-full bg-muted/20 rounded-md" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-16 bg-muted/30" />
            <Skeleton className="h-[220px] w-full bg-muted/15 rounded-md" />
          </div>
          <div className="flex justify-between items-center">
            <Skeleton className="h-3 w-96 bg-muted/20" />
            <Skeleton className="h-10 w-32 bg-muted/35 rounded-md" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
