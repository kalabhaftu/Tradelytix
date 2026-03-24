'use client'

import React from 'react'
import { WidgetCard } from '../widget-card'
import { useTradeStatistics } from '@/hooks/use-trade-statistics'
import { Info } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface AvgWinLossProps {
  size?: string
}

const AvgWinLoss = React.memo(function AvgWinLoss({ size }: AvgWinLossProps) {
  const { avgWin, avgLoss, riskRewardRatio } = useTradeStatistics()

  // Calculate the percentage for the progress bar
  const total = avgWin + avgLoss
  const winPercentage = total > 0 ? (avgWin / total) * 100 : 50

  const formatCurrency = (amount: number) => {
    if (Math.abs(amount) >= 1000) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        notation: 'compact',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount)
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <WidgetCard isKpi>
      <div className="h-full flex flex-col justify-between">
        {/* Header with title and info */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            Avg win/loss trade
          </span>
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-4 h-4 rounded-full border border-border/60 flex items-center justify-center cursor-help">
                  <Info className="h-2.5 w-2.5 text-muted-foreground/60" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={5} className="max-w-[200px]">
                <p className="text-xs">Average profit on winning vs losing trades. Higher ratio = better risk/reward.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Main content */}
        <div className="flex flex-col gap-2">
          {/* Large ratio value */}
          <span className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {riskRewardRatio.toFixed(2)}
          </span>

          {/* Horizontal bar with win/loss values */}
          <div className="space-y-1.5">
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden flex">
              <div
                className="h-full bg-profit rounded-l-full transition-all duration-500"
                style={{ width: `${winPercentage}%` }}
              />
              <div
                className="h-full bg-loss rounded-r-full transition-all duration-500"
                style={{ width: `${100 - winPercentage}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-profit">
                {formatCurrency(avgWin)}
              </span>
              <span className="font-semibold text-loss">
                -{formatCurrency(avgLoss)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </WidgetCard>
  )
})

export default AvgWinLoss
