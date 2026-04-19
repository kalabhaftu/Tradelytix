import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

function AccountsStatCardSkeleton() {
  return (
    <Card className="border-border/24 bg-card/72">
      <CardContent className="px-5 py-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <Skeleton className="h-3 w-24 bg-muted/55" />
            <Skeleton className="h-4 w-4 rounded-md bg-muted/45" />
          </div>
          <Skeleton className="h-8 w-24 bg-muted/55" />
          <Skeleton className="h-3 w-20 bg-muted/40" />
        </div>
      </CardContent>
    </Card>
  )
}

function AccountsCardSkeleton() {
  return (
    <Card className="border-border/24 bg-card/78">
      <CardContent className="space-y-5 px-5 py-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <Skeleton className="h-11 w-11 rounded-2xl bg-muted/45" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-36 bg-muted/55" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-16 rounded-full bg-muted/45" />
                <Skeleton className="h-5 w-20 rounded-full bg-muted/35" />
              </div>
            </div>
          </div>
          <Skeleton className="h-8 w-8 rounded-xl bg-muted/35" />
        </div>

        <div className="space-y-2">
          <Skeleton className="h-3 w-20 bg-muted/35" />
          <Skeleton className="h-9 w-32 bg-muted/55" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-3 w-20 bg-muted/35" />
            <Skeleton className="h-3 w-16 bg-muted/30" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 rounded-2xl border border-border/14 bg-background/30 p-3">
          <div className="space-y-2">
            <Skeleton className="h-3 w-16 bg-muted/35" />
            <Skeleton className="h-4 w-20 bg-muted/50" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-14 bg-muted/35" />
            <Skeleton className="h-4 w-16 bg-muted/50" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-20 bg-muted/35" />
            <Skeleton className="h-4 w-24 bg-muted/50" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-16 bg-muted/35" />
            <Skeleton className="h-4 w-14 bg-muted/50" />
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-border/14 pt-4">
          <Skeleton className="h-3 w-28 bg-muted/35" />
          <Skeleton className="h-8 w-24 rounded-full bg-muted/40" />
        </div>
      </CardContent>
    </Card>
  )
}

export function AccountsPageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-8 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <Skeleton className="h-10 w-40 bg-muted/55" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-10 w-10 rounded-xl bg-muted/35" />
          <Skeleton className="h-10 w-36 rounded-xl bg-muted/45" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <AccountsStatCardSkeleton key={index} />
        ))}
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <Skeleton className="h-11 flex-1 rounded-2xl bg-muted/40" />
        <Skeleton className="h-10 w-56 rounded-2xl bg-muted/35" />
        <Skeleton className="h-10 w-56 rounded-2xl bg-muted/35" />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2 2xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <AccountsCardSkeleton key={index} />
        ))}
      </div>
    </div>
  )
}

