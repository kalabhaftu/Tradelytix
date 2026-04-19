import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function BacktestingPageSkeleton() {
  return (
    <div className="container mx-auto space-y-6 py-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <Skeleton className="h-10 w-44 bg-muted/55" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-48 rounded-xl bg-muted/35" />
          <Skeleton className="h-10 w-28 rounded-xl bg-muted/35" />
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto]">
        <Skeleton className="h-11 rounded-2xl bg-muted/40" />
        <Skeleton className="h-10 w-20 rounded-xl bg-muted/35" />
        <Skeleton className="h-10 w-36 rounded-xl bg-muted/35" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="border-border/24 bg-card/74">
            <CardContent className="space-y-3 px-5 py-4">
              <div className="flex items-start justify-between">
                <Skeleton className="h-3 w-16 bg-muted/30" />
                <Skeleton className="h-4 w-4 rounded-md bg-muted/25" />
              </div>
              <Skeleton className="h-8 w-20 bg-muted/55" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/24 bg-card/74">
        <CardContent className="space-y-6 p-8">
          <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-8">
            <Skeleton className="h-16 w-16 rounded-full bg-muted/30" />
            <Skeleton className="h-7 w-48 bg-muted/45" />
            <Skeleton className="h-4 w-64 bg-muted/30" />
            <Skeleton className="h-10 w-36 rounded-xl bg-muted/35" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

