'use client'

import React from 'react'
import { WidgetCard } from '../widget-card'
import { CircularProgress } from '@/components/ui/circular-progress'
import { useData } from '@/context/data-provider'
import { BREAK_EVEN_THRESHOLD } from '@/lib/utils'
import { Info } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface DayWinRateProps {
  size?: string
}

const DayWinRate = React.memo(function DayWinRate({ size }: DayWinRateProps) {
  const { calendarData } = useData()

  // Memoize expensive calculation
  const { dayWinRate, winningDays, losingDays, breakEvenDays, totalDays } = React.useMemo(() => {
    const dayEntries = Object.entries(calendarData)
    const total = dayEntries.length
    const winning = dayEntries.filter(([_, data]) => data.pnl > BREAK_EVEN_THRESHOLD).length
    const losing = dayEntries.filter(([_, data]) => data.pnl < -BREAK_EVEN_THRESHOLD).length
    const breakEven = total - winning - losing
    const rate = total > 0 ? Math.round((winning / total) * 1000) / 10 : 0

    return {
      dayWinRate: rate,
      winningDays: winning,
      losingDays: losing,
      breakEvenDays: breakEven,
      totalDays: total
    }
  }, [calendarData])

  return (
    <WidgetCard isKpi>
      <div className="h-full flex flex-col justify-between">
        {/* Header with title and info */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            Day win %
          </span>
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-4 h-4 rounded-full border border-border/60 flex items-center justify-center cursor-help">
                  <Info className="h-2.5 w-2.5 text-muted-foreground/60" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={5} className="max-w-[200px]">
                <p className="text-xs">Percentage of profitable trading days. Shows consistency in daily performance.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Main content: large value + segmented gauge */}
        <div className="flex items-end justify-between">
          <span className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {dayWinRate.toFixed(2)}%
          </span>

          {/* Segmented gauge showing wins/breakeven/losses days */}
          <CircularProgress
            value={dayWinRate}
            size={64}
            strokeWidth={6}
            type="segmented-gauge"
            segments={{ wins: winningDays, breakeven: breakEvenDays, losses: losingDays }}
            showPercentage={false}
          />
        </div>
      </div>
    </WidgetCard>
  )
})

export default DayWinRate
