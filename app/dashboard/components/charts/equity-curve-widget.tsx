'use client'

import React from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useWidgetData } from '@/hooks/use-widget-data'
import { WidgetCard, ChartTooltip } from '../widget-card'

const COLORS = {
  bullish: 'hsl(var(--chart-profit))',
  bearish: 'hsl(var(--chart-loss))',
} as const

export default function EquityCurveWidget() {
  const { data: chartData, isLoading } = useWidgetData('equityCurve')

  if (isLoading) {
    return (
      <WidgetCard title="Cumulative Equity Curve">
        <div className="flex items-center justify-center h-full">
          <div className="animate-pulse w-full h-[150px] bg-muted/20 rounded-xl" />
        </div>
      </WidgetCard>
    )
  }

  if (chartData.length === 0) {
    return (
      <WidgetCard title="Equity Curve">
        <div className="flex items-center justify-center h-full text-muted-foreground/50 text-sm">
          No trade data available
        </div>
      </WidgetCard>
    )
  }

  const isPositive = chartData[chartData.length - 1]?.equity >= 0

  return (
    <WidgetCard title="Cumulative Equity Curve">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={isPositive ? COLORS.bullish : COLORS.bearish} stopOpacity={0.3} />
              <stop offset="95%" stopColor={isPositive ? COLORS.bullish : COLORS.bearish} stopOpacity={0} />
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
          <Tooltip content={<ChartTooltip />} />
          <Area
            type="monotone"
            dataKey="equity"
            stroke={isPositive ? COLORS.bullish : COLORS.bearish}
            strokeWidth={2}
            fill="url(#equityGradient)"
            name="Equity"
          />
        </AreaChart>
      </ResponsiveContainer>
    </WidgetCard>
  )
}
