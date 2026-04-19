import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

function JournalStatSkeleton() {
  return (
    <Card className="h-24 border-border/24 bg-card/74">
      <CardContent className="flex h-full flex-col justify-center gap-2 px-6 py-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-20 bg-muted/40" />
          <Skeleton className="h-4 w-4 rounded-md bg-muted/30" />
        </div>
        <Skeleton className="h-7 w-24 bg-muted/55" />
        <Skeleton className="h-3 w-24 bg-muted/30" />
      </CardContent>
    </Card>
  )
}

function JournalCardSkeleton() {
  return (
    <Card className="overflow-hidden border-border/24 bg-card/78">
      <CardContent className="space-y-5 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <Skeleton className="h-6 w-24 bg-muted/55" />
            <Skeleton className="h-4 w-16 bg-muted/35" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-6 w-12 rounded-full bg-muted/35" />
            <Skeleton className="h-6 w-20 rounded-full bg-muted/35" />
          </div>
        </div>
        <Skeleton className="h-72 rounded-3xl bg-muted/30" />
        <div className="grid grid-cols-2 gap-4 border-t border-border/12 pt-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-3 w-16 bg-muted/30" />
              <Skeleton className="h-5 w-20 bg-muted/50" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export function JournalPageSkeleton() {
  return (
    <div className="w-full max-w-full space-y-6 px-4 py-6 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <Skeleton className="h-10 w-52 bg-muted/55" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32 rounded-xl bg-muted/40" />
          <Skeleton className="h-10 w-24 rounded-xl bg-muted/35" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <JournalStatSkeleton key={index} />
        ))}
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <Skeleton className="h-11 flex-1 rounded-2xl bg-muted/40" />
        <Skeleton className="h-10 w-16 rounded-xl bg-muted/35" />
        <Skeleton className="h-10 w-24 rounded-xl bg-muted/35" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2 2xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <JournalCardSkeleton key={index} />
        ))}
      </div>
    </div>
  )
}

