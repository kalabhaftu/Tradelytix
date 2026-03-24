'use client'

import { useMemo } from 'react'
import { WidgetCard } from '../widget-card'
import { useData } from '@/context/data-provider'
import { cn } from '@/lib/utils'
import { startOfWeek, endOfWeek, parseISO, isWithinInterval, subWeeks, format, getDay } from 'date-fns'
import { Calendar, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react'

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F'] as const

export default function WeeklyTracker() {
  const { formattedTrades } = useData()

  const weekData = useMemo(() => {
    if (!formattedTrades?.length) return null

    const now = new Date()
    const weekStart = startOfWeek(now, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 })
    const prevWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 })
    const prevWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 })

    const thisWeekTrades = formattedTrades.filter(t => {
      if (!t.entryDate) return false
      return isWithinInterval(parseISO(t.entryDate), { start: weekStart, end: weekEnd })
    })

    const prevWeekTrades = formattedTrades.filter(t => {
      if (!t.entryDate) return false
      return isWithinInterval(parseISO(t.entryDate), { start: prevWeekStart, end: prevWeekEnd })
    })

    const weekPnL = thisWeekTrades.reduce((sum, t) => sum + (t.pnl || 0), 0)
    const prevPnL = prevWeekTrades.reduce((sum, t) => sum + (t.pnl || 0), 0)
    const weekWins = thisWeekTrades.filter(t => (t.pnl || 0) > 0).length
    const weekWinRate = thisWeekTrades.length > 0 ? (weekWins / thisWeekTrades.length) * 100 : 0

    // Day-by-day heat for Mon-Fri (getDay: 1=Mon, 5=Fri)
    const dayPnL: number[] = [0, 0, 0, 0, 0]
    const dayHasTrades: boolean[] = [false, false, false, false, false]

    thisWeekTrades.forEach(t => {
      if (!t.entryDate) return
      const dayOfWeek = getDay(parseISO(t.entryDate))
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        dayPnL[dayOfWeek - 1] += t.pnl || 0
        dayHasTrades[dayOfWeek - 1] = true
      }
    })

    const changePercent = prevPnL !== 0 ? ((weekPnL - prevPnL) / Math.abs(prevPnL)) * 100 : 0

    return {
      pnl: weekPnL,
      trades: thisWeekTrades.length,
      winRate: weekWinRate,
      changePercent,
      dayPnL,
      dayHasTrades,
      weekLabel: `${format(weekStart, 'MMM d')} – ${format(weekEnd, 'MMM d')}`,
    }
  }, [formattedTrades])

  if (!weekData) {
    return (
      <WidgetCard title="Weekly Tracker">
        <div className="flex items-center justify-center h-full text-muted-foreground/50 text-sm">
          No trade data available
        </div>
      </WidgetCard>
    )
  }

  return (
    <WidgetCard title="Weekly Tracker">
      <div className="h-full flex flex-col justify-between gap-3">
        {/* P&L + comparison */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Calendar className="h-3 w-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">{weekData.weekLabel}</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={cn(
              "text-xl font-bold font-mono tracking-tight",
              weekData.pnl >= 0 ? "text-long" : "text-short"
            )}>
              {weekData.pnl >= 0 ? '+' : ''}${weekData.pnl.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </span>
            {weekData.changePercent !== 0 && (
              <span className={cn(
                "text-[10px] font-medium flex items-center gap-0.5",
                weekData.changePercent > 0 ? "text-long" : "text-short"
              )}>
                {weekData.changePercent > 0 ? <ArrowUpRight className="h-2.5 w-2.5" /> : <ArrowDownRight className="h-2.5 w-2.5" />}
                {Math.abs(weekData.changePercent).toFixed(0)}% vs last week
              </span>
            )}
          </div>
        </div>

        {/* Quick stats */}
        <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
          <span><strong className="text-foreground font-mono">{weekData.trades}</strong> trades</span>
          <span><strong className="text-foreground font-mono">{weekData.winRate.toFixed(0)}%</strong> win rate</span>
        </div>

        {/* Day heat bar — Mon to Fri */}
        <div className="flex items-end gap-1.5">
          {DAY_LABELS.map((day, i) => {
            const pnl = weekData.dayPnL[i]
            const hasTrades = weekData.dayHasTrades[i]

            return (
              <div key={day} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className={cn(
                    "w-full h-5 rounded-sm transition-colors",
                    !hasTrades && "bg-muted/20",
                    hasTrades && pnl > 0 && "bg-long/60",
                    hasTrades && pnl < 0 && "bg-short/60",
                    hasTrades && pnl === 0 && "bg-muted/40"
                  )}
                />
                <span className="text-[9px] font-medium text-muted-foreground/60">{day}</span>
              </div>
            )
          })}
        </div>
      </div>
    </WidgetCard>
  )
}
