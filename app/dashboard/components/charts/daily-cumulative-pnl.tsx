"use client"

import * as React from "react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  ReferenceLine,
  Tooltip as RechartsTooltip,
  Dot
} from "recharts"

const AnyAreaChart = AreaChart as any
import { Info } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { WidgetCard, ChartTooltip as SharedChartTooltip } from '../widget-card'
import { useWidgetData } from '@/hooks/use-widget-data'
import { useDashboardDisplay } from '@/hooks/use-dashboard-display'
import { formatNumber } from "@/lib/utils"
import { WidgetSize } from '@/app/dashboard/types/dashboard'

// ============================================================================
// TYPES
// ============================================================================

interface DailyCumulativePnLProps {
  size?: WidgetSize
}

interface ChartDataPoint {
  date: string
  cumulativePnL: number
  dailyPnL: number
  trades: number
}

// ============================================================================
// CONSTANTS - Tradezella Premium Styling
// ============================================================================

const COLORS = {
  profit: 'hsl(var(--chart-profit))',
  loss: 'hsl(var(--chart-loss))',
  grid: 'hsl(var(--border))',
  axis: 'hsl(var(--muted-foreground))'
} as const

const CHART_CONFIG = {
  gridOpacity: 0.25,
  referenceLineOpacity: 0.4,
  strokeWidth: 2.5
} as const



// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function formatAxisValue(value: number): string {
  const absValue = Math.abs(value)
  if (absValue >= 1000000) {
    return `${value < 0 ? '-' : ''}$${formatNumber(absValue / 1000000, 1)}M`
  }
  if (absValue >= 1000) {
    return `${value < 0 ? '-' : ''}$${formatNumber(absValue / 1000, 1)}k`
  }
  return `${value < 0 ? '-' : ''}$${formatNumber(absValue, 0)}`
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function DailyCumulativePnL({ size = 'small-long' }: DailyCumulativePnLProps) {
  const { data: rawChartData, isLoading } = useWidgetData('dailyCumulativePnl')
  const { formatValue, transformValue } = useDashboardDisplay()
  const chartData = React.useMemo(
    () =>
      (rawChartData ?? []).map((item: any) => ({
        ...item,
        cumulativePnL: transformValue(item.cumulativePnL, { kind: 'money' }) ?? 0,
        dailyPnL: transformValue(item.dailyPnL, { kind: 'money' }) ?? 0,
      })),
    [rawChartData, transformValue]
  )

  // ---------------------------------------------------------------------------
  // GRADIENT OFFSET CALCULATION (PRESERVED - DO NOT MODIFY)
  // ---------------------------------------------------------------------------
  const gradientOffset = React.useMemo(() => {
    if (chartData.length === 0) return 0

    const dataMax = Math.max(...chartData.map((i: any) => i.cumulativePnL))
  const dataMin = Math.min(...chartData.map((i: any) => i.cumulativePnL))

    if (dataMax <= 0) return 0
    if (dataMin >= 0) return 1

    return dataMax / (dataMax - dataMin)
  }, [chartData])

  const isCompact = size === 'small' || size === 'small-long'

  if (isLoading) {
    return (
      <WidgetCard title="Cumulative P/L">
        <div className="flex items-center justify-center h-full">
          <div className="animate-pulse w-full h-[200px] bg-muted/20 rounded-xl" />
        </div>
      </WidgetCard>
    )
  }

  if (chartData.length === 0) {
    return (
      <WidgetCard title="Cumulative P/L">
        <div className="flex items-center justify-center h-full text-muted-foreground/50 text-sm">
          No trade data available
        </div>
      </WidgetCard>
    )
  }

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------
  return (
    <WidgetCard title="Cumulative P/L">
                  <ResponsiveContainer width="100%" height="100%">
            <AnyAreaChart
              data={chartData}
              margin={{ top: 20, right: 20, left: 10, bottom: 20 }}
            >
              {/* Gradient Definitions */}
              <defs>
                {/* Split gradient for area fill */}
                <linearGradient id="cumulativeFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS.profit} stopOpacity={0.5} />
                  <stop offset={`${gradientOffset * 100}%`} stopColor={COLORS.profit} stopOpacity={0.1} />
                  <stop offset={`${gradientOffset * 100}%`} stopColor={COLORS.loss} stopOpacity={0.1} />
                  <stop offset="100%" stopColor={COLORS.loss} stopOpacity={0.5} />
                </linearGradient>

                {/* Split gradient for stroke */}
                <linearGradient id="cumulativeStroke" x1="0" y1="0" x2="0" y2="1">
                  <stop offset={`${gradientOffset * 100}%`} stopColor={COLORS.profit} />
                  <stop offset={`${gradientOffset * 100}%`} stopColor={COLORS.loss} />
                </linearGradient>
              </defs>

              {/* Subtle Grid - Horizontal Only */}
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={COLORS.grid}
                strokeOpacity={CHART_CONFIG.gridOpacity}
                vertical={false}
              />

              {/* X Axis - Dates */}
              <XAxis
                dataKey="date"
                tickFormatter={(value) => {
                  const date = new Date(value + 'T00:00:00Z')
                  return date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    timeZone: 'UTC'
                  })
                }}
                stroke={COLORS.axis}
                fontSize={isCompact ? 10 : 11}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={40}
              />

              {/* Y Axis - Currency */}
              <YAxis
                tickFormatter={(value) => formatValue(value, { kind: 'money', compact: true })}
                stroke={COLORS.axis}
                fontSize={isCompact ? 10 : 11}
                tickLine={false}
                axisLine={false}
                width={55}
              />

              {/* Zero Reference Line */}
              <ReferenceLine
                y={0}
                stroke={COLORS.axis}
                strokeDasharray="3 3"
                strokeOpacity={CHART_CONFIG.referenceLineOpacity}
              />

              {/* Tooltip */}
              <RechartsTooltip
                content={<SharedChartTooltip />}
                cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeDasharray: '3 3' }}
              />

              {/* Area with Gradient Fill */}
              <Area
                type="monotone"
                dataKey="cumulativePnL"
                stroke="url(#cumulativeStroke)"
                strokeWidth={CHART_CONFIG.strokeWidth}
                fill="url(#cumulativeFill)"
                dot={false}
                activeDot={{
                  r: 4,
                  strokeWidth: 2,
                  stroke: 'hsl(var(--background))'
                }}
              />
            </AnyAreaChart>
          </ResponsiveContainer>
    </WidgetCard>
  )
}
