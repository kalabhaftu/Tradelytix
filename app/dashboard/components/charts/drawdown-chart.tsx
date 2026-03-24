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
import { formatNumber } from "@/lib/utils"
import { WidgetSize } from '@/app/dashboard/types/dashboard'

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

export default function DrawdownChart({ size = 'small-long' }: DrawdownChartProps) {
  const { data: rawChartData, isLoading } = useWidgetData('dailyCumulativePnl')
  const chartData = rawChartData || []

  // Compute drawdown from cumulative P&L data
  const drawdownData: DrawdownDataPoint[] = React.useMemo(() => {
    if (chartData.length === 0) return []

    let peak = -Infinity
    return chartData.map((point: any) => {
      const cumPnL = point.cumulativePnL || 0
      if (cumPnL > peak) peak = cumPnL
      const drawdown = cumPnL - peak // Always <= 0

      return {
        date: point.date,
        drawdown,
      }
    })
  }, [chartData])

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
      <ResponsiveContainer width="100%" height="100%">
        <AnyAreaChart
          data={drawdownData}
          margin={{ top: 20, right: 20, left: 10, bottom: 20 }}
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
            tickFormatter={formatAxisValue}
            stroke={COLORS.axis}
            fontSize={isCompact ? 10 : 11}
            tickLine={false}
            axisLine={false}
            width={55}
            domain={['dataMin', 0]}
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
    </WidgetCard>
  )
}
