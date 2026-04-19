import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function DataTradeTableSkeleton() {
  return (
    <Card className="overflow-hidden border-border/24 bg-card/76">
      <CardContent className="p-0">
        <div className="flex flex-wrap items-center gap-3 border-b border-border/14 px-4 py-4">
          <Skeleton className="h-10 flex-1 min-w-[220px] rounded-xl bg-muted/35" />
          <Skeleton className="h-10 w-40 rounded-xl bg-muted/30" />
          <Skeleton className="h-10 w-28 rounded-xl bg-muted/30" />
        </div>
        <div className="divide-y divide-border/10">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="grid grid-cols-[28px_1.1fr_0.9fr_0.7fr_0.7fr_0.7fr_0.7fr] gap-4 px-4 py-4">
              <Skeleton className="h-4 w-4 rounded bg-muted/30" />
              <Skeleton className="h-4 w-24 bg-muted/35" />
              <Skeleton className="h-4 w-20 bg-muted/35" />
              <Skeleton className="h-4 w-16 bg-muted/35" />
              <Skeleton className="h-4 w-16 bg-muted/35" />
              <Skeleton className="h-4 w-20 bg-muted/35" />
              <Skeleton className="h-4 w-16 bg-muted/35" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export function DataManagementCardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48 bg-muted/55" />
          <Skeleton className="h-4 w-64 bg-muted/30" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-36 rounded-xl bg-muted/35" />
          <Skeleton className="h-10 w-36 rounded-xl bg-muted/35" />
        </div>
      </div>

      <Card className="border-border/24 bg-card/74">
        <CardContent className="space-y-4 p-4">
          <Skeleton className="h-5 w-24 bg-muted/40" />
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="rounded-2xl border border-border/14 bg-background/30 p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-2xl bg-muted/35" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-32 bg-muted/45" />
                    <Skeleton className="h-4 w-20 bg-muted/30" />
                  </div>
                </div>
                <div className="mt-4 space-y-3 border-t border-border/10 pt-4">
                  {Array.from({ length: index === 1 ? 2 : 1 }).map((__, rowIndex) => (
                    <div key={rowIndex} className="flex items-center justify-between gap-4">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-24 bg-muted/35" />
                        <Skeleton className="h-3 w-16 bg-muted/25" />
                      </div>
                      <Skeleton className="h-8 w-8 rounded-xl bg-muted/30" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function DataPageSkeleton() {
  return (
    <div className="w-full max-w-full space-y-6 px-4 py-6 sm:px-6">
      <Skeleton className="h-10 w-52 bg-muted/55" />
      <div className="flex gap-2 rounded-2xl border border-border/18 bg-card/35 p-1 w-fit">
        <Skeleton className="h-9 w-24 rounded-xl bg-muted/35" />
        <Skeleton className="h-9 w-20 rounded-xl bg-muted/30" />
      </div>
      <DataManagementCardSkeleton />
    </div>
  )
}

