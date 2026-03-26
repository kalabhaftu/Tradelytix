import React from 'react'
import { cn } from "@/lib/utils"

/**
 * Unified skeleton system — clean grid blocks matching the widget layout.
 * No art, no decorative shapes. Just shimmer rectangles in a grid.
 */

function SkeletonBlock({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={cn(
        "bg-muted/40 rounded-lg relative overflow-hidden",
        "before:absolute before:inset-0 before:translate-x-[-100%]",
        "before:bg-gradient-to-r before:from-transparent before:via-muted/30 before:to-transparent",
        "before:animate-[shimmer_2s_ease-in-out_infinite]",
        className
      )}
      style={style}
    />
  )
}

/** Skeleton for a single widget card — just a titled block */
function WidgetSkeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div className={cn("bg-muted/10 border border-border/40 rounded-2xl p-5 flex flex-col", className)} style={style}>
      <SkeletonBlock className="h-2 w-24 mb-4" />
      <SkeletonBlock className="flex-1 w-full rounded-xl" />
    </div>
  )
}

/** KPI skeleton — compact block */
function KpiSkeleton() {
  return (
    <div className="bg-muted/10 border border-border/40 rounded-2xl p-4 h-[100px] flex flex-col justify-between">
      <SkeletonBlock className="h-2 w-20" />
      <div className="space-y-2">
        <SkeletonBlock className="h-6 w-28" />
        <SkeletonBlock className="h-2 w-16" />
      </div>
    </div>
  )
}

/**
 * Main Dashboard Skeleton — matches the actual widget grid layout.
 * KPI row → big+medium widgets → 3-col row → 3-col row → full width
 * Clean blocks only. No chart bars, no calendar grids, no table rows.
 */
export function MainDashboardSkeleton() {
  // Legacy generic skeleton kept for non-dashboard reuse.
  // Dashboard runtime now uses TemplateAwareDashboardSkeleton.
  return (
    <div className="px-4 py-4 space-y-3">
      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[0, 1, 2, 3, 4].map(i => <KpiSkeleton key={`kpi-${i}`} />)}
      </div>

      {/* Row 1: Large (8-col) + Medium (4-col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <WidgetSkeleton className="lg:col-span-2 min-h-[280px]" />
        <WidgetSkeleton className="min-h-[280px]" />
      </div>

      {/* Row 2: Small (4-col) + Large (8-col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <WidgetSkeleton className="min-h-[260px]" />
        <WidgetSkeleton className="lg:col-span-2 min-h-[260px]" />
      </div>

      {/* Row 3: 3 equal widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {[0, 1, 2].map(i => <WidgetSkeleton key={`r3-${i}`} className="min-h-[240px]" />)}
      </div>

      {/* Row 4: 2 equal widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {[0, 1].map(i => <WidgetSkeleton key={`r4-${i}`} className="min-h-[240px]" />)}
      </div>

      {/* Row 5: 3 equal widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {[0, 1, 2].map(i => <WidgetSkeleton key={`r5-${i}`} className="min-h-[240px]" />)}
      </div>
    </div>
  )
}

interface TemplateAwareLayoutItem {
  i: string
  x: number
  y: number
  w: number
  h: number
}

export function TemplateAwareDashboardSkeleton({
  layout,
  className,
}: {
  layout: TemplateAwareLayoutItem[]
  className?: string
}) {
  const kpiWidgets = layout
    .filter((item) => item.y === 0)
    .sort((a, b) => a.x - b.x)
    .slice(0, 5)

  const nonKpiWidgets = layout
    .filter((item) => item.y > 0)
    .sort((a, b) => (a.y === b.y ? a.x - b.x : a.y - b.y))

  return (
    <div className={cn("px-3 sm:px-4 pt-3 sm:pt-4 space-y-3", className)}>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
        {Array.from({ length: 5 }).map((_, index) => {
          const hasSlot = kpiWidgets.some((item) => item.x === index)
          return hasSlot ? (
            <KpiSkeleton key={`kpi-${index}`} />
          ) : (
            <div key={`kpi-empty-${index}`} className="h-[100px] rounded-2xl border border-border/20 bg-transparent" />
          )
        })}
      </div>

      <div className="space-y-3 md:hidden">
        {nonKpiWidgets.map((item) => (
          <WidgetSkeleton
            key={item.i}
            className="min-h-[220px]"
            style={{ minHeight: `${Math.max(220, item.h * 76)}px` }}
          />
        ))}
      </div>

      <div
        className="hidden md:grid grid-cols-12 gap-3"
        style={{ gridAutoRows: '76px' }}
      >
        {nonKpiWidgets.map((item) => (
          <WidgetSkeleton
            key={item.i}
            style={{
              gridColumn: `span ${Math.max(1, Math.min(12, item.w))} / span ${Math.max(1, Math.min(12, item.w))}`,
              gridRow: `span ${Math.max(1, item.h)} / span ${Math.max(1, item.h)}`,
            }}
          />
        ))}
      </div>
    </div>
  )
}

/** Generic page skeleton — header + content block */
export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="space-y-2">
          <SkeletonBlock className="h-7 w-48" />
          <SkeletonBlock className="h-4 w-72" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <WidgetSkeleton className="lg:col-span-2 min-h-[400px]" />
          <WidgetSkeleton className="min-h-[400px]" />
        </div>
      </div>
    </div>
  )
}

/** Compact skeleton for small components (sidebar items, lists) */
export function CompactSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array(rows).fill(0).map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <SkeletonBlock className="h-8 w-8 rounded" />
          <div className="flex-1 space-y-1">
            <SkeletonBlock className="h-3 w-3/4" />
            <SkeletonBlock className="h-2 w-1/2" />
          </div>
          <SkeletonBlock className="h-4 w-12" />
        </div>
      ))}
    </div>
  )
}

/** Table page skeleton */
export function TableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <SkeletonBlock className="h-7 w-40" />
        <SkeletonBlock className="h-8 w-32 rounded-lg" />
      </div>
      <div className="bg-muted/10 border border-border/40 rounded-2xl overflow-hidden">
        <SkeletonBlock className="h-10 w-full rounded-none" />
        {[0, 1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-border/20">
            <SkeletonBlock className="h-3 w-20" />
            <SkeletonBlock className="h-3 w-16" />
            <SkeletonBlock className="h-3 w-24 ml-auto" />
          </div>
        ))}
      </div>
    </div>
  )
}

/** Reports page skeleton */
export function ReportsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <SkeletonBlock className="h-7 w-48" />
        <div className="flex gap-2">
          <SkeletonBlock className="h-8 w-20 rounded-lg" />
          <SkeletonBlock className="h-8 w-20 rounded-lg" />
        </div>
      </div>
      <SkeletonBlock className="h-10 w-full rounded-xl" />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {[0, 1, 2, 3, 4, 5].map(i => <WidgetSkeleton key={`rep-${i}`} className="min-h-[260px]" />)}
      </div>
    </div>
  )
}

// Keep DashboardSkeleton for backwards compatibility with variant-based usage
export function DashboardSkeleton({ variant, className }: { variant?: string; className?: string; count?: number; height?: string }) {
  return <WidgetSkeleton className={className} />
}
