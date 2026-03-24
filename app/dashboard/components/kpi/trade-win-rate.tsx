'use client'

import React from 'react'
import { WidgetCard } from '../widget-card'
import { CircularProgress } from '@/components/ui/circular-progress'
import { useTradeStatistics } from '@/hooks/use-trade-statistics'
import { Info } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface TradeWinRateProps {
  size?: string
}

const TradeWinRate = React.memo(function TradeWinRate({ size }: TradeWinRateProps) {
  const { winRate, nbWin, nbLoss, nbBreakeven, nbTrades } = useTradeStatistics()

  return (
    <WidgetCard isKpi>
      <div className="h-full flex flex-col justify-between">
        {/* Header with title and info */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            Trade win %
          </span>
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-4 h-4 rounded-full border border-border/60 flex items-center justify-center cursor-help">
                  <Info className="h-2.5 w-2.5 text-muted-foreground/60" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={5} className="max-w-[220px]">
                <p className="text-xs">Percentage of winning trades out of total trades. Break-even shown separately in gauge.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Main content: large value + segmented gauge */}
        <div className="flex items-end justify-between">
          <span className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {winRate.toFixed(2)}%
          </span>

          {/* Segmented gauge showing wins/breakeven/losses */}
          <CircularProgress
            value={winRate}
            size={64}
            strokeWidth={6}
            type="segmented-gauge"
            segments={{ wins: nbWin, breakeven: nbBreakeven, losses: nbLoss }}
            showPercentage={false}
          />
        </div>
      </div>
    </WidgetCard>
  )
})

export default TradeWinRate
