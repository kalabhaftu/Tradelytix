'use client'

import React, { useMemo, useState, useEffect } from 'react'
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  isSameMonth
} from 'date-fns'
import { useData } from '@/context/data-provider'
import { useWidgetData } from '@/hooks/use-widget-data'
import { useDashboardDisplay } from '@/hooks/use-dashboard-display'
import { useTheme } from '@/context/theme-provider'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { cn } from '@/lib/utils'
import { Info, TrendingUp, Briefcase } from 'lucide-react'

// Custom compact tooltip for mobile chart to prevent viewport overflow
interface CustomTooltipProps {
  active?: boolean
  payload?: any[]
  label?: string
  formatValue: (val: number, options: any) => string
}

function MobileChartTooltip({ active, payload, label, formatValue }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null

  return (
    <div className="bg-[#0d1117] border border-gray-800 p-2.5 rounded-lg shadow-xl relative z-50">
      <p className="text-[9px] uppercase font-bold text-muted-foreground mb-1">
        {label}
      </p>
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center justify-between gap-3 text-xs">
          <span className="font-medium text-gray-400">
            {entry.name}:
          </span>
          <span className="font-mono font-bold text-white">
            {formatValue(entry.value, { kind: 'money' })}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function MobileDashboard() {
  const [mounted, setMounted] = useState(false)
  const [chartMode, setChartMode] = useState<'cumulative' | 'balance'>('cumulative')
  
  const { statistics, formattedTrades, calendarData } = useData()
  const { mode: displayMode, formatValue, getTradeRMultipleInfo } = useDashboardDisplay()
  const { chartStyle } = useTheme()

  // Widget Data hooks
  const { data: equityCurveData, isLoading: equityCurveLoading } = useWidgetData('equityCurve')
  const { data: strategiesData = [] } = useWidgetData('pnlByStrategy')
  const { data: timeOfDayData = [] } = useWidgetData('timeOfDayPerformance')
  const { data: accountProgressionData, isLoading: accountProgressionLoading } = useWidgetData('accountProgression')

  // Set mounted state on client to prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // 1. Weekly Performance Cards Calculation
  const currentDate = useMemo(() => new Date(), [])
  const weeks = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 })
    const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 })
    const days = eachDayOfInterval({ start, end })

    const weeksArray = []
    for (let i = 0; i < days.length; i += 7) {
      const weekDays = days.slice(i, i + 7)
      weeksArray.push(weekDays)
    }
    return weeksArray
  }, [currentDate])

  const weeklyStatsList = useMemo(() => {
    if (!calendarData) return []
    return weeks.map((weekDays, index) => {
      let pnl = 0
      let tradedDays = 0

      weekDays.forEach((day) => {
        if (!isSameMonth(day, currentDate)) return
        const key = format(day, 'yyyy-MM-dd')
        const data = calendarData[key]
        if (data && data.tradeNumber > 0) {
          pnl += data.pnl
          tradedDays++
        }
      })

      return {
        weekIndex: index,
        pnl,
        tradedDays,
        isPositive: pnl >= 0
      }
    })
  }, [weeks, calendarData, currentDate])

  // 2. Metrics Table Calculation
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

    // Drawdown from equityCurve data
    let maxDrawdown = 0
    let peak = 0
    const drawdowns: number[] = []

    const chartPoints = Array.isArray(equityCurveData) ? equityCurveData : []
    for (const point of chartPoints) {
      const equity = point.equity || 0
      if (equity > peak) peak = equity
      const dd = peak - equity
      if (dd > 0) drawdowns.push(dd)
      if (dd > maxDrawdown) maxDrawdown = dd
    }

    const avgDrawdown = drawdowns.length > 0
      ? drawdowns.reduce((sum, d) => sum + d, 0) / drawdowns.length
      : 0

    const rCoverage = formattedTrades.reduce(
      (acc, trade) => {
        const rInfo = getTradeRMultipleInfo(trade)
        if (rInfo.hasData && rInfo.value !== null) {
          acc.total += rInfo.value
          acc.valid += 1
        }
        acc.all += 1
        return acc
      },
      { total: 0, valid: 0, all: 0 }
    )

    return {
      totalTrades,
      profitFactor,
      expectancy,
      maxDrawdown,
      avgDrawdown,
      fees,
      net: netPnl,
      rCoverage,
      winRate: statistics.winRate || 0,
      avgWin: statistics.averageWin || 0,
      avgLoss: Math.abs(statistics.averageLoss || 0),
    }
  }, [statistics, formattedTrades, equityCurveData, getTradeRMultipleInfo])

  // 3. Account Curve Chart Calculation
  const chartData = useMemo(() => {
    if (!accountProgressionData) return []
    if (chartMode === 'balance') {
      return (accountProgressionData.balance || []).map((item: any) => ({
        date: item.date,
        value: item.balance,
      }))
    }
    return (accountProgressionData.cumulative || []).map((item: any) => ({
      date: item.date,
      value: item.cumulativePnL,
    }))
  }, [accountProgressionData, chartMode])

  const accountCurveSummary = accountProgressionData?.summary || {}

  // 4. Strategy Performance Calculation
  const topStrategies = useMemo(() => {
    if (!Array.isArray(strategiesData)) return []
    return [...strategiesData]
      .sort((a: any, b: any) => Math.abs(Number(b.pnl || 0)) - Math.abs(Number(a.pnl || 0)))
      .slice(0, 5)
  }, [strategiesData])

  // 5. Time of Day Intensity Calculation
  const activeHours = timeOfDayData.filter((item: any) => item.trades > 0)
  const maxHourPnL = Math.max(...activeHours.map((item: any) => Math.abs(Number(item.pnl || 0))), 1)

  if (!mounted) return null

  return (
    <div className="w-full max-w-md mx-auto space-y-4 px-2.5 pb-28 text-foreground select-none">
      
      {/* SECTION 1: WEEKLY PERFORMANCE CARDS (ISOLATED STACKING CONTEXT) */}
      <section className="relative isolate z-10 p-3.5 rounded-2xl bg-[#0d1117]/90 border border-gray-800 shadow-md">
        <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 mb-2.5">
          Weekly Performance
        </h2>
        <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
          {weeklyStatsList.map((week, index) => (
            <div
              key={week.weekIndex}
              className={cn(
                "flex flex-col items-start justify-between rounded-xl border p-2.5 min-h-[72px] transition-all bg-[#161b22]/50 border-gray-800",
                index >= 3 && "col-span-1" // Wraps nicely into a 3x2 grid layout
              )}
            >
              <span className="text-[8px] font-bold text-muted-foreground/60 uppercase tracking-wider">
                Week {week.weekIndex + 1}
              </span>
              <span
                className={cn(
                  "text-xs sm:text-sm font-extrabold tracking-tight mt-1",
                  week.tradedDays === 0
                    ? "text-muted-foreground/40"
                    : week.isPositive
                      ? "text-[#83b885]"
                      : "text-[#c4572a]"
                )}
              >
                {week.tradedDays === 0 ? "$0.00" : formatValue(week.pnl, { kind: 'money', compact: true, emptyLabel: '$0.00' })}
              </span>
              <div className="text-[8px] font-black mt-1.5 px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 shadow-sm shrink-0">
                {week.tradedDays} {week.tradedDays === 1 ? 'day' : 'days'}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 2: PERFORMANCE METRICS TABLE (ISOLATED STACKING CONTEXT) */}
      <section className="relative isolate z-10 p-3.5 rounded-2xl bg-[#0d1117]/90 border border-gray-800 shadow-md">
        <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 mb-2.5">
          Performance
        </h2>
        {stats ? (
          <div className="flex flex-col divide-y divide-gray-800/60">
            {[
              { label: 'Total trades', value: String(stats.totalTrades), tone: null },
              { label: 'Win rate', value: `${stats.winRate.toFixed(1)}%`, tone: null },
              {
                label: 'Profit factor',
                value: stats.profitFactor.toFixed(2),
                tone: stats.profitFactor >= 1 ? 'good' : 'bad'
              },
              {
                label: 'Expectancy',
                value: formatValue(stats.expectancy, {
                  kind: displayMode === 'rMultiple' ? 'rMultiple' : 'money',
                  rValue: displayMode === 'rMultiple' ? stats.rCoverage.total / Math.max(stats.totalTrades, 1) : null
                }),
                tone: stats.expectancy > 0 ? 'good' : stats.expectancy < 0 ? 'bad' : null
              },
              {
                label: 'Max drawdown',
                value: formatValue(stats.maxDrawdown * -1, { kind: 'money' }),
                tone: stats.maxDrawdown > 0 ? 'bad' : null
              },
              {
                label: 'Avg drawdown',
                value: formatValue(stats.avgDrawdown * -1, { kind: 'money' }),
                tone: stats.avgDrawdown > 0 ? 'bad' : null
              }
            ].map((row, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between py-2 text-xs"
              >
                <span className="text-muted-foreground/90 font-medium">{row.label}</span>
                <span
                  className={cn(
                    "font-bold font-mono tracking-tight",
                    row.tone === 'good' && "text-[#83b885]",
                    row.tone === 'bad' && "text-[#c4572a]",
                    row.tone === null && "text-white"
                  )}
                >
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-20 items-center justify-center text-xs text-muted-foreground">
            No statistics data available
          </div>
        )}
      </section>

      {/* SECTION 3: ACCOUNT CURVE CHART (ISOLATED STACKING CONTEXT & SAFE BLURS) */}
      <section className="relative isolate z-10 p-3.5 rounded-2xl bg-[#0d1117]/90 border border-gray-800 shadow-md">
        <div className="flex items-center justify-between mb-3.5">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">
            Account Curve
          </h2>
          {/* Custom segmented toggle designed specifically to avoid absolute layout shifts */}
          <div className="flex rounded-lg border border-gray-800 bg-[#161b22]/50 p-0.5">
            {[
              { key: 'cumulative', label: 'P&L' },
              { key: 'balance', label: 'Balance' }
            ].map((opt) => (
              <button
                key={opt.key}
                onClick={() => setChartMode(opt.key as any)}
                className={cn(
                  "h-5 rounded-md px-2 text-[9px] font-black uppercase tracking-wider transition-colors",
                  chartMode === opt.key
                    ? "bg-white text-black font-extrabold shadow-sm"
                    : "text-muted-foreground hover:text-white"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {accountProgressionLoading ? (
          <div className="flex h-[180px] items-center justify-center text-xs text-muted-foreground">
            Loading chart...
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex h-[180px] items-center justify-center text-xs text-muted-foreground">
            No curve data yet
          </div>
        ) : (
          <div className="space-y-4">
            {/* Chart Wrapper Container (Locked widths, strict stacking) */}
            <div className="w-full h-[160px] relative overflow-hidden">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 5, right: 5, bottom: 5, left: -22 }}
                >
                  <defs>
                    <linearGradient id="mobileCurveFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#83b885" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#83b885" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f2937" opacity={0.3} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 9, fill: '#6b7280' }}
                    axisLine={false}
                    tickLine={false}
                    dy={5}
                  />
                  <YAxis
                    tick={{ fontSize: 9, fill: '#6b7280' }}
                    axisLine={false}
                    tickLine={false}
                    width={40}
                  />
                  <Tooltip
                    content={
                      <MobileChartTooltip
                        formatValue={formatValue}
                      />
                    }
                    cursor={{ stroke: '#374151', strokeWidth: 1 }}
                  />
                  <Area
                    type={chartStyle === 'sharp' ? 'linear' : 'monotone'}
                    dataKey="value"
                    name={chartMode === 'balance' ? 'Balance' : 'Cumulative P&L'}
                    stroke="#83b885"
                    strokeWidth={2}
                    fill="url(#mobileCurveFill)"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Flat, responsive Grid of Metrics (Zero overlapping wrappers) */}
            <div className="grid grid-cols-2 gap-2 bg-[#161b22]/30 p-2.5 rounded-xl border border-gray-800/40">
              {[
                {
                  label: 'Avg win',
                  value: formatValue(stats?.avgWin || 0, { kind: 'money' }),
                  colorClass: 'text-[#83b885]'
                },
                {
                  label: 'Avg loss',
                  value: formatValue((stats?.avgLoss || 0) * -1, { kind: 'money' }),
                  colorClass: 'text-[#c4572a]'
                },
                {
                  label: 'Fees',
                  value: formatValue(Math.abs(stats?.fees || 0) * -1, { kind: 'money' }),
                  colorClass: stats?.fees !== 0 ? 'text-[#c4572a]' : 'text-gray-400'
                },
                {
                  label: 'Net P&L',
                  value: formatValue(Number(accountCurveSummary.net || 0), { kind: 'money' }),
                  colorClass: Number(accountCurveSummary.net || 0) >= 0 ? 'text-[#83b885]' : 'text-[#c4572a]'
                }
              ].map((item, idx) => (
                <div key={idx} className="flex flex-col justify-center min-w-0 border-l border-gray-800/60 pl-2">
                  <span className="text-[8px] font-black uppercase tracking-wider text-muted-foreground/80">
                    {item.label}
                  </span>
                  <span className={cn("text-xs font-mono font-extrabold mt-0.5 truncate", item.colorClass)}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* SECTION 4: STRATEGY PERFORMANCE (ISOLATED STACKING CONTEXT) */}
      <section className="relative isolate z-10 p-3.5 rounded-2xl bg-[#0d1117]/90 border border-gray-800 shadow-md">
        <div className="flex items-center justify-between mb-3.5">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">
            Strategy Performance
          </h2>
          <span className="text-[9px] font-bold text-muted-foreground/60 uppercase">P&L / WR</span>
        </div>
        <div className="flex flex-col divide-y divide-gray-800/60">
          {topStrategies.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">No strategy data yet</p>
          ) : (
            topStrategies.map((strategy: any) => (
              <div
                key={strategy.strategy}
                className="flex items-center justify-between py-2 text-xs"
              >
                <div className="flex flex-col min-w-0 pr-2">
                  <span className="font-extrabold text-white truncate">{strategy.strategy || 'No Strategy'}</span>
                  <span className="text-[9px] text-muted-foreground mt-0.5 font-medium">
                    {strategy.trades} trades / {Number(strategy.profitFactor || 0).toFixed(2)} PF
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={cn(
                      "font-mono font-bold text-xs",
                      strategy.pnl >= 0 ? "text-[#83b885]" : "text-[#c4572a]"
                    )}
                  >
                    {formatValue(strategy.pnl || 0, { kind: 'money' })}
                  </span>
                  <span className="font-mono text-xs font-medium text-gray-400 min-w-[32px] text-right">
                    {Number(strategy.winRate || 0).toFixed(0)}%
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* SECTION 5: TIME OF DAY HEATMAP (ISOLATED STACKING CONTEXT & FLAT 6-COL GRID) */}
      <section className="relative isolate z-10 p-3.5 rounded-2xl bg-[#0d1117]/90 border border-gray-800 shadow-md">
        <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 mb-1.5">
          Time of Day
        </h2>
        <p className="text-[8px] font-bold text-muted-foreground/50 uppercase tracking-wider mb-3">
          New York Time · 24h Heatmap
        </p>
        
        {timeOfDayData.length === 0 ? (
          <div className="flex h-20 items-center justify-center text-xs text-muted-foreground">
            No hourly data yet
          </div>
        ) : (
          <div className="grid grid-cols-6 gap-1.5">
            {timeOfDayData.map((item: any) => {
              const intensity = Math.max(0.12, Math.abs(Number(item.pnl || 0)) / maxHourPnL)
              const hasTrades = item.trades > 0
              
              return (
                <div
                  key={item.hour}
                  className={cn(
                    "rounded-lg border px-1 py-1.5 flex flex-col items-center justify-center transition-all border-gray-800/40",
                    !hasTrades && "bg-gray-950/20 opacity-30",
                    hasTrades && item.pnl >= 0 && "bg-[#83b885]/10 border-[#83b885]/20",
                    hasTrades && item.pnl < 0 && "bg-[#c4572a]/10 border-[#c4572a]/20"
                  )}
                  style={{
                    opacity: hasTrades ? 0.55 + intensity * 0.45 : undefined
                  }}
                >
                  <span className="font-mono text-[8px] font-bold text-white">
                    {String(item.hour).padStart(2, '0')}:00
                  </span>
                  <span className="text-[7.5px] font-black mt-0.5 text-muted-foreground/80">
                    {item.trades || 0}T
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </section>
      
    </div>
  )
}
