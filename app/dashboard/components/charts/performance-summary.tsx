'use client'

import React, { useMemo } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { useWidgetData } from '@/hooks/use-widget-data'
import { useData } from '@/context/data-provider'
import { WidgetCard, ChartTooltip } from '../widget-card'
import { cn } from '@/lib/utils'

const COLORS = {
  bullish: 'hsl(var(--chart-profit))',
  bearish: 'hsl(var(--chart-loss))',
} as const

function formatCurrency(value: number): string {
  const abs = Math.abs(value)
  if (abs >= 1_000_000) return `${value < 0 ? '-' : ''}$${(abs / 1_000_000).toFixed(2)}M`
  if (abs >= 1_000) return `${value < 0 ? '-' : ''}$${(abs / 1_000).toFixed(abs >= 10_000 ? 1 : 2)}K`
  return `${value < 0 ? '-' : ''}$${abs.toFixed(2)}`
}

interface StatItemProps {
  label: string
  value: string
  negative?: boolean
}

function StatItem({ label, value, negative }: StatItemProps) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-b-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={cn(
        "text-sm font-semibold tabular-nums",
        negative === true && "text-[hsl(var(--chart-loss))]",
        negative === false && "text-[hsl(var(--chart-profit))]"
      )}>
        {value}
      </span>
    </div>
  )
}

export default function PerformanceSummaryWidget() {
  const { data: chartData, isLoading: chartLoading } = useWidgetData('equityCurve')
  const { statistics, formattedTrades } = useData()

  const stats = useMemo(() => {
    if (!statistics || !formattedTrades) return null

    const totalTrades = statistics.nbTrades || 0
    const profitFactor = statistics.profitFactor || 0
    const fees = statistics.cumulativeFees || 0
    const grossPnl = statistics.cumulativePnl || 0
    const netPnl = grossPnl - Math.abs(fees)
    const expectancy = totalTrades > 0
      ? ((statistics.averageWin * statistics.nbWin) - (Math.abs(statistics.averageLoss) * statistics.nbLoss)) / totalTrades
      : 0

    // Calculate max drawdown and avg drawdown from equity curve data
    let maxDrawdown = 0
    let peak = 0
    const drawdowns: number[] = []

    if (Array.isArray(chartData) && chartData.length > 0) {
      for (const point of chartData) {
        const equity = point.equity || 0
        if (equity > peak) peak = equity
        const dd = peak - equity
        if (dd > 0) drawdowns.push(dd)
        if (dd > maxDrawdown) maxDrawdown = dd
      }
    }

    const avgDrawdown = drawdowns.length > 0
      ? drawdowns.reduce((sum, d) => sum + d, 0) / drawdowns.length
      : 0

    return {
      totalTrades,
      profitFactor,
      expectancy,
      maxDrawdown,
      avgDrawdown,
      fees,
      net: netPnl,
    }
  }, [statistics, formattedTrades, chartData])

  if (chartLoading) {
    return (
      <WidgetCard title="Performance">
        <div className="flex items-center justify-center h-full">
          <div className="animate-pulse w-full h-[200px] bg-muted/20 rounded-xl" />
        </div>
      </WidgetCard>
    )
  }

  // Split gradient offset — green above zero, red below zero
  const gradientOffset = useMemo(() => {
    if (!Array.isArray(chartData) || chartData.length === 0) return 1
    const dataMax = Math.max(...chartData.map((d: any) => d.equity ?? 0))
    const dataMin = Math.min(...chartData.map((d: any) => d.equity ?? 0))
    if (dataMax <= 0) return 0
    if (dataMin >= 0) return 1
    return dataMax / (dataMax - dataMin)
  }, [chartData])

  return (
    <WidgetCard title="Performance">
      <div className="flex h-full gap-0">
        {/* Left: Equity Chart (takes ~65% width) */}
        <div className="flex-1 min-w-0 h-full pr-3">
          {Array.isArray(chartData) && chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  {/* Split gradient for fill */}
                  <linearGradient id="perfFillGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS.bullish} stopOpacity={0.4} />
                    <stop offset={`${gradientOffset * 100}%`} stopColor={COLORS.bullish} stopOpacity={0.05} />
                    <stop offset={`${gradientOffset * 100}%`} stopColor={COLORS.bearish} stopOpacity={0.05} />
                    <stop offset="100%" stopColor={COLORS.bearish} stopOpacity={0.4} />
                  </linearGradient>
                  {/* Split gradient for stroke */}
                  <linearGradient id="perfStrokeGrad" x1="0" y1="0" x2="0" y2="1">
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
                  minTickGap={30}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(v) => `$${v >= 1000 ? `${(v/1000).toFixed(0)}K` : v}`}
                  width={50}
                />
                <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" strokeOpacity={0.4} />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="equity"
                  stroke="url(#perfStrokeGrad)"
                  strokeWidth={2}
                  fill="url(#perfFillGrad)"
                  dot={false}
                  name="Equity"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground/50 text-sm">
              No trade data available
            </div>
          )}
        </div>

        {/* Right: Stats Sidebar (fixed width) */}
        <div className="w-[160px] shrink-0 flex flex-col justify-center pl-3 border-l border-border/30">
          {stats ? (
            <>
              <StatItem label="Total trades" value={String(stats.totalTrades)} />
              <StatItem label="Profit factor" value={stats.profitFactor.toFixed(2)} negative={stats.profitFactor < 1} />
              <StatItem
                label="Trade expectancy"
                value={formatCurrency(stats.expectancy)}
                negative={stats.expectancy < 0 ? true : stats.expectancy > 0 ? false : undefined}
              />
              <StatItem
                label="Max drawdown"
                value={`-${formatCurrency(stats.maxDrawdown)}`}
                negative={stats.maxDrawdown > 0 ? true : undefined}
              />
              <StatItem
                label="Avg drawdown"
                value={`-${formatCurrency(stats.avgDrawdown)}`}
                negative={stats.avgDrawdown > 0 ? true : undefined}
              />
              <StatItem
                label="Fees"
                value={`-${formatCurrency(Math.abs(stats.fees))}`}
                negative={stats.fees !== 0 ? true : undefined}
              />
              <StatItem
                label="Net"
                value={formatCurrency(stats.net)}
                negative={stats.net < 0 ? true : stats.net > 0 ? false : undefined}
              />
            </>
          ) : (
            <div className="text-xs text-muted-foreground text-center">No data</div>
          )}
        </div>
      </div>
    </WidgetCard>
  )
}
