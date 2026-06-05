'use client'

import React from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { useWidgetData } from '@/hooks/use-widget-data'
import { WidgetCard, ChartTooltip } from '../widget-card'
import { useTheme } from '@/context/theme-provider'

const COLORS = {
  bullish: 'hsl(var(--chart-profit))',
  bearish: 'hsl(var(--chart-loss))',
} as const

export default function EquityCurveWidget() {
  const { data: chartData, isLoading } = useWidgetData('equityCurve')
  const { chartStyle } = useTheme()

  // Split gradient offset — green above zero, red below zero
  const gradientOffset = React.useMemo(() => {
    if (!Array.isArray(chartData) || chartData.length === 0) return 1
    const dataMax = Math.max(...chartData.map((d: any) => d.equity ?? 0))
    const dataMin = Math.min(...chartData.map((d: any) => d.equity ?? 0))
    if (dataMax <= 0) return 0
    if (dataMin >= 0) return 1
    return dataMax / (dataMax - dataMin)
  }, [chartData])

  if (isLoading) {
    return (
      <WidgetCard title="Cumulative Equity Curve">
        <div className="flex items-center justify-center h-full">
          <div className="animate-pulse w-full h-[150px] bg-muted/20 rounded-xl" />
        </div>
      </WidgetCard>
    )
  }

  if (!Array.isArray(chartData) || chartData.length === 0) {
    return (
      <WidgetCard title="Equity Curve">
        <div className="flex items-center justify-center h-full text-muted-foreground/50 text-sm">
          No trade data available
        </div>
      </WidgetCard>
    )
  }

  const isSharp = chartStyle === 'sharp'
  const strokeVal = 'url(#equityStrokeGrad)'
  const fillVal = 'url(#equityFillGrad)'
  const curveType = isSharp ? 'linear' : 'monotone'

  return (
    <WidgetCard title="Cumulative Equity Curve">
      <div className="w-full h-full">
        <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <defs>
            {/* Split gradient for fill */}
            <linearGradient id="equityFillGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLORS.bullish} stopOpacity={0.4} />
              <stop offset={`${gradientOffset * 100}%`} stopColor={COLORS.bullish} stopOpacity={0.05} />
              <stop offset={`${gradientOffset * 100}%`} stopColor={COLORS.bearish} stopOpacity={0.05} />
              <stop offset="100%" stopColor={COLORS.bearish} stopOpacity={0.4} />
            </linearGradient>
            {/* Split gradient for stroke */}
            <linearGradient id="equityStrokeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset={`${gradientOffset * 100}%`} stopColor={COLORS.bullish} />
              <stop offset={`${gradientOffset * 100}%`} stopColor={COLORS.bearish} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border)/0.15)" vertical={false} />
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
            interval="equidistantPreserveStart"
            minTickGap={20}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
            tickFormatter={(v) => `$${v >= 1000 ? `${(v/1000).toFixed(1)}k` : v}`}
            width={50}
          />
          <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" strokeOpacity={0.4} />
          <Tooltip content={<ChartTooltip />} />
          <Area
            type={curveType}
            dataKey="equity"
            stroke={strokeVal}
            strokeWidth={2}
            fill={fillVal}
            dot={false}
            name="Equity"
          />
        </AreaChart>
      </ResponsiveContainer>
      </div>
    </WidgetCard>
  )
}
