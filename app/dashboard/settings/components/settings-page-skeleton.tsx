import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

function SettingsBlockSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <Card className="border-border/24 bg-card/74">
      <CardContent className="space-y-5 p-6">
        <div className="flex items-start gap-4">
          <Skeleton className="h-10 w-10 rounded-xl bg-muted/35" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-32 bg-muted/45" />
            <Skeleton className="h-4 w-44 bg-muted/30" />
          </div>
        </div>
        <div className="space-y-4">
          {Array.from({ length: rows }).map((_, index) => (
            <div key={index} className="flex items-center justify-between gap-4 border-t border-border/12 pt-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-xl bg-muted/30" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-28 bg-muted/35" />
                  <Skeleton className="h-3 w-36 bg-muted/25" />
                </div>
              </div>
              <Skeleton className="h-9 w-24 rounded-xl bg-muted/35" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export function SettingsPageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6">
      <Skeleton className="h-10 w-36 bg-muted/55" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SettingsBlockSkeleton rows={3} />
        <SettingsBlockSkeleton rows={6} />
        <SettingsBlockSkeleton rows={2} />
        <SettingsBlockSkeleton rows={3} />
        <Card className="lg:col-span-2 border-border/24 bg-card/74">
          <CardContent className="space-y-5 p-6">
            <Skeleton className="h-8 w-40 bg-muted/45" />
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <Skeleton className="h-4 w-28 bg-muted/35" />
                <Skeleton className="h-4 w-24 bg-muted/35" />
                <Skeleton className="h-20 rounded-2xl bg-muted/25" />
              </div>
              <div className="flex flex-wrap gap-3 self-end">
                <Skeleton className="h-10 w-40 rounded-xl bg-muted/35" />
                <Skeleton className="h-10 w-28 rounded-xl bg-muted/35" />
                <Skeleton className="h-10 w-36 rounded-xl bg-muted/35" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

