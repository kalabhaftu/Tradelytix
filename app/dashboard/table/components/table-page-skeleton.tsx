import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function TablePageSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <Skeleton className="h-10 w-40 bg-muted/55" />
        </div>
        <Skeleton className="h-10 w-36 rounded-xl bg-muted/35" />
      </div>

      <Card className="overflow-hidden rounded-[28px] border-border/24 bg-card/78">
        <CardContent className="p-0">
          <div className="flex items-center gap-4 border-b border-border/16 px-4 py-4">
            {Array.from({ length: 10 }).map((_, index) => (
              <Skeleton
                key={index}
                className={`h-3 bg-muted/35 ${index === 0 ? "w-6" : index === 9 ? "w-20" : "w-16"}`}
              />
            ))}
          </div>

          <div className="divide-y divide-border/12">
            {Array.from({ length: 10 }).map((_, rowIndex) => (
              <div key={rowIndex} className="grid grid-cols-[32px_120px_100px_80px_1fr_1fr_110px_90px_90px_96px] items-center gap-4 px-4 py-4">
                <Skeleton className="h-4 w-4 rounded-full bg-muted/30" />
                <Skeleton className="h-6 w-14 rounded-full bg-muted/40" />
                <Skeleton className="h-4 w-20 bg-muted/35" />
                <Skeleton className="h-6 w-12 rounded-full bg-muted/35" />
                <Skeleton className="h-4 w-16 bg-muted/35" />
                <Skeleton className="h-4 w-16 bg-muted/35" />
                <Skeleton className="h-4 w-20 bg-muted/35" />
                <Skeleton className="h-4 w-14 bg-muted/35" />
                <Skeleton className="h-4 w-12 bg-muted/35" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-12 rounded-full bg-muted/35" />
                  <Skeleton className="h-8 w-10 rounded-full bg-muted/30" />
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between border-t border-border/16 px-4 py-4">
            <Skeleton className="h-4 w-28 bg-muted/35" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-20 rounded-xl bg-muted/35" />
              <Skeleton className="h-4 w-12 bg-muted/35" />
              <Skeleton className="h-9 w-20 rounded-xl bg-muted/35" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

