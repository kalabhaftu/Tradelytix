Legacy MainDashboardSkeleton (archived for reuse)
Source: components/ui/dashboard-skeleton.tsx

export function MainDashboardSkeleton() {
  return (
    <div className="px-4 py-4 space-y-3">
      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <KpiSkeleton key={"kpi-" + i} />
        ))}
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
        {[0, 1, 2].map((i) => (
          <WidgetSkeleton key={"r3-" + i} className="min-h-[240px]" />
        ))}
      </div>

      {/* Row 4: 2 equal widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {[0, 1].map((i) => (
          <WidgetSkeleton key={"r4-" + i} className="min-h-[240px]" />
        ))}
      </div>

      {/* Row 5: 3 equal widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <WidgetSkeleton key={"r5-" + i} className="min-h-[240px]" />
        ))}
      </div>
    </div>
  )
}
