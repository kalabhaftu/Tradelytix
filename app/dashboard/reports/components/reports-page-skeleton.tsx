import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

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
    <div className="space-y-10">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <Card className="border-border/20 bg-card/55">
          <CardContent className="space-y-6 p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-2">
                <Skeleton className="h-3 w-24 bg-muted/30" />
                <Skeleton className="h-5 w-64 bg-muted/40" />
              </div>
              <Skeleton className="h-8 w-20 rounded-xl bg-muted/35" />
            </div>
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-3">
                <Skeleton className="h-3 w-16 bg-muted/30" />
                <Skeleton className="h-12 w-44 bg-muted/50" />
              </div>
              <div className="grid grid-cols-2 gap-3 lg:w-[240px]">
                {Array.from({ length: 2 }).map((_, index) => (
                  <div key={index} className="rounded-2xl border border-border/15 bg-card/45 p-4 space-y-2">
                    <Skeleton className="h-3 w-16 bg-muted/30" />
                    <Skeleton className="h-7 w-12 bg-muted/45" />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="border-border/20 bg-card/55">
              <CardContent className="space-y-4 p-5">
                <Skeleton className="h-3 w-20 bg-muted/30" />
                <Skeleton className="h-10 w-24 bg-muted/50" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.12fr)_minmax(0,0.78fr)]">
        <AuditPanelSkeleton />
        <div className="space-y-6">
          <Card className="border-border/20 bg-card/60">
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center justify-between gap-3">
                <Skeleton className="h-4 w-40 bg-muted/35" />
                <Skeleton className="h-5 w-16 rounded-full bg-muted/35" />
              </div>
              <Skeleton className="h-64 rounded-2xl bg-muted/28" />
            </CardContent>
          </Card>
          <Card className="border-border/20 bg-card/60">
            <CardContent className="space-y-4 p-5">
              <Skeleton className="h-4 w-40 bg-muted/35" />
              <div className="grid grid-cols-2 gap-4">
                {Array.from({ length: 5 }).map((_, index) => (
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
    <div className="w-full max-w-7xl mx-auto py-8 px-4 sm:px-6 pb-20 md:pb-8 overflow-hidden">
      <div className="space-y-8">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-2">
            <div className="text-3xl font-black tracking-tight text-foreground">Reports</div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/75">
              Jan 19 - Apr 19, 2026
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-9 w-28 rounded-xl bg-muted/35" />
            <Skeleton className="h-9 w-24 rounded-xl bg-muted/35" />
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
    </div>
  )
}
