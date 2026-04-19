import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function GlobalPayoutsPageSkeleton() {
  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-20 bg-muted/40" />
          <div className="space-y-2">
            <Skeleton className="h-10 w-28 bg-muted/55" />
            <Skeleton className="h-4 w-40 bg-muted/25" />
          </div>
        </div>
        <Skeleton className="h-10 w-28 rounded-xl bg-muted/35" />
      </div>

      <Skeleton className="h-10 w-full max-w-sm rounded-xl bg-muted/35" />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index} className="border-border/24 bg-card/74">
            <CardContent className="space-y-3 p-5">
              <Skeleton className="h-3 w-20 bg-muted/30" />
              <Skeleton className="h-8 w-24 bg-muted/55" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-4">
        <GlobalPayoutListSkeleton />
      </div>
    </div>
  )
}

export function GlobalPayoutListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={index} className="border-border/24 bg-card/74">
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-5 w-32 bg-muted/45" />
                <Skeleton className="h-4 w-20 bg-muted/30" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full bg-muted/35" />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {Array.from({ length: 3 }).map((__, cellIndex) => (
                <div key={cellIndex} className="space-y-2">
                  <Skeleton className="h-3 w-20 bg-muted/30" />
                  <Skeleton className="h-5 w-24 bg-muted/45" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function GlobalPayoutDetailSkeleton() {
  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-20 bg-muted/40" />
          <div className="space-y-2">
            <Skeleton className="h-10 w-40 bg-muted/55" />
            <Skeleton className="h-4 w-48 bg-muted/25" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24 rounded-xl bg-muted/35" />
          <Skeleton className="h-10 w-24 rounded-xl bg-muted/35" />
          <Skeleton className="h-10 w-24 rounded-xl bg-muted/35" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <Card key={index} className="border-border/24 bg-card/74">
            <CardContent className="space-y-4 p-6">
              <Skeleton className="h-6 w-40 bg-muted/45" />
              {Array.from({ length: 4 }).map((__, rowIndex) => (
                <div key={rowIndex} className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24 bg-muted/30" />
                  <Skeleton className="h-5 w-24 bg-muted/45" />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
