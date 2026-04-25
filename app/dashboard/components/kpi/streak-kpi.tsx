'use client'

import React, { useMemo } from 'react'
import { WidgetCard } from '../widget-card'
import { useData } from '@/context/data-provider'
import { cn } from '@/lib/utils'
import { Flame, TrendingUp, TrendingDown } from "lucide-react"
import { calculateTradingOverviewKpis } from '@/lib/dashboard-math'
import { getBreakEvenThreshold } from '@/lib/metrics/outcome'

interface StreakKpiProps {
  size?: string
}

const StreakKpi = React.memo(function StreakKpi({ size }: StreakKpiProps) {
  const { formattedTrades, statistics } = useData()
  const breakEvenThreshold = getBreakEvenThreshold(statistics?.breakEvenThreshold)

  const streakInfo = useMemo(() => {
    if (!formattedTrades || formattedTrades.length === 0) {
      return {
        currentStreak: 0,
        isWinning: true,
        longestWinStreak: 0,
        longestLoseStreak: 0,
      }
    }

    const { streakData } = calculateTradingOverviewKpis(
      formattedTrades as any,
      breakEvenThreshold
    )

    return streakData
  }, [formattedTrades, breakEvenThreshold])

  const streakIcon = streakInfo.isWinning ? TrendingUp : TrendingDown
  const StreakIcon = streakIcon

  return (
    <WidgetCard isKpi>
      <div className="h-full flex flex-col justify-between">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            Trade Streak
          </span>
          <div className={cn(
            "rounded-lg p-1.5 min-[1440px]:p-2",
            streakInfo.currentStreak > 0 && streakInfo.isWinning
              ? "bg-long/10"
              : streakInfo.currentStreak > 0
                ? "bg-short/10"
                : "bg-muted/10"
          )}>
            {streakInfo.currentStreak >= 3 && streakInfo.isWinning ? (
              <Flame className="h-4 w-4 min-[1440px]:h-5 min-[1440px]:w-5 text-long/60" />
            ) : (
              <StreakIcon className={cn(
                "h-4 w-4 min-[1440px]:h-5 min-[1440px]:w-5",
                streakInfo.isWinning ? "text-long/60" : "text-short/60"
              )} />
            )}
          </div>
        </div>

        {/* Main value area */}
        <div className="flex items-end justify-between gap-3">
          <div className="flex flex-col gap-1">
            {/* Current streak */}
            <div className="flex items-baseline gap-1.5">
              <span className={cn(
                "text-[1.65rem] min-[768px]:text-[1.85rem] min-[1440px]:text-3xl font-bold tracking-tight tabular-nums",
                streakInfo.currentStreak === 0
                  ? "text-muted-foreground/50"
                  : streakInfo.isWinning
                    ? "text-long"
                    : "text-short"
              )}>
                {streakInfo.currentStreak}
              </span>
              <span className={cn(
                "text-xs font-bold",
                streakInfo.currentStreak === 0
                  ? "text-muted-foreground/30"
                  : streakInfo.isWinning
                    ? "text-long/60"
                    : "text-short/60"
              )}>
                {streakInfo.isWinning ? 'W' : 'L'}
              </span>
            </div>

            {/* Longest streaks */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground/50">
                Best:
              </span>
              <span className="text-[10px] font-bold text-long/70 tabular-nums">
                {streakInfo.longestWinStreak}W
              </span>
              <span className="text-[10px] text-muted-foreground/20">|</span>
              <span className="text-[10px] font-bold text-short/70 tabular-nums">
                {streakInfo.longestLoseStreak}L
              </span>
            </div>
          </div>
        </div>
      </div>
    </WidgetCard>
  )
})

export default StreakKpi
