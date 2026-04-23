'use client'

import React from 'react'
import { WidgetCard } from '../widget-card'
import { useData } from '@/context/data-provider'
import { useWidgetData } from '@/hooks/use-widget-data'
import { cn } from '@/lib/utils'
import { Info, Wallet } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useTradeStatistics } from '@/hooks/use-trade-statistics'
import { getPnlDisplayLabel } from '@/lib/metrics/pnl'

interface AccountBalancePnlProps {
  size?: string
}

const AccountBalancePnl = React.memo(function AccountBalancePnl({ size }: AccountBalancePnlProps) {
  const { accountNumbers } = useData()
  const { data: balanceInfo } = useWidgetData('accountBalancePnl')
  const { nbTrades } = useTradeStatistics()

  const totalBalance = balanceInfo?.displayBalance ?? balanceInfo?.currentBalance ?? 0
  const displayedPnl = balanceInfo?.displayPnL ?? balanceInfo?.netPnL ?? 0
  const pnlDisplayLabel = getPnlDisplayLabel(balanceInfo?.pnlDisplayMode)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const formatCompactCurrency = (amount: number) => {
    if (Math.abs(amount) >= 1000000) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        notation: 'compact',
        minimumFractionDigits: 2,
      }).format(amount)
    }
    return formatCurrency(amount)
  }

  return (
    <WidgetCard isKpi>
      <div className="h-full flex flex-col justify-between">
        {/* Header row with title, info, and trade count badge */}
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              Account Balance & PnL
            </span>
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="w-4 h-4 rounded-full border border-border/60 flex items-center justify-center cursor-help">
                    <Info className="h-2.5 w-2.5 text-muted-foreground/60" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={5} className="max-w-[200px]">
                  <p className="text-xs">
                    {accountNumbers && accountNumbers.length > 0
                      ? `Balance for ${accountNumbers.length} selected account${accountNumbers.length > 1 ? 's' : ''}.`
                      : 'Current total balance across all accounts.'}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          {/* Trade count badge */}
          {nbTrades > 0 && (
            <div className="ml-auto flex items-center gap-1 rounded-full bg-muted/50 px-2 py-0.5">
              <span className="text-xxs font-semibold text-muted-foreground">{nbTrades}</span>
            </div>
          )}
        </div>

        {/* Main value area */}
        <div className="flex items-end justify-between gap-3">
          <div className="flex flex-col gap-1">
            {/* Large balance number */}
            <span className="text-[1.65rem] min-[768px]:text-[1.85rem] min-[1440px]:text-3xl font-bold tracking-tight text-foreground">
              {formatCompactCurrency(totalBalance)}
            </span>
            
            {/* Net PnL below */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">{pnlDisplayLabel}:</span>
              <span className={cn(
                "text-sm font-semibold",
                displayedPnl >= 0 ? "text-profit" : "text-loss"
              )}>
                {displayedPnl >= 0 ? '+' : ''}{formatCompactCurrency(displayedPnl)}
              </span>
            </div>
          </div>

          {/* Chart icon */}
          <div className="rounded-lg bg-primary/10 p-1.5 min-[1440px]:p-2">
            <Wallet className="h-4 w-4 min-[1440px]:h-5 min-[1440px]:w-5 text-primary/60" />
          </div>
        </div>
      </div>
    </WidgetCard>
  )
})

export default AccountBalancePnl
