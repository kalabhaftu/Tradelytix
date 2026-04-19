import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

function StrategyCardSkeleton() {
  return (
    <Card className="rounded-[24px] border-border/24 bg-card/72">
      <CardContent className="space-y-5 p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Skeleton className="h-6 w-40 bg-muted/55" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-24 rounded-full bg-muted/35" />
              <Skeleton className="h-4 w-20 bg-muted/25" />
            </div>
          </div>
          <Skeleton className="h-8 w-8 rounded-xl bg-muted/30" />
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-3 w-16 bg-muted/30" />
              <Skeleton className="h-7 w-20 bg-muted/50" />
            </div>
          ))}
        </div>

        <div className="border-t border-border/12 pt-4">
          <Skeleton className="h-4 w-full bg-muted/30" />
          <Skeleton className="mt-2 h-4 w-4/5 bg-muted/25" />
        </div>
      </CardContent>
    </Card>
  )
}

export function PlaybookCardsSkeleton() {
  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <StrategyCardSkeleton key={index} />
      ))}
    </div>
  )
}

export function PlaybookPageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-8 pb-20 sm:px-6 md:pb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <Skeleton className="h-10 w-64 bg-muted/55" />
        <Skeleton className="h-10 w-48 rounded-xl bg-muted/40" />
      </div>

      <div className="grid gap-3 rounded-[28px] border border-border/20 bg-card/35 p-4 sm:grid-cols-3 sm:p-5">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="rounded-2xl border border-border/14 bg-background/35 p-4 space-y-3">
            <Skeleton className="h-3 w-20 bg-muted/30" />
            <Skeleton className="h-8 w-16 bg-muted/50" />
          </div>
        ))}
      </div>

      <PlaybookCardsSkeleton />
    </div>
  )
}

