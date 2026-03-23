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

interface ProfitFactorProps {
  size?: string
}

const ProfitFactor = React.memo(function ProfitFactor({ size }: ProfitFactorProps) {
  const { profitFactor, grossWin, grossLosses } = useTradeStatistics()

  // Memoize expensive calculations
  const { progressValue, color } = React.useMemo(() => {
    // Convert profit factor to percentage for circular progress (capped at 100%)
    // Values above 1.0 are good, so we'll map 0-2.0 to 0-100%
    const progress = Math.min((profitFactor / 2.0) * 100, 100)
    const colorValue = profitFactor >= 1.0
      ? 'hsl(var(--chart-profit))'
      : 'hsl(var(--chart-loss))'

    return { progressValue: progress, color: colorValue }
  }, [profitFactor])


  return (
    <WidgetCard isKpi>
      <div className="h-full flex items-center justify-between gap-2">
        <div className="flex flex-col gap-0.5 min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-[7px] sm:text-[8px] uppercase font-black tracking-widest text-muted-foreground/60">
              Profit factor
            </span>
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="w-3 h-3 rounded-full bg-muted flex items-center justify-center cursor-help flex-shrink-0">
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={5} className="max-w-[220px]">
                  <p className="text-xs">Total profits divided by total losses. Values above 1.0 indicate profitability. Higher values mean better risk management.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <span className="text-lg sm:text-xl font-black font-mono text-foreground tracking-tighter kpi-value">
            {profitFactor.toFixed(2)}
          </span>
        </div>

        <div className="flex-shrink-0">
          <CircularProgress
            value={progressValue}
            size={40}
            strokeWidth={4}
            color={color}
            showPercentage={false}
            type="circle"
            className="sm:w-12 sm:h-12"
          />
        </div>
      </div>
    </WidgetCard>
  )
})

export default ProfitFactor
