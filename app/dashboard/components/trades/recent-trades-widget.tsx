'use client'

import React from 'react'
import { WidgetCard } from '../widget-card'
import { useData } from '@/context/data-provider'
import { cn, BREAK_EVEN_THRESHOLD } from '@/lib/utils'

export default function RecentTradesWidget() {
  const { formattedTrades } = useData()

  // CRITICAL FIX: Group trades first to handle partial closes correctly
  // This ensures partial closes are shown as single trades, not multiple entries
  const { groupTradesByExecution } = require('@/lib/utils')
  const groupedTrades = React.useMemo(() => {
    return groupTradesByExecution(formattedTrades)
  }, [formattedTrades, groupTradesByExecution])

  // All trades sorted newest-first — no hard cap.
  // The container is overflow-y-auto so the widget height controls how many
  // are visible; resizing taller reveals more rows without needing a reload.
  const recentTrades = React.useMemo(() => {
    return groupedTrades
      .sort((a: any, b: any) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime())
  }, [groupedTrades])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date)
  }

  return (
    <WidgetCard title="Recent Trades">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="grid grid-cols-[minmax(70px,0.8fr)_1fr_minmax(70px,0.8fr)] gap-2 pb-2 border-b border-border/30 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 shrink-0">
          <div>Date</div>
          <div className="text-left">Symbol</div>
          <div className="text-right">P&L</div>
        </div>

        {/* Trades List - scrollable with full height utilization */}
        <div className="space-y-0.5 flex-1 min-h-0 overflow-y-auto">
          {recentTrades.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
              <div className="p-3 bg-muted/30 rounded-full mb-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="opacity-50"
                >
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <p className="text-sm font-bold">No recent trades</p>
              <p className="text-[10px] text-muted-foreground/50">Trades you take will appear here</p>
            </div>
          ) : (
            recentTrades.map((trade: any, index: number) => {
              const netPnL = (trade.pnl || 0) - (trade.commission || 0)
              const isProfitable = netPnL > BREAK_EVEN_THRESHOLD
              const isLoss = netPnL < -BREAK_EVEN_THRESHOLD

              return (
                <div
                  key={trade.id || index}
                  className="grid grid-cols-[minmax(70px,0.8fr)_1fr_minmax(70px,0.8fr)] gap-2 py-2 text-xs hover:bg-muted/30 rounded-lg transition-colors px-1 items-center"
                >
                  <div className="text-muted-foreground/60 font-medium">
                    {formatDate(trade.entryDate)}
                  </div>
                  <div className="font-bold truncate text-left" title={trade.symbol || trade.instrument}>
                    {trade.symbol || trade.instrument}
                  </div>
                  <div
                    className={cn(
                      'text-right font-bold font-mono',
                      isProfitable
                        ? 'text-long'
                        : isLoss
                          ? 'text-short'
                          : 'text-muted-foreground'
                    )}
                  >
                    {formatCurrency(netPnL)}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </WidgetCard>
  )
}

