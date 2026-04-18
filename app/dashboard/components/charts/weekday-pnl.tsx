"use client"

import * as React from "react"
import * as RechartsPrimitive from "recharts"
import {
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ReferenceLine
} from "recharts"
import { Info } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { WidgetCard, ChartTooltip as SharedChartTooltip } from '../widget-card'
import { useWidgetData } from "@/hooks/use-widget-data"
import { formatNumber } from "@/lib/utils"
import { WidgetSize } from '@/app/dashboard/types/dashboard'
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useData } from "@/context/data-provider"
import { classifyOutcome, getBreakEvenThreshold } from "@/lib/metrics/outcome"

// ============================================================================
// TYPES
// ============================================================================

interface WeekdayPnLProps {
  size?: WidgetSize
}

interface WeekdayData {
  day: string
  dayName: string
  pnl: number
  trades: number
  wins: number
  losses: number
  winRate: number
}

const AnyBarChart = (RechartsPrimitive as any).BarChart as React.ComponentType<any>

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
  barRadius: [4, 4, 0, 0] as [number, number, number, number],
  referenceLineOpacity: 0.4
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

const WeekdayPnL = React.memo(function WeekdayPnL({ size = 'small-long' }: WeekdayPnLProps) {
  const { statistics } = useData()
  const breakEvenThreshold = getBreakEvenThreshold(statistics?.breakEvenThreshold)
  // ---------------------------------------------------------------------------
  // DATA HOOKS (PRESERVED - DO NOT MODIFY)
  // ---------------------------------------------------------------------------
  const { data: baseData = [], isLoading } = useWidgetData('weekdayPnl')
  const [showAverage, setShowAverage] = React.useState(false)

  const chartData = React.useMemo(() => {
    if (!baseData) return []
    return baseData.map((day: any) => ({
      ...day,
      pnl: showAverage && day.trades > 0 ? day.pnl / day.trades : day.pnl
    }))
  }, [baseData, showAverage])

  if (isLoading) {
    return (
      <WidgetCard title="Weekday P/L">
        <div className="flex items-center justify-center h-full">
          <div className="animate-pulse w-full h-[200px] bg-muted/20 rounded-xl" />
        </div>
      </WidgetCard>
    )
  }

  if (baseData.length === 0) {
    return (
      <WidgetCard title="Weekday P/L">
        <div className="flex items-center justify-center h-full text-muted-foreground/50 text-sm">
          No trade data available
        </div>
      </WidgetCard>
    )
  }

  // ---------------------------------------------------------------------------
  // SIZE-RESPONSIVE VALUES
  // ---------------------------------------------------------------------------
  const isCompact = size === 'small' || size === 'small-long'

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------
  return (
    <WidgetCard title="Weekday P/L">
                  <ResponsiveContainer width="100%" height="100%">
            <AnyBarChart
              data={chartData}
              margin={{ top: 20, right: 20, left: 10, bottom: 20 }}
              barGap={4}
            >
              {/* Subtle Grid - Horizontal Only */}
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={COLORS.grid}
                strokeOpacity={CHART_CONFIG.gridOpacity}
                vertical={false}
              />

              {/* X Axis - Days */}
              <XAxis
                dataKey="dayName"
                tickFormatter={(value) => value.substring(0, 3)}
                stroke={COLORS.axis}
                fontSize={isCompact ? 10 : 11}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />

              {/* Y Axis - Currency */}
              <YAxis
                tickFormatter={formatAxisValue}
                stroke={COLORS.axis}
                fontSize={isCompact ? 10 : 11}
                tickLine={false}
                axisLine={false}
                width={50}
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
                cursor={{ fill: 'hsl(var(--muted)/0.3)' }}
              />

              {/* Bars with Rounded Tops */}
              <Bar
                dataKey="pnl"
                radius={CHART_CONFIG.barRadius}
                maxBarSize={60}
              >
                {chartData.map((entry: any, index: number) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      classifyOutcome(entry.pnl, breakEvenThreshold) === 'win'
                        ? COLORS.profit
                        : classifyOutcome(entry.pnl, breakEvenThreshold) === 'loss'
                          ? COLORS.loss
                          : 'hsl(var(--muted-foreground)/0.4)'
                    }
                  />
                ))}
              </Bar>
            </AnyBarChart>
          </ResponsiveContainer>
    </WidgetCard>
  )
})

export default WeekdayPnL
