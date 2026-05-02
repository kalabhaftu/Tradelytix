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
} from "recharts"

const AnyAreaChart = AreaChart as any
import { WidgetCard, ChartTooltip as SharedChartTooltip } from '../widget-card'
import { useWidgetData } from '@/hooks/use-widget-data'
import { useDashboardDisplay } from '@/hooks/use-dashboard-display'
import { formatNumber } from "@/lib/utils"
import { WidgetSize } from '@/app/dashboard/types/dashboard'
import { TrendingDown } from "lucide-react"

interface DrawdownChartProps {
  size?: WidgetSize
}

interface DrawdownDataPoint {
  date: string
  drawdown: number
}

const COLORS = {
  loss: 'hsl(var(--chart-loss))',
  grid: 'hsl(var(--border))',
  axis: 'hsl(var(--muted-foreground))'
} as const

function formatAxisValue(value: number): string {
  const absValue = Math.abs(value)
  if (absValue >= 1000000) {
    return `-$${formatNumber(absValue / 1000000, 1)}M`
  }
  if (absValue >= 1000) {
    return `-$${formatNumber(absValue / 1000, 1)}k`
  }
  if (value === 0) return '$0'
  return `-$${formatNumber(absValue, 0)}`
}

interface DrawdownStats {
  maxDrawdown: number
  maxDrawdownPct: number
  longestDurationDays: number
  currentDrawdown: number
}

function computeDrawdownStats(
  drawdownData: DrawdownDataPoint[],
  rawChartData: any[]
): DrawdownStats {
  if (!drawdownData.length) return { maxDrawdown: 0, maxDrawdownPct: 0, longestDurationDays: 0, currentDrawdown: 0 }

  const maxDrawdown = Math.abs(Math.min(...drawdownData.map(d => d.drawdown), 0))
  const currentDrawdown = Math.abs(drawdownData[drawdownData.length - 1]?.drawdown || 0)

  // Compute peak equity to get max DD %
  const pnls = rawChartData.map((p: any) => p.cumulativePnL || 0)
  const peakEquity = Math.max(...pnls, 0)
  const maxDrawdownPct = peakEquity > 0 ? (maxDrawdown / peakEquity) * 100 : 0

  // Compute longest continuous drawdown period
  let longestDurationDays = 0
  let currentDuration = 0
  for (const point of drawdownData) {
    if (point.drawdown < 0) {
      currentDuration++
      if (currentDuration > longestDurationDays) longestDurationDays = currentDuration
    } else {
      currentDuration = 0
    }
  }

  return { maxDrawdown, maxDrawdownPct, longestDurationDays, currentDrawdown }
}

function StatPill({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[8px] font-black uppercase tracking-[0.18em] text-muted-foreground/50">{label}</span>
      <span className="text-sm font-bold font-mono text-short">{value}</span>
      {sub && <span className="text-[9px] text-muted-foreground/40">{sub}</span>}
    </div>
  )
}

export default function DrawdownChart({ size = 'small-long' }: DrawdownChartProps) {
  const { data: rawChartData, isLoading } = useWidgetData('dailyCumulativePnl')
  const chartData = React.useMemo(() => rawChartData ?? [], [rawChartData])
  const { formatValue, transformValue } = useDashboardDisplay()

  const drawdownData: DrawdownDataPoint[] = React.useMemo(() => {
    if (chartData.length === 0) return []

    let peak = -Infinity
    return chartData.map((point: any) => {
      const cumPnL = point.cumulativePnL || 0
      if (cumPnL > peak) peak = cumPnL
      const drawdown = cumPnL - peak

      return {
        date: point.date,
        drawdown: transformValue(drawdown, { kind: 'money' }) ?? 0,
      }
    })
  }, [chartData, transformValue])

  const stats = React.useMemo(
    () => computeDrawdownStats(drawdownData, chartData),
    [drawdownData, chartData]
  )

  const isCompact = size === 'small' || size === 'small-long'

  if (isLoading) {
    return (
      <WidgetCard title="Drawdown">
        <div className="flex items-center justify-center h-full">
          <div className="animate-pulse w-full h-[200px] bg-muted/20 rounded-xl" />
        </div>
      </WidgetCard>
    )
  }

  if (drawdownData.length === 0) {
    return (
      <WidgetCard title="Drawdown">
        <div className="flex items-center justify-center h-full text-muted-foreground/50 text-sm">
          No trade data available
        </div>
      </WidgetCard>
    )
  }

  return (
    <WidgetCard title="Drawdown">
      <div className="flex flex-col h-full gap-3">
        {/* Stat pills row */}
        <div className="flex items-start gap-6 px-1 pt-1 shrink-0">
          <StatPill
            label="Max Drawdown"
            value={`-$${formatNumber(stats.maxDrawdown, 0)}`}
            sub={stats.maxDrawdownPct > 0 ? `${stats.maxDrawdownPct.toFixed(1)}% of peak` : undefined}
          />
          <StatPill
            label="Longest DD"
            value={stats.longestDurationDays > 0 ? `${stats.longestDurationDays}d` : '—'}
            sub="continuous"
          />
          <StatPill
            label="Current DD"
            value={stats.currentDrawdown > 0 ? `-$${formatNumber(stats.currentDrawdown, 0)}` : 'None'}
          />
        </div>

        {/* Chart */}
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <AnyAreaChart
              data={drawdownData}
              margin={{ top: 8, right: 20, left: 10, bottom: 20 }}
            >
              <defs>
                <linearGradient id="drawdownFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.loss} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={COLORS.loss} stopOpacity={0.05} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke={COLORS.grid}
                strokeOpacity={0.25}
                vertical={false}
              />

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

              <YAxis
                tickFormatter={(value) => formatValue(value, { kind: 'money', compact: true })}
                stroke={COLORS.axis}
                fontSize={isCompact ? 10 : 11}
                tickLine={false}
                axisLine={false}
                width={55}
                domain={[(dataMin: number) => Math.floor(dataMin * 1.1), 0]}
                tickCount={6}
              />

              <ReferenceLine
                y={0}
                stroke={COLORS.axis}
                strokeDasharray="3 3"
                strokeOpacity={0.4}
              />

              <RechartsTooltip
                content={<SharedChartTooltip />}
                cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeDasharray: '3 3' }}
              />

              <Area
                type="monotone"
                dataKey="drawdown"
                stroke={COLORS.loss}
                strokeWidth={2.5}
                fill="url(#drawdownFill)"
                dot={false}
                activeDot={{
                  r: 4,
                  strokeWidth: 2,
                  stroke: 'hsl(var(--background))'
                }}
              />
            </AnyAreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </WidgetCard>
  )
}
