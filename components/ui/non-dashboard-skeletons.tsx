import React from 'react'
import { cn } from '@/lib/utils'

function Shimmer({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg bg-muted/35',
        'before:absolute before:inset-0 before:translate-x-[-100%]',
        'before:bg-gradient-to-r before:from-transparent before:via-muted/30 before:to-transparent',
        'before:animate-[shimmer_2s_ease-in-out_infinite]',
        className
      )}
    />
  )
}

function Surface({ className, children }: { className?: string; children?: React.ReactNode }) {
  return <div className={cn('rounded-2xl border border-border/40 bg-card/50 p-5', className)}>{children}</div>
}

export function PageHeaderSkeleton({
  titleWidth = 'w-44',
  subtitleWidth = 'w-72',
  actionCount = 2,
}: {
  titleWidth?: string
  subtitleWidth?: string
  actionCount?: number
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0 space-y-2">
        <Shimmer className={cn('h-8', titleWidth)} />
        <Shimmer className={cn('h-4', subtitleWidth)} />
      </div>
      <div className="flex items-center gap-2">
        {Array.from({ length: actionCount }).map((_, i) => (
          <Shimmer key={`header-action-${i}`} className="h-9 w-24 rounded-lg" />
        ))}
      </div>
    </div>
  )
}

export function TabBarSkeleton({ tabs = 3 }: { tabs?: number }) {
  return (
    <Surface className="p-3">
      <div className="flex flex-wrap items-center gap-2">
        {Array.from({ length: tabs }).map((_, i) => (
          <Shimmer key={`tab-${i}`} className="h-8 w-24 rounded-md" />
        ))}
      </div>
    </Surface>
  )
}

export function StatsGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <Surface key={`stat-${i}`} className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-2">
              <Shimmer className="h-3 w-20" />
              <Shimmer className="h-7 w-24" />
              <Shimmer className="h-3 w-16" />
            </div>
            <Shimmer className="h-9 w-9 rounded-lg" />
          </div>
        </Surface>
      ))}
    </div>
  )
}

export function ToolbarSkeleton({ items = 3 }: { items?: number }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {Array.from({ length: items }).map((_, i) => (
        <Shimmer
          key={`toolbar-${i}`}
          className={cn(
            'h-9 rounded-lg',
            i === 0 ? 'w-full max-w-md flex-1' : i === 1 ? 'w-32' : 'w-36'
          )}
        />
      ))}
    </div>
  )
}

export function CardsGridSkeleton({ cards = 6 }: { cards?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: cards }).map((_, i) => (
        <Surface key={`card-${i}`} className="p-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <Shimmer className="h-9 w-9 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Shimmer className="h-4 w-36" />
                <Shimmer className="h-3 w-24" />
              </div>
            </div>
            <Shimmer className="h-8 w-28" />
            <Shimmer className="h-4 w-full" />
            <Shimmer className="h-2 w-full rounded-full" />
          </div>
        </Surface>
      ))}
    </div>
  )
}

export function TablePanelSkeleton({ rows = 6, className }: { rows?: number; className?: string }) {
  return (
    <Surface className={cn('overflow-hidden p-0', className)}>
      <div className="border-b border-border/30 px-4 py-3">
        <Shimmer className="h-5 w-52" />
      </div>
      <div className="divide-y divide-border/20">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={`row-${i}`} className="flex items-center justify-between gap-4 px-4 py-3">
            <div className="flex-1 space-y-2">
              <Shimmer className="h-4 w-44" />
              <Shimmer className="h-3 w-24" />
            </div>
            <Shimmer className="h-8 w-24" />
          </div>
        ))}
      </div>
    </Surface>
  )
}

export function FormFieldsSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <Surface>
      <div className="space-y-4">
        {Array.from({ length: fields }).map((_, i) => (
          <div key={`field-${i}`} className="space-y-2">
            <Shimmer className="h-3 w-24" />
            <Shimmer className="h-10 w-full rounded-md" />
          </div>
        ))}
      </div>
    </Surface>
  )
}

export function AccountsRouteSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <PageHeaderSkeleton titleWidth="w-36" subtitleWidth="w-56" />
      <StatsGridSkeleton count={4} />
      <ToolbarSkeleton items={3} />
      <CardsGridSkeleton cards={8} />
    </div>
  )
}

export function JournalRouteSkeleton() {
  return (
    <div className="w-full max-w-full space-y-6 px-4 py-6 sm:px-6">
      <PageHeaderSkeleton titleWidth="w-44" subtitleWidth="w-64" actionCount={2} />
      <StatsGridSkeleton count={4} />
      <ToolbarSkeleton items={3} />
      <CardsGridSkeleton cards={9} />
    </div>
  )
}

export function TableRouteSkeleton() {
  return (
    <div className="space-y-4">
      <PageHeaderSkeleton titleWidth="w-48" subtitleWidth="w-64" actionCount={1} />
      <TablePanelSkeleton rows={8} />
    </div>
  )
}

export function DataRouteSkeleton() {
  return (
    <div className="w-full max-w-full space-y-6 px-4 py-6 sm:px-6">
      <PageHeaderSkeleton titleWidth="w-48" subtitleWidth="w-72" actionCount={0} />
      <TabBarSkeleton tabs={2} />
      <TablePanelSkeleton rows={6} />
    </div>
  )
}

export function BacktestingRouteSkeleton() {
  return (
    <div className="container mx-auto space-y-6 py-6">
      <PageHeaderSkeleton titleWidth="w-48" subtitleWidth="w-64" actionCount={1} />
      <ToolbarSkeleton items={3} />
      <StatsGridSkeleton count={4} />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Surface key={`bt-${i}`} className="h-64" />
        ))}
      </div>
    </div>
  )
}

export function PropFirmDetailRouteSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6">
      <PageHeaderSkeleton titleWidth="w-20" subtitleWidth="w-44" actionCount={0} />
      <StatsGridSkeleton count={4} />
      <Surface>
        <div className="space-y-3">
          <div className="flex justify-between">
            <Shimmer className="h-4 w-32" />
            <Shimmer className="h-4 w-16" />
          </div>
          <Shimmer className="h-3 w-full" />
        </div>
      </Surface>
      <TabBarSkeleton tabs={3} />
      <TablePanelSkeleton rows={5} />
    </div>
  )
}

export function PropFirmTradesRouteSkeleton() {
  return (
    <div className="container mx-auto space-y-6 p-6">
      <PageHeaderSkeleton titleWidth="w-36" subtitleWidth="w-60" actionCount={2} />
      <TabBarSkeleton tabs={4} />
      <StatsGridSkeleton count={4} />
      <TablePanelSkeleton rows={8} />
    </div>
  )
}

export function ReportsRouteSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton titleWidth="w-44" subtitleWidth="w-60" actionCount={2} />
      <TabBarSkeleton tabs={4} />
      <StatsGridSkeleton count={8} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <TablePanelSkeleton rows={5} />
        <TablePanelSkeleton rows={5} />
      </div>
    </div>
  )
}

export function PropFirmTabRouteSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Surface key={`pf-stat-${i}`} className="h-20 p-3" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <TablePanelSkeleton key={`pf-panel-${i}`} rows={4} />
        ))}
      </div>
    </div>
  )
}

export function PayoutsRouteSkeleton() {
  return (
    <div className="container mx-auto space-y-6 p-6">
      <PageHeaderSkeleton titleWidth="w-36" subtitleWidth="w-64" actionCount={1} />
      <StatsGridSkeleton count={3} />
      <TablePanelSkeleton rows={6} />
    </div>
  )
}

export function SettingsRouteSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6">
      <PageHeaderSkeleton titleWidth="w-40" subtitleWidth="w-64" actionCount={0} />
      <TabBarSkeleton tabs={3} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <FormFieldsSkeleton fields={4} />
        <FormFieldsSkeleton fields={4} />
      </div>
    </div>
  )
}

export function ImportRouteSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-6">
      <PageHeaderSkeleton titleWidth="w-44" subtitleWidth="w-72" actionCount={0} />
      <StatsGridSkeleton count={3} />
      <Surface className="h-72" />
      <Surface className="h-96" />
    </div>
  )
}

export function EntityListSkeleton({ items = 3 }: { items?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: items }).map((_, i) => (
        <Surface key={`entity-${i}`} className="p-4">
          <div className="flex items-center gap-3">
            <Shimmer className="h-5 w-5 rounded" />
            <div className="flex-1 space-y-2">
              <Shimmer className="h-5 w-48" />
              <Shimmer className="h-4 w-32" />
            </div>
          </div>
        </Surface>
      ))}
    </div>
  )
}
