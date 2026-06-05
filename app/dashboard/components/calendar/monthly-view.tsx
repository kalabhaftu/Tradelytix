'use client'

import React, { memo, useMemo } from "react"
import {
  format,
  isSameMonth,
  isToday,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  getISOWeek,
} from "date-fns"
import { cn } from "@/lib/utils"
import { useMediaQuery } from "@/hooks/use-media-query"
import { useDashboardDisplay } from "@/hooks/use-dashboard-display"

import { CalendarData } from "@/app/dashboard/types/calendar"
import { useCalendarViewStore } from "@/store/calendar-view"
import { useUserStore } from "@/store/user-store"
import { calculateDailyStats } from "./calendar-utils"
import { useData } from '@/context/data-provider'
import { classifyOutcome, getBreakEvenThreshold } from '@/lib/metrics/outcome'
import { getTradeNetPnl } from '@/lib/metrics/pnl'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

const formatCompact = (value: number) => {
  if (Math.abs(value) >= 1000) return `$${(value / 1000).toFixed(2)}K`
  return `$${value.toFixed(0)}`
}

// ============================================================================
// Day Cell — exact match to reference images
// ============================================================================
const DayCell = memo(function DayCell({
  date,
  dayData,
  isCurrentMonth,
  hideWeekends,
  isMiniCalendar,
  onClick,
}: {
  date: Date
  dayData: CalendarData[string] | undefined
  isCurrentMonth: boolean
  hideWeekends?: boolean
  isMiniCalendar?: boolean
  onClick?: () => void
}) {
  const { visibleStats } = useCalendarViewStore()
  const { formatValue } = useDashboardDisplay()
  const isTodayDate = isToday(date)
  const { statistics } = useData()
  const breakEvenThreshold = getBreakEvenThreshold(statistics?.breakEvenThreshold)

  const hasTrades = !!dayData && dayData.tradeNumber > 0
  const dayOutcome = dayData ? classifyOutcome(Number(dayData.pnl || 0), breakEvenThreshold) : 'breakeven'
  const isProfit = dayData?.isProfit ?? (dayOutcome === 'win')
  const isLoss = dayData?.isLoss ?? (dayOutcome === 'loss')
  const isBreakEven = dayData?.isBreakEven ?? (!isProfit && !isLoss && hasTrades)

  const winRateValue = useMemo(() => {
    if (!dayData?.trades || dayData.trades.length === 0) return 0
    const winners = dayData.trades.filter(t => classifyOutcome(getTradeNetPnl(t), breakEvenThreshold) === 'win').length
    return (winners / dayData.trades.length) * 100
  }, [dayData, breakEvenThreshold])

  return (
    <div
      onClick={!isMiniCalendar && onClick ? onClick : undefined}
      className={cn(
        "relative flex flex-col items-center justify-center rounded-[4px] md:rounded-[6px] border transition-all duration-150 select-none group h-full",
        // Mini calendar: taller cells so they are properly rectangular not square
        // Advanced calendar: cells fill grid space with minimum height
        isMiniCalendar 
          ? "min-h-[68px] sm:min-h-[76px] lg:min-h-[84px]" 
          : "min-h-[48px] md:min-h-[60px] lg:min-h-[68px] cursor-pointer",

        // No trades — uses theme tokens so it works in any color scheme
        !hasTrades && isCurrentMonth && "bg-muted/5 border-border/20 hover:border-border/40",

        // Profit — green tint via CSS token
        hasTrades && isProfit && "bg-long/10 border-long/30 hover:bg-long/20 hover:border-long/50",

        // Loss — red tint via CSS token
        hasTrades && isLoss && "bg-short/10 border-short/30 hover:bg-short/20 hover:border-short/50",

        // Breakeven — neutral muted tint
        hasTrades && isBreakEven && "bg-muted/30 border-border/30 hover:bg-muted/40",

        // Not current month
        !isCurrentMonth && "opacity-20 pointer-events-none",
        
        // Today styling - applies to both mini and advanced calendar
        isTodayDate && isCurrentMonth && "ring-1 ring-primary ring-offset-0",
      )}
    >
      {/* =======================
          MOBILE & MINI VIEW (Simple)
          ======================= */}
      <div className={cn(
        "flex flex-col items-center justify-center w-full h-full relative p-1",
        !isMiniCalendar && "min-[1024px]:hidden"
      )}>
        {/* Centered Date Number for Simple View */}
        <span
          className={cn(
            "text-xs md:text-sm font-bold leading-none",
            isTodayDate && isCurrentMonth
              ? "text-primary-foreground bg-primary rounded-full w-5 h-5 md:w-6 md:h-6 flex items-center justify-center text-[10px] md:text-xs"
              : "text-foreground/80",
          )}
        >
          {format(date, 'd')}
        </span>
        
        {/* Mini P&L indicator for cells with trades */}
        {hasTrades && (
          <span
            className={cn(
              "text-[9px] md:text-[10px] font-bold mt-0.5 leading-none",
              isProfit ? "text-long" : isLoss ? "text-short" : "text-muted-foreground"
            )}
          >
            {dayData && dayData.pnl !== undefined && formatValue(dayData.pnl, { kind: 'money', compact: true, rValue: dayData.dailyRMultiple ?? null, emptyLabel: '$0' })}
          </span>
        )}
      </div>

      {/* =======================
          DESKTOP VIEW (Detailed)
          ======================= */}
      <div className={cn(
        "hidden flex-col w-full h-full relative p-2 justify-center items-center",
        !isMiniCalendar && "min-[1024px]:flex"
      )}>
        {/* Day number — top right  */}
        <span
          className={cn(
            "absolute top-1.5 right-1.5 font-bold leading-none",
            isTodayDate
              ? "text-primary-foreground bg-primary rounded-full w-5 h-5 flex items-center justify-center text-[10px]"
              : "text-muted-foreground/60 text-[11px]",
          )}
        >
          {format(date, 'd')}
        </span>

        {/* Main Content Container (P&L, trades, stats) */}
        <div className="flex-grow flex flex-col items-center justify-center w-full pt-4 min-h-0">
          {/* P&L */}
          {hasTrades && visibleStats.pnl && (
            <div
              className={cn(
                "font-extrabold tracking-tight text-center text-xs md:text-sm lg:text-sm xl:text-base",
                isProfit ? "text-long" : isLoss ? "text-short" : "text-foreground"
              )}
            >
              {formatValue(dayData.pnl, { kind: 'money', rValue: dayData.dailyRMultiple ?? null, emptyLabel: '$0' })}
            </div>
          )}

          {/* Trade Count */}
          {hasTrades && visibleStats.trades && (
            <span className="font-semibold leading-none text-muted-foreground/80 text-[10px] md:text-[11px] mt-0.5">
              {dayData.tradeNumber} trade{dayData.tradeNumber !== 1 ? 's' : ''}
            </span>
          )}

          {/* Secondary Stats Row (R & WinRate) */}
          {hasTrades && (visibleStats.rMultiple || visibleStats.winRate) && (
            <div className="flex flex-wrap items-center justify-center gap-1 mt-1 w-full">
              {visibleStats.rMultiple && dayData.dailyRMultiple !== undefined && (
                <span className={cn(
                  "text-[9px] md:text-[10px] font-medium opacity-80 whitespace-nowrap",
                  isProfit ? "text-long" : isLoss ? "text-short" : "text-foreground"
                )}>
                  {dayData.dailyRMultiple.toFixed(2)}R{visibleStats.winRate ? ',' : ''}
                </span>
              )}
              {visibleStats.winRate && (
                <span className={cn(
                  "text-[9px] md:text-[10px] font-medium opacity-80 whitespace-nowrap",
                  isProfit ? "text-long" : isLoss ? "text-short" : "text-foreground"
                )}>
                  {winRateValue.toFixed(1)}%
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
})

// ============================================================================
// Weekly Summary Card — right sidebar (looks like TradeZella's weekly summary)
// ============================================================================
function WeeklySummary({
  weekIndex,
  weekDays,
  calendarData,
  currentDate,
  onReviewWeek,
}: {
  weekIndex: number
  weekDays: Date[]
  calendarData: CalendarData
  currentDate: Date
  onReviewWeek?: (date: Date) => void
}) {
  const { formatValue } = useDashboardDisplay()
  const stats = useMemo(() => {
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

    return { pnl, tradedDays }
  }, [weekDays, calendarData, currentDate])

  const isPositive = stats.pnl >= 0

  return (
    <div
      className={cn(
        "flex h-full min-h-[48px] md:min-h-[60px] flex-col items-start justify-center rounded-[8px] border p-2 md:p-2.5 cursor-pointer transition-all hover:bg-muted/30 group lg:min-h-[68px]",
        "bg-muted/10 border-border/20"
      )}
      onClick={() => onReviewWeek?.(weekDays[0])}
    >
      <span className="text-[11px] font-medium text-muted-foreground/70 mb-0.5">
        Week {weekIndex + 1}
      </span>
      <span
        className={cn(
          "text-sm md:text-base font-bold tracking-tight",
          stats.tradedDays === 0
            ? "text-foreground/60"
            : isPositive
              ? "text-long"
              : "text-short",
        )}
      >
        {stats.tradedDays === 0 ? "$0" : formatValue(stats.pnl, { kind: 'money', compact: true, emptyLabel: '$0' })}
      </span>
      <div className={cn(
        "text-[9px] font-bold mt-1.5 px-1.5 py-0.5 rounded",
        "bg-primary/20 text-primary border border-primary/30"
      )}>
        {stats.tradedDays} day{stats.tradedDays !== 1 ? 's' : ''}
      </div>
    </div>
  )
}

// ============================================================================
// Monthly View — grid + weekly summaries sidebar
// ============================================================================
export default function MonthlyView({
  currentDate,
  calendarData,
  onSelectDate,
  onReviewWeek,
  hideWeekends = false,
  isMiniCalendar = false,
}: {
  currentDate: Date
  calendarData: CalendarData
  onSelectDate?: (date: Date) => void
  onReviewWeek?: (weekDate: Date) => void
  hideWeekends?: boolean
  isMiniCalendar?: boolean
}) {
  const timezone = useUserStore((state) => state.timezone)
  const isCompactAdvancedCalendar = useMediaQuery('(max-width: 1439px)')
  const shouldUseWeekdayOnlyLayout = hideWeekends || (!isMiniCalendar && isCompactAdvancedCalendar)
  // Sunday-start weeks
  const weeks = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 })
    const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 })
    const days = eachDayOfInterval({ start, end })

    const weeksArray = []
    for (let i = 0; i < days.length; i += 7) {
      let weekDays = days.slice(i, i + 7)
      
      // Filter out weekends when explicitly requested or when the advanced
      // calendar switches to its compact weekday-first layout.
      if (shouldUseWeekdayOnlyLayout) {
        weekDays = weekDays.filter(day => {
          const dayIndex = day.getDay()
          return dayIndex !== 0 && dayIndex !== 6
        })
      }
      
      if (weekDays.length > 0) {
        weeksArray.push(weekDays)
      }
    }
    return weeksArray
  }, [currentDate, shouldUseWeekdayOnlyLayout])

  const displayWeekdays = shouldUseWeekdayOnlyLayout 
    ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] 
    : WEEKDAYS
  const isMobile = useMediaQuery('(max-width: 767px)')
  const rowTemplate = isMiniCalendar
    ? `repeat(${weeks.length}, minmax(68px, 1fr))`
    : isMobile
      ? `repeat(${weeks.length}, minmax(48px, 1fr))`
      : `repeat(${weeks.length}, minmax(68px, 1fr))`

  return (
    <div className={cn("flex h-full w-full overflow-hidden flex-col", isMiniCalendar ? "" : "md:flex-row")}>
      {/* Main Calendar Grid Container */}
      <div className={cn("flex flex-col flex-1 h-full min-h-0", isMiniCalendar ? "min-w-[300px]" : "min-w-0")}>
        {/* Weekday Headers */}
        <div className={cn("grid gap-1 md:gap-1.5 px-2 md:px-3 py-1.5 md:py-2 shrink-0", shouldUseWeekdayOnlyLayout ? "grid-cols-5" : "grid-cols-7")}>
          {displayWeekdays.map((day) => (
            <div
              key={day}
              className="text-center text-[10px] md:text-[11px] font-semibold text-muted-foreground/80 capitalize"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Day Grid - flex-1 to fill remaining space, grid-rows set to number of weeks */}
        <div className={cn("flex-1 grid gap-1 md:gap-1.5 p-2 md:p-3 pt-0 min-h-0", shouldUseWeekdayOnlyLayout ? "grid-cols-5" : "grid-cols-7")} style={{ gridTemplateRows: rowTemplate }}>
          {weeks.map((week, weekIndex) => (
            <React.Fragment key={weekIndex}>
              {week.map((date) => {
                const dateKey = format(date, 'yyyy-MM-dd')
                const dayData = calendarData[dateKey]
                const isCurrentMonth = isSameMonth(date, currentDate)
                return (
                  <DayCell
                    key={date.toISOString()}
                    date={date}
                    dayData={dayData}
                    isCurrentMonth={isCurrentMonth}
                    hideWeekends={shouldUseWeekdayOnlyLayout}
                    isMiniCalendar={isMiniCalendar}
                    onClick={() => onSelectDate?.(date)}
                  />
                )
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      {!isMiniCalendar && (
        <div className={cn(
          "shrink-0 flex flex-col border-border/10",
          isMobile 
            ? "w-full border-t p-3 bg-muted/5 gap-2" 
            : "h-full w-[78px] border-l min-[420px]:w-[88px] sm:w-[96px] lg:w-[104px] xl:w-[116px] 2xl:w-[125px] pr-2 md:pr-3 pb-2 md:pb-3"
        )}>
          {/* Desktop Spacer matches weekday-header height exactly */}
          {!isMobile ? (
            <div className="grid px-2 md:px-3 py-1.5 md:py-2 shrink-0 grid-cols-1">
              <div className="text-center text-[10px] md:text-[11px] font-semibold text-muted-foreground/80 capitalize invisible select-none">
                Perf
              </div>
            </div>
          ) : (
            /* Title on mobile view */
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em] mb-1">
              Weekly Performance
            </div>
          )}

          {/* Week rows — grid to align perfectly with calendar rows */}
          <div 
            className={cn(
              "grid gap-1 md:gap-1.5 min-h-0",
              isMobile ? "grid-cols-3 sm:grid-cols-5 w-full" : "flex-1 pt-0 pl-2 md:pl-3"
            )} 
            style={isMobile ? undefined : { gridTemplateRows: rowTemplate }}
          >
            {weeks.map((week, index) => (
              <WeeklySummary
                key={index}
                weekIndex={index}
                weekDays={week}
                calendarData={calendarData}
                currentDate={currentDate}
                onReviewWeek={onReviewWeek}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
