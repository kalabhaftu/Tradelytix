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
  const { winRate, nbWin, nbTrades } = useTradeStatistics()

  // Memoize color calculation
  const color = React.useMemo(() => {
    return winRate >= 50
      ? 'hsl(var(--chart-profit))'
      : 'hsl(var(--chart-loss))'
  }, [winRate])


  return (
    <WidgetCard isKpi>
      <div className="h-full flex items-center justify-between gap-2">
        <div className="flex flex-col gap-0.5 min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-[7px] sm:text-[8px] uppercase font-black tracking-widest text-muted-foreground/60">
              Trade Win %
            </span>
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="w-3 h-3 rounded-full bg-muted flex items-center justify-center cursor-help flex-shrink-0">
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={5} className="max-w-[220px]">
                  <p className="text-xs">Percentage of winning trades out of total trades. Excludes break-even trades from calculation.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <span className="text-lg sm:text-xl font-black font-mono text-foreground tracking-tighter kpi-value">
            {winRate.toFixed(1)}%
          </span>
        </div>

        <div className="flex-shrink-0">
          <CircularProgress
            value={winRate}
            size={40}
            strokeWidth={4}
            color={color}
            showPercentage={false}
            className="sm:w-12 sm:h-12"
          />
        </div>
      </div>
    </WidgetCard>
  )
})

export default TradeWinRate
