import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function LiveAccountDetailSkeleton() {
  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <Skeleton className="h-9 w-24 bg-muted/40" />
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-6 w-16 rounded-full bg-muted/45" />
            <Skeleton className="h-4 w-32 bg-muted/30" />
            <Skeleton className="h-4 w-28 bg-muted/30" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-28 rounded-xl bg-muted/35" />
          <Skeleton className="h-10 w-28 rounded-xl bg-muted/35" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <Card key={index} className="border-border/24 bg-card/74">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-20 bg-muted/35" />
                <Skeleton className="h-4 w-4 rounded-md bg-muted/30" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              <Skeleton className="h-8 w-24 bg-muted/55" />
              <Skeleton className="h-3 w-16 bg-muted/35" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/24 bg-card/74">
        <CardContent className="space-y-4 p-5">
          <div className="flex gap-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-9 w-24 rounded-xl bg-muted/40" />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Skeleton className="h-56 rounded-2xl bg-muted/30" />
            <Skeleton className="h-56 rounded-2xl bg-muted/30" />
          </div>
          <Skeleton className="h-64 rounded-2xl bg-muted/26" />
        </CardContent>
      </Card>
    </div>
  )
}

