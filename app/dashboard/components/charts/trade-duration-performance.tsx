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

interface TradeDurationPerformanceProps {
  size?: WidgetSize
}

interface DurationData {
  bucket: string
  pnl: number
  trades: number
  wins: number
  losses: number
  winRate: number
  avgPnl: number
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

const BUCKET_ORDER = [
  "< 1min",
  "1-5min",
  "5-15min",
  "15-30min",
  "30min-1hr",
  "1-2hr",
  "2-4hr",
  "4hr+"
] as const



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

function calculateDurationMinutes(entryTime: string, exitTime: string): number {
  const entry = new Date(entryTime).getTime()
  const exit = new Date(exitTime).getTime()
  return (exit - entry) / (1000 * 60)
}

function getDurationBucket(minutes: number): string {
  if (minutes < 1) return "< 1min"
  if (minutes < 5) return "1-5min"
  if (minutes < 15) return "5-15min"
  if (minutes < 30) return "15-30min"
  if (minutes < 60) return "30min-1hr"
  if (minutes < 120) return "1-2hr"
  if (minutes < 240) return "2-4hr"
  return "4hr+"
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function TradeDurationPerformance({ size = 'small-long' }: TradeDurationPerformanceProps) {
  const { statistics } = useData()
  const breakEvenThreshold = getBreakEvenThreshold(statistics?.breakEvenThreshold)
  // ---------------------------------------------------------------------------
  // DATA HOOKS (PRESERVED - DO NOT MODIFY)
  // ---------------------------------------------------------------------------
  const { data: baseData = [], isLoading } = useWidgetData('tradeDurationPerformance')
  const [showAverage, setShowAverage] = React.useState(false)

  const chartData = React.useMemo(() => {
    if (!baseData) return []
    return baseData.map((item: any) => ({
      ...item,
      pnl: showAverage ? item.avgPnl : item.pnl
    }))
  }, [baseData, showAverage])

  if (isLoading) {
    return (
      <WidgetCard title="Duration Performance">
        <div className="flex items-center justify-center h-full">
          <div className="animate-pulse w-full h-[200px] bg-muted/20 rounded-xl" />
        </div>
      </WidgetCard>
    )
  }

  if (baseData.length === 0) {
    return (
      <WidgetCard title="Duration Performance">
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
    <WidgetCard title="Duration Performance">
      <div className="w-full h-full">
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

              {/* X Axis - Duration Buckets */}
              <XAxis
                dataKey="bucket"
                stroke={COLORS.axis}
                fontSize={isCompact ? 9 : 10}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                angle={-20}
                textAnchor="end"
                height={40}
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
                maxBarSize={50}
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
      </div>
    </WidgetCard>
  )
}
