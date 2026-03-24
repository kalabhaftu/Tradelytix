'use client'

import React from 'react'
import { WidgetCard } from '../widget-card'
import { useData } from '@/context/data-provider'
import { useWidgetData } from '@/hooks/use-widget-data'
import { cn } from '@/lib/utils'
import { Info } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { calculateBalanceInfo } from '@/lib/utils/balance-calculator'

interface AccountBalancePnlProps {
  size?: string
}

const AccountBalancePnl = React.memo(function AccountBalancePnl({ size }: AccountBalancePnlProps) {
  const { accountNumbers } = useData()
  const { data: balanceInfo } = useWidgetData('accountBalancePnl')

  const totalBalance = balanceInfo?.currentBalance || 0
  const grossPnl = balanceInfo?.totalPnL || 0
  const totalCommissions = Math.abs(balanceInfo?.totalCommissions || 0)
  const netPnl = balanceInfo?.netPnL || 0

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const formatCompactCurrency = (amount: number) => {
    if (Math.abs(amount) >= 1000) {
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
      <div className="h-full flex flex-col justify-center gap-0.5 sm:gap-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[7px] sm:text-[8px] uppercase font-black tracking-widest text-muted-foreground/60 truncate">
            Account Balance & P&L
          </span>
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-3 h-3 rounded-full bg-muted flex items-center justify-center cursor-help flex-shrink-0">
                  <Info className="h-3 w-3 text-muted-foreground" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={5} className="max-w-[200px]">
                <p className="text-xs">
                  {accountNumbers && accountNumbers.length > 0
                    ? `Balance for ${accountNumbers.length} selected account${accountNumbers.length > 1 ? 's' : ''} including trading fees.`
                    : 'Current total balance across all accounts including trading fees.'}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="flex flex-col gap-0">
          <div className="text-lg sm:text-xl font-black font-mono text-foreground tracking-tighter kpi-value">
            {formatCompactCurrency(totalBalance)}
          </div>
          <div className="flex items-center gap-1 text-[9px] sm:text-[10px]">
            <span className={cn(
              "font-bold font-mono",
              netPnl >= 0 ? "text-long" : "text-short"
            )}>
              {netPnl >= 0 ? '+' : ''}{formatCompactCurrency(netPnl)}
            </span>
            <span className="text-muted-foreground/40">net P&L</span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 text-[9px] sm:text-[10px]">
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground/50">P&L:</span>
            <span className={cn(
              "font-bold font-mono",
              grossPnl >= 0 ? "text-long" : "text-short"
            )}>
              {formatCompactCurrency(grossPnl)}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground/50">Fees:</span>
            <span className="font-bold font-mono text-warning">
              -{formatCompactCurrency(totalCommissions)}
            </span>
          </div>
        </div>
      </div>
    </WidgetCard>
  )
})

export default AccountBalancePnl
