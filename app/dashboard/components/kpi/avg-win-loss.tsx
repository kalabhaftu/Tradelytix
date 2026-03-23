'use client'

import React from 'react'
import { WidgetCard } from '../widget-card'
import { useTradeStatistics } from '@/hooks/use-trade-statistics'
import { cn } from '@/lib/utils'
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
  // If avgWin is larger, green takes more space
  const total = avgWin + avgLoss
  const winPercentage = total > 0 ? (avgWin / total) * 100 : 50

  const formatCurrency = (amount: number) => {
    if (Math.abs(amount) >= 1000) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        notation: 'compact',
        minimumFractionDigits: 1,
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
      <div className="h-full flex flex-col justify-center gap-2 sm:gap-3">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-[7px] sm:text-[8px] uppercase font-black tracking-widest text-muted-foreground/60 truncate">
              Avg win/loss trade
            </span>
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="w-3 h-3 rounded-full bg-muted flex items-center justify-center cursor-help flex-shrink-0">
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={5} className="max-w-[200px]">
                  <p className="text-xs">Average profit on winning trades vs average loss on losing trades. Higher ratios indicate better risk/reward management.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <span className="text-lg sm:text-xl font-black font-mono text-foreground tracking-tighter kpi-value">
            {riskRewardRatio.toFixed(2)}
          </span>
        </div>

        {/* Horizontal Progress Bar & Stats */}
        <div className="space-y-1 sm:space-y-1.5">
          <div className="w-full h-1 bg-muted rounded-full overflow-hidden flex">
            <div
              className="h-full bg-long transition-all duration-500"
              style={{ width: `${winPercentage}%` }}
            />
            <div
              className="h-full bg-short transition-all duration-500"
              style={{ width: `${100 - winPercentage}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[9px] sm:text-[10px] font-bold font-mono">
            <span className="text-long">
              {formatCurrency(avgWin)}
            </span>
            <span className="text-short">
              -{formatCurrency(avgLoss)}
            </span>
          </div>
        </div>
      </div>
    </WidgetCard>
  )
})

export default AvgWinLoss
