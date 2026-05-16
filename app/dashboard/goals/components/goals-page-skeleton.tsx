import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

function GoalsCardSkeleton() {
  return (
    <Card className="overflow-hidden border-border/24 bg-card/78">
      <CardContent className="space-y-5 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-9 w-9 rounded-lg bg-muted/40" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-36 bg-muted/55" />
              <Skeleton className="h-3 w-24 bg-muted/30" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16 rounded-full bg-muted/35" />
            <Skeleton className="h-6 w-6 rounded-md bg-muted/30" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-24 bg-muted/30" />
            <Skeleton className="h-4 w-24 bg-muted/45" />
          </div>
          <Skeleton className="h-1.5 w-full rounded-full bg-muted/30" />
          <Skeleton className="h-3 w-28 bg-muted/25" />
        </div>
      </CardContent>
    </Card>
  )
}

export function GoalsPageSkeleton() {
  return (
    <div className="w-full max-w-4xl space-y-6 px-4 py-6 sm:px-6 mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-10 w-40 bg-muted/55" />
          <Skeleton className="h-4 w-60 bg-muted/30" />
        </div>
        <Skeleton className="h-10 w-28 rounded-xl bg-muted/40" />
      </div>

      <div className="space-y-4">
        <Skeleton className="h-4 w-28 bg-muted/30" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <GoalsCardSkeleton key={index} />
          ))}
        </div>
      </div>
    </div>
  )
}
