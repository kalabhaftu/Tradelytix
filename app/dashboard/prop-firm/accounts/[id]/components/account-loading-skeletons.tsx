import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function AccountDetailPageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <Skeleton className="h-9 w-28 bg-muted/40" />
          <Skeleton className="h-10 w-36 bg-muted/55" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16 rounded-full bg-muted/35" />
            <Skeleton className="h-6 w-20 rounded-full bg-muted/35" />
            <Skeleton className="h-4 w-40 bg-muted/25" />
          </div>
        </div>
        <Skeleton className="h-10 w-28 rounded-xl bg-muted/35" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="border-border/24 bg-card/74">
            <CardContent className="space-y-3 p-5">
              <div className="flex items-start justify-between">
                <Skeleton className="h-3 w-20 bg-muted/30" />
                <Skeleton className="h-10 w-10 rounded-xl bg-muted/25" />
              </div>
              <Skeleton className="h-9 w-28 bg-muted/55" />
              <Skeleton className="h-3 w-16 bg-muted/30" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/24 bg-card/74">
        <CardContent className="space-y-5 p-5">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-40 bg-muted/45" />
            <Skeleton className="h-6 w-14 bg-muted/35" />
          </div>
          <Skeleton className="h-3 w-full rounded-full bg-muted/25" />
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24 bg-muted/30" />
            <Skeleton className="h-4 w-24 bg-muted/30" />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2 rounded-2xl border border-border/16 bg-card/35 p-1">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-9 w-24 rounded-xl bg-muted/35" />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border-border/24 bg-card/74">
          <CardContent className="space-y-4 p-5">
            <Skeleton className="h-7 w-40 bg-muted/45" />
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="rounded-2xl border border-border/12 p-4">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-24 bg-muted/35" />
                    <Skeleton className="h-5 w-16 bg-muted/35" />
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-4">
                    {Array.from({ length: 3 }).map((__, cellIndex) => (
                      <div key={cellIndex} className="space-y-2">
                        <Skeleton className="h-3 w-14 bg-muted/30" />
                        <Skeleton className="h-4 w-16 bg-muted/40" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/24 bg-card/74">
          <CardContent className="space-y-4 p-5">
            <Skeleton className="h-7 w-32 bg-muted/45" />
            <Skeleton className="h-56 rounded-2xl bg-muted/25" />
            <Skeleton className="h-48 rounded-2xl bg-muted/25" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export function AccountTradesPageSkeleton() {
  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <Skeleton className="h-9 w-24 bg-muted/40" />
          <Skeleton className="h-10 w-28 bg-muted/55" />
          <Skeleton className="h-4 w-40 bg-muted/25" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-28 rounded-xl bg-muted/35" />
          <Skeleton className="h-10 w-32 rounded-xl bg-muted/35" />
        </div>
      </div>
      <Card className="border-border/24 bg-card/74">
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-9 w-28 rounded-xl bg-muted/35" />
            ))}
          </div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="border-border/24 bg-card/74">
            <CardContent className="space-y-3 p-5">
              <Skeleton className="h-3 w-20 bg-muted/30" />
              <Skeleton className="h-8 w-20 bg-muted/55" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="overflow-hidden border-border/24 bg-card/76">
        <CardContent className="p-0">
          <div className="flex flex-wrap gap-3 border-b border-border/14 px-4 py-4">
            <Skeleton className="h-10 flex-1 min-w-[220px] rounded-xl bg-muted/35" />
            <Skeleton className="h-10 w-32 rounded-xl bg-muted/30" />
          </div>
          <div className="divide-y divide-border/10">
            {Array.from({ length: 7 }).map((_, index) => (
              <div key={index} className="grid grid-cols-[1fr_0.7fr_0.8fr_0.8fr_0.7fr] gap-4 px-4 py-4">
                <Skeleton className="h-4 w-20 bg-muted/35" />
                <Skeleton className="h-4 w-16 bg-muted/35" />
                <Skeleton className="h-4 w-24 bg-muted/35" />
                <Skeleton className="h-4 w-14 bg-muted/35" />
                <Skeleton className="h-8 w-20 rounded-full bg-muted/30" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function AccountSettingsPageSkeleton() {
  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <Skeleton className="h-9 w-28 bg-muted/40" />
          <Skeleton className="h-10 w-48 bg-muted/55" />
          <Skeleton className="h-4 w-44 bg-muted/25" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-28 rounded-xl bg-muted/35" />
          <Skeleton className="h-10 w-32 rounded-xl bg-muted/35" />
        </div>
      </div>
      <div className="flex gap-2 rounded-2xl border border-border/16 bg-card/35 p-1 w-fit">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-9 w-24 rounded-xl bg-muted/35" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card className="border-border/24 bg-card/74">
          <CardContent className="space-y-4 p-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <Skeleton className="h-3 w-24 bg-muted/30" />
                <Skeleton className="h-10 w-full rounded-xl bg-muted/30" />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="border-border/24 bg-card/74">
          <CardContent className="space-y-4 p-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <Skeleton className="h-3 w-20 bg-muted/30" />
                <Skeleton className="h-10 w-full rounded-xl bg-muted/30" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <Card className="border-border/24 bg-card/74">
        <CardContent className="space-y-4 p-6">
          <Skeleton className="h-6 w-32 bg-muted/45" />
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex items-center justify-between border-t border-border/12 pt-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20 bg-muted/35" />
                  <Skeleton className="h-3 w-14 bg-muted/25" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full bg-muted/35" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function AccountPayoutsPageSkeleton() {
  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <Skeleton className="h-9 w-24 bg-muted/40" />
          <Skeleton className="h-10 w-36 bg-muted/55" />
          <Skeleton className="h-4 w-40 bg-muted/25" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-28 rounded-xl bg-muted/35" />
          <Skeleton className="h-10 w-36 rounded-xl bg-muted/35" />
        </div>
      </div>
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
      <Card className="overflow-hidden border-border/24 bg-card/76">
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-wrap gap-3">
            <Skeleton className="h-10 flex-1 min-w-[220px] rounded-xl bg-muted/35" />
            <Skeleton className="h-10 w-28 rounded-xl bg-muted/35" />
          </div>
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="rounded-2xl border border-border/12 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-32 bg-muted/45" />
                    <Skeleton className="h-4 w-20 bg-muted/30" />
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full bg-muted/35" />
                </div>
                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                  {Array.from({ length: 3 }).map((__, cellIndex) => (
                    <div key={cellIndex} className="space-y-2">
                      <Skeleton className="h-3 w-20 bg-muted/30" />
                      <Skeleton className="h-5 w-24 bg-muted/45" />
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

export function AccountPayoutHistorySkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="rounded-2xl border border-border/12 p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <Skeleton className="h-5 w-32 bg-muted/45" />
              <Skeleton className="h-4 w-20 bg-muted/30" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full bg-muted/35" />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((__, cellIndex) => (
              <div key={cellIndex} className="space-y-2">
                <Skeleton className="h-3 w-20 bg-muted/30" />
                <Skeleton className="h-5 w-24 bg-muted/45" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export function RequestPayoutPageSkeleton() {
  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-9 w-24 bg-muted/40" />
        <div className="space-y-2">
          <Skeleton className="h-10 w-48 bg-muted/55" />
          <Skeleton className="h-4 w-40 bg-muted/25" />
        </div>
      </div>
      <Card className="border-border/24 bg-card/74">
        <CardContent className="space-y-4 p-6">
          <Skeleton className="h-6 w-40 bg-muted/45" />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <Skeleton className="h-3 w-24 bg-muted/30" />
                <Skeleton className="h-8 w-20 bg-muted/50" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card className="border-border/24 bg-card/74">
        <CardContent className="space-y-5 p-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-3 w-24 bg-muted/30" />
              <Skeleton className={index === 2 ? "h-28 w-full rounded-2xl bg-muted/28" : "h-10 w-full rounded-xl bg-muted/30"} />
            </div>
          ))}
          <div className="flex justify-end">
            <Skeleton className="h-10 w-36 rounded-xl bg-muted/35" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function ImportTradesPageSkeleton() {
  return (
    <div className="min-h-screen">
      <div className="container mx-auto max-w-7xl space-y-6 p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-32 bg-muted/40" />
          <div className="space-y-2">
            <Skeleton className="h-10 w-44 bg-muted/55" />
            <Skeleton className="h-4 w-36 bg-muted/25" />
          </div>
        </div>
        <Card className="border-border/24 bg-card/74">
          <CardHeader className="space-y-2">
            <Skeleton className="h-6 w-40 bg-muted/45" />
            <Skeleton className="h-4 w-56 bg-muted/25" />
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 pt-0 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <Skeleton className="h-3 w-20 bg-muted/30" />
                <Skeleton className="h-6 w-24 bg-muted/45" />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="border-border/24 bg-card/74">
          <CardContent className="space-y-5 p-6">
            <div className="grid gap-4 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-24 rounded-2xl bg-muted/30" />
              ))}
            </div>
            <Skeleton className="h-72 rounded-3xl bg-muted/26" />
            <div className="flex justify-end">
              <Skeleton className="h-10 w-36 rounded-xl bg-muted/35" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
