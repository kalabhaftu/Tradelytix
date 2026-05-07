'use client'

import React, { useState, useMemo } from 'react'
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  format,
  isToday
} from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, LayoutGrid, Calendar as CalendarIcon, MousePointerClick, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Trade } from '@prisma/client'
import { getTradePnlByMode, getPnlDisplayLabel, normalizePnlDisplayMode } from '@/lib/metrics/pnl'
import { formatCurrency } from '@/lib/utils'
import { useUserStore } from '@/store/user-store'

interface JournalCalendarProps {
  trades: Trade[]
  onDayClick: (date: Date, tradesOfDay: Trade[]) => void
  onDayNoteClick?: (date: Date) => void
}

export function JournalCalendar({ trades, onDayClick, onDayNoteClick }: JournalCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const user = useUserStore(state => state.user)
  const pnlDisplayMode = normalizePnlDisplayMode(user?.pnlDisplayMode)

  const handlePreviousMonth = () => setCurrentDate(prev => subMonths(prev, 1))
  const handleNextMonth = () => setCurrentDate(prev => addMonths(prev, 1))
  const handleToday = () => setCurrentDate(new Date())

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 }) // Sunday start
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 })

    return eachDayOfInterval({ start: startDate, end: endDate })
  }, [currentDate])

  // Group trades by date string (YYYY-MM-DD)
  const tradesByDate = useMemo(() => {
    const grouped = new Map<string, Trade[]>()
    trades.forEach(trade => {
      const rawDate = (trade as any).closeDate || (trade as any).entryDate
      if (!rawDate) return
      const dateStr = format(new Date(rawDate), 'yyyy-MM-dd')
      const existing = grouped.get(dateStr) || []
      grouped.set(dateStr, [...existing, trade])
    })
    return grouped
  }, [trades])

  // Monthly stats
  const monthlyStats = useMemo(() => {
    let totalPnl = 0
    let wins = 0
    let total = 0
    
    // Only count trades in the currently viewed month
    const currentMonthStr = format(currentDate, 'yyyy-MM')
    
    for (const [dateStr, dailyTrades] of tradesByDate.entries()) {
      if (dateStr.startsWith(currentMonthStr)) {
        dailyTrades.forEach(t => {
          const pnl = getTradePnlByMode(t, pnlDisplayMode)
          totalPnl += pnl
          if (pnl > 0) wins++
          total++
        })
      }
    }
    
    return {
      pnl: totalPnl,
      winRate: total > 0 ? (wins / total) * 100 : 0,
      trades: total
    }
  }, [currentDate, tradesByDate, pnlDisplayMode])

  return (
    <div className="flex flex-col space-y-6">
      {/* Calendar Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePreviousMonth} className="h-9 w-9">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={handleToday} className="h-9 font-medium text-xs tracking-wider uppercase">
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={handleNextMonth} className="h-9 w-9">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <h2 className="ml-2 text-xl font-black uppercase tracking-widest">{format(currentDate, 'MMMM yyyy')}</h2>
        </div>
        
        {/* Monthly Summary Chips */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-black">Net P&L</span>
            <span className={cn("text-lg font-black font-mono leading-none tracking-tighter", monthlyStats.pnl >= 0 ? "text-long" : "text-short")}>
              {monthlyStats.pnl >= 0 ? '+' : ''}{formatCurrency(monthlyStats.pnl)}
            </span>
          </div>
          <div className="w-px h-8 bg-border/40 mx-1" />
          <div className="flex flex-col items-end">
            <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-black">Win Rate</span>
            <span className="text-lg font-black font-mono leading-none tracking-tighter text-foreground">
              {monthlyStats.winRate.toFixed(1)}%
            </span>
          </div>
          <div className="w-px h-8 bg-border/40 mx-1" />
          <div className="flex flex-col items-end">
            <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-black">Trades</span>
            <span className="text-lg font-black font-mono leading-none tracking-tighter text-foreground">
              {monthlyStats.trades}
            </span>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <Card className="overflow-hidden border border-border/40 bg-card/40 rounded-2xl">
        <div className="grid grid-cols-7 border-b border-border/40 bg-muted/20">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="py-3 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 auto-rows-fr">
          {calendarDays.map((day, idx) => {
            const dateStr = format(day, 'yyyy-MM-dd')
            const dailyTrades = tradesByDate.get(dateStr) || []
            const isCurrentMonth = isSameMonth(day, currentDate)
            const isCurrentDay = isToday(day)
            
            let dailyPnl = 0
            dailyTrades.forEach(t => dailyPnl += getTradePnlByMode(t, pnlDisplayMode))
            
            const isGreenDay = dailyPnl > 0
            const isRedDay = dailyPnl < 0
            const isBreakEven = dailyPnl === 0 && dailyTrades.length > 0

            return (
              <div
                key={day.toString()}
                onClick={() => onDayClick(day, dailyTrades)}
                className={cn(
                  "min-h-[120px] p-2 border-r border-b border-border/20 relative group transition-colors hover:bg-muted/30 cursor-pointer flex flex-col",
                  !isCurrentMonth && "opacity-40 bg-muted/10",
                  idx % 7 === 6 && "border-r-0",
                  idx >= calendarDays.length - 7 && "border-b-0",
                  isCurrentDay && "bg-primary/5"
                )}
              >
                {/* Date Number */}
                <div className="flex justify-between items-start">
                  <span className={cn(
                    "text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full",
                    isCurrentDay ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                  )}>
                    {format(day, 'd')}
                  </span>
                  
                  {/* Trade Count Badge */}
                  {dailyTrades.length > 0 && (
                    <span className="text-[9px] font-bold text-muted-foreground/60 bg-muted px-1.5 py-0.5 rounded-sm">
                      {dailyTrades.length} {dailyTrades.length === 1 ? 'Trade' : 'Trades'}
                    </span>
                  )}
                </div>

                {/* Day Content (P&L) */}
                <div className="flex-1 flex flex-col justify-end mt-2">
                  {dailyTrades.length > 0 && (
                    <div className={cn(
                      "p-2 rounded-lg border",
                      isGreenDay ? "bg-long/10 border-long/20" :
                      isRedDay ? "bg-short/10 border-short/20" :
                      "bg-muted/50 border-border/40"
                    )}>
                      <p className={cn(
                        "text-sm font-black font-mono tracking-tighter truncate",
                        isGreenDay ? "text-long" : isRedDay ? "text-short" : "text-muted-foreground"
                      )}>
                        {isGreenDay ? '+' : ''}{formatCurrency(dailyPnl)}
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Note button */}
                {isCurrentMonth && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDayNoteClick?.(day)
                    }}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 rounded-md bg-primary/10 hover:bg-primary/20 flex items-center justify-center border border-primary/20"
                    title="Daily note"
                  >
                    <FileText className="h-3 w-3 text-primary" />
                  </button>
                )}

                {/* Hover overlay hint */}
                <div className="absolute inset-0 bg-background/0 group-hover:bg-background/5 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
                  {dailyTrades.length > 0 ? (
                    <span className="bg-background/90 text-foreground border shadow-sm px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1">
                      <MousePointerClick className="w-3 h-3" /> View Day
                    </span>
                  ) : isCurrentMonth ? (
                    <span className="bg-background/90 text-muted-foreground border shadow-sm px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1">
                      <FileText className="w-3 h-3" /> Add Note
                    </span>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
