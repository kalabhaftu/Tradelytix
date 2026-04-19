import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

function ReportMetricSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-3 w-20 bg-muted/35" />
      <Skeleton className="h-10 w-28 bg-muted/55" />
      <Skeleton className="h-3 w-16 bg-muted/30" />
    </div>
  )
}

function AuditPanelSkeleton() {
  return (
    <Card className="border-border/20 bg-card/60">
      <CardContent className="space-y-5 p-5">
        <Skeleton className="h-4 w-48 bg-muted/40" />
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="flex items-center justify-between gap-4 border-b border-border/10 pb-3 last:border-b-0 last:pb-0">
            <Skeleton className="h-3 w-32 bg-muted/30" />
            <Skeleton className="h-4 w-20 bg-muted/45" />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export function ReportsContentSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 border-t border-border/10 pt-8 md:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <ReportMetricSkeleton key={index} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <AuditPanelSkeleton />
        <div className="space-y-6">
          <Card className="border-border/20 bg-card/60">
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-40 bg-muted/35" />
                <Skeleton className="h-5 w-16 rounded-full bg-muted/35" />
              </div>
              <Skeleton className="h-56 rounded-2xl bg-muted/28" />
            </CardContent>
          </Card>
          <Card className="border-border/20 bg-card/60">
            <CardContent className="space-y-4 p-5">
              <Skeleton className="h-4 w-44 bg-muted/35" />
              <div className="grid grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="space-y-3">
                    <Skeleton className="h-3 w-24 bg-muted/30" />
                    <Skeleton className="h-5 w-16 bg-muted/45" />
                    <Skeleton className="h-2 w-full rounded-full bg-muted/30" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2 border-border/20 bg-card/60">
          <CardContent className="space-y-4 p-5">
            <Skeleton className="h-4 w-40 bg-muted/35" />
            <Skeleton className="h-64 rounded-2xl bg-muted/28" />
          </CardContent>
        </Card>
        <div className="space-y-6">
          <Card className="border-border/20 bg-card/60">
            <CardContent className="space-y-4 p-5">
              <Skeleton className="h-4 w-32 bg-muted/35" />
              <Skeleton className="h-56 rounded-2xl bg-muted/28" />
            </CardContent>
          </Card>
          <Card className="border-border/20 bg-card/60">
            <CardContent className="space-y-4 p-5">
              <Skeleton className="h-4 w-36 bg-muted/35" />
              <Skeleton className="h-40 rounded-2xl bg-muted/28" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export function PropFirmReportsSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="border-border/20 bg-card/60">
          <CardContent className="grid grid-cols-3 gap-4 p-5">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <Skeleton className="h-3 w-16 bg-muted/30" />
                <Skeleton className="h-6 w-12 bg-muted/45" />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="border-border/20 bg-card/60">
          <CardContent className="space-y-4 p-5">
            <Skeleton className="h-4 w-28 bg-muted/35" />
            <Skeleton className="h-10 w-40 bg-muted/55" />
            <div className="flex items-center gap-3 border-t border-border/10 pt-4">
              <Skeleton className="h-4 w-4 rounded-md bg-muted/30" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-24 bg-muted/45" />
                <Skeleton className="h-3 w-20 bg-muted/30" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className="border-border/20 bg-card/62">
            <CardContent className="space-y-4 p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-28 bg-muted/45" />
                  <Skeleton className="h-3 w-24 bg-muted/30" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full bg-muted/35" />
              </div>
              <Skeleton className="h-9 w-32 bg-muted/55" />
              <div className="grid grid-cols-3 gap-3 border-t border-border/10 pt-4">
                {Array.from({ length: 3 }).map((__, cellIndex) => (
                  <div key={cellIndex} className="space-y-2">
                    <Skeleton className="h-3 w-12 bg-muted/30" />
                    <Skeleton className="h-4 w-14 bg-muted/40" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export function ReportsPageSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="space-y-3">
          <Skeleton className="h-10 w-36 bg-muted/55" />
          <Skeleton className="h-4 w-32 bg-muted/30" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-10 w-28 rounded-xl bg-muted/35" />
          <Skeleton className="h-10 w-24 rounded-xl bg-muted/35" />
        </div>
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto]">
        <div className="grid gap-3 md:grid-cols-[180px_220px_1fr]">
          <Skeleton className="h-11 rounded-2xl bg-muted/40" />
          <Skeleton className="h-11 rounded-2xl bg-muted/40" />
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-11 rounded-2xl bg-muted/35" />
            ))}
          </div>
        </div>
        <Skeleton className="h-11 w-28 rounded-2xl bg-muted/35" />
      </div>

      <div className="flex gap-2 rounded-2xl border border-border/16 bg-card/35 p-1">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-9 w-28 rounded-xl bg-muted/35" />
        ))}
      </div>

      <ReportsContentSkeleton />
    </div>
  )
}

