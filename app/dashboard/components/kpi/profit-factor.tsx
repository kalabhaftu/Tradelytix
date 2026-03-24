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
    // Convert profit factor to percentage for circular progress
    // Map 0-3.0 to 0-100% for better visualization
    const progress = Math.min((profitFactor / 3.0) * 100, 100)
    const colorValue = profitFactor >= 1.0
      ? 'hsl(var(--chart-profit))'
      : 'hsl(var(--chart-loss))'

    return { progressValue: progress, color: colorValue }
  }, [profitFactor])

  return (
    <WidgetCard isKpi>
      <div className="h-full flex flex-col justify-between">
        {/* Header with title and info */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            Profit factor
          </span>
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-4 h-4 rounded-full border border-border/60 flex items-center justify-center cursor-help">
                  <Info className="h-2.5 w-2.5 text-muted-foreground/60" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={5} className="max-w-[220px]">
                <p className="text-xs">Total profits divided by total losses. Values above 1.0 indicate profitability.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Main content: large value + bi-color gauge */}
        <div className="flex items-end justify-between">
          <span className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {profitFactor.toFixed(2)}
          </span>

          {/* Bi-color gauge (green/red arc) */}
          <CircularProgress
            value={progressValue}
            size={64}
            strokeWidth={6}
            color={color}
            type="gauge"
            showPercentage={false}
          />
        </div>
      </div>
    </WidgetCard>
  )
})

export default ProfitFactor
