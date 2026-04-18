'use client'

import React, { useMemo } from "react"
import {
  format,
  eachMonthOfInterval,
  startOfYear,
  endOfYear,
  getMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  startOfMonth,
  endOfMonth,
  isToday,
} from "date-fns"
import { cn, formatCurrency } from "@/lib/utils"
import { CalendarData } from "@/app/dashboard/types/calendar"
import { useData } from "@/context/data-provider"
import { classifyOutcome, getBreakEvenThreshold } from "@/lib/metrics/outcome"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

// ============================================================================
// Mini Month — compact heatmap with visible day numbers
// ============================================================================
function MiniMonth({
  monthDate,
  calendarData,
  year,
  breakEvenThreshold,
}: {
  monthDate: Date
  calendarData: CalendarData
  year: number
  breakEvenThreshold: number
}) {
  const stats = useMemo(() => {
    let pnl = 0
    let trades = 0
    Object.entries(calendarData).forEach(([key, data]) => {
      const [kYear, kMonth] = key.split('-').map(Number)
      if (kYear === year && kMonth - 1 === getMonth(monthDate)) {
        pnl += data.pnl
        trades += data.tradeNumber
      }
    })
    return { pnl, trades }
  }, [calendarData, monthDate, year])

  // Sunday-start grid
  const gridDays = useMemo(() => {
    const monthStart = startOfMonth(monthDate)
    const monthEnd = endOfMonth(monthDate)
    const start = startOfWeek(monthStart, { weekStartsOn: 0 })
    const end = endOfWeek(monthEnd, { weekStartsOn: 0 })
    return eachDayOfInterval({ start, end })
  }, [monthDate])

  return (
    <div className="flex flex-col gap-2 p-3 md:p-4 rounded-xl border border-border/30 bg-card/30 hover:bg-card/50 transition-all group">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-black tracking-tight text-muted-foreground/70 group-hover:text-foreground transition-colors italic">
          {format(monthDate, 'MMMM')}
        </span>
        {stats.trades > 0 && (
          <span
            className={cn(
              "text-[10px] font-black px-1.5 py-0.5 rounded border",
              classifyOutcome(stats.pnl, breakEvenThreshold) === 'win'
                ? "bg-long/10 border-long/20 text-long"
                : classifyOutcome(stats.pnl, breakEvenThreshold) === 'loss'
                  ? "bg-short/10 border-short/20 text-short"
                  : "bg-muted/30 border-border/20 text-muted-foreground",
            )}
          >
            {formatCurrency(stats.pnl, 0)}
          </span>
        )}
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-0.5">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="text-[8px] font-bold text-center text-muted-foreground/30 uppercase"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Day Grid */}
      <TooltipProvider>
        <div className="grid grid-cols-7 gap-0.5">
          {gridDays.map((day) => {
            const isCurrentMonth = isSameMonth(day, monthDate)
            const isTodayDate = isToday(day)
            const key = format(day, 'yyyy-MM-dd')
            const data = calendarData[key]
            const hasTrades = data && data.tradeNumber > 0

            return (
              <Tooltip key={key}>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      "aspect-square w-full rounded-[3px] border flex items-center justify-center transition-all text-[8px] font-bold",
                      !isCurrentMonth && "opacity-0 pointer-events-none",

                      // No trades
                      isCurrentMonth &&
                        !hasTrades &&
                        "bg-muted/5 border-transparent text-muted-foreground/20",

                      // Profit — green
                      hasTrades &&
                        classifyOutcome(data.pnl, breakEvenThreshold) === 'win' &&
                        "bg-long/20 border-long/25 text-long/80",

                      // Loss — red/orange
                      hasTrades &&
                        classifyOutcome(data.pnl, breakEvenThreshold) === 'loss' &&
                        "bg-short/20 border-short/25 text-short/80",

                      // Breakeven
                      hasTrades &&
                        classifyOutcome(data.pnl, breakEvenThreshold) === 'breakeven' &&
                        "bg-muted/30 border-border/20 text-muted-foreground/40",

                      // Today
                      isTodayDate &&
                        isCurrentMonth &&
                        "ring-1 ring-primary/60 ring-offset-1 ring-offset-background text-primary",
                    )}
                  >
                    {isCurrentMonth && format(day, 'd')}
                  </div>
                </TooltipTrigger>
                {isCurrentMonth && (
                  <TooltipContent
                    side="top"
                    className="text-[10px] py-1.5 px-2.5 bg-popover/95 backdrop-blur-sm border-border/40 shadow-xl"
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between gap-4">
                        <span className="font-bold text-muted-foreground">
                          {format(day, 'MMM d, yyyy')}
                        </span>
                        {hasTrades && (
                          <span className="bg-muted/50 px-1 rounded text-[9px] font-bold">
                            {data.tradeNumber} trades
                          </span>
                        )}
                      </div>
                      <div
                        className={cn(
                          "font-black text-xs tracking-tight",
                          !hasTrades
                            ? "text-muted-foreground/50"
                            : classifyOutcome(data.pnl, breakEvenThreshold) === 'win'
                              ? "text-long"
                              : classifyOutcome(data.pnl, breakEvenThreshold) === 'loss'
                                ? "text-short"
                                : "text-muted-foreground",
                        )}
                      >
                        {data ? formatCurrency(data.pnl) : '$0.00'}
                      </div>
                    </div>
                  </TooltipContent>
                )}
              </Tooltip>
            )
          })}
        </div>
      </TooltipProvider>
    </div>
  )
}

// ============================================================================
// Yearly View — 12 mini months in responsive grid
// ============================================================================
export default function YearlyView({
  year,
  calendarData,
}: {
  year: number
  calendarData: CalendarData
}) {
  const { statistics } = useData()
  const breakEvenThreshold = getBreakEvenThreshold(statistics?.breakEvenThreshold)
  const months = useMemo(
    () =>
      eachMonthOfInterval({
        start: startOfYear(new Date(year, 0, 1)),
        end: endOfYear(new Date(year, 0, 1)),
      }),
    [year],
  )

  return (
    <div className="h-full overflow-y-auto p-3 md:p-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 max-w-[1600px] mx-auto">
        {months.map((month) => (
          <MiniMonth
            key={month.toISOString()}
            monthDate={month}
            calendarData={calendarData}
            year={year}
            breakEvenThreshold={breakEvenThreshold}
          />
        ))}
      </div>
    </div>
  )
}
