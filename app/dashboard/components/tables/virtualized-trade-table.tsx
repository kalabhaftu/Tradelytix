'use client'

import React, { memo, useMemo } from 'react'
import type { TradeType } from '@/lib/db/schema/trades';

import { Badge } from "@/components/ui/badge"
import { cn, formatQuantity, classifyTrade } from "@/lib/utils"
import { formatTradePrice } from '@/lib/trading/precision'
import { ArrowUpRight, ArrowDownRight } from "lucide-react"
import { formatTimeInZone } from '@/lib/time-utils'
import { useUserStore } from '@/store/user-store'
import { List } from 'react-window'

interface VirtualizedTradeTableProps {
  trades: Trade[]
  onTradeClick?: (trade: Trade) => void
  selectedTrades?: Set<string>
  onTradeSelect?: (tradeId: string) => void
}

const ROW_HEIGHT = 60 // Height of each row in pixels

// Memoized row component for better performance
const TradeRow = memo(({ trade, isSelected, onTradeClick, onTradeSelect }: {
  trade: Trade
  isSelected: boolean
  onTradeClick?: (trade: Trade) => void
  onTradeSelect?: (tradeId: string) => void
}) => {
  const timezone = useUserStore((state) => state.timezone)
  const outcome = classifyTrade(trade.pnl)
  const pnlColor = outcome === 'win' ? 'text-long' :
    outcome === 'loss' ? 'text-short' :
      'text-muted-foreground'

  const Icon = outcome === 'win' ? ArrowUpRight : ArrowDownRight

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onTradeClick?.(trade)
    }
  }

  return (
    <div
      role="row"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className={cn(
        "flex items-center gap-4 px-4 py-3 border-b cursor-pointer hover:bg-muted/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        isSelected && "bg-accent"
      )}
      onClick={() => onTradeClick?.(trade)}
      style={{ height: ROW_HEIGHT }}
    >
      {/* Checkbox */}
      {onTradeSelect && (
        <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              onTradeSelect(trade.id)
            }}
            className="h-4 w-4 cursor-pointer focus:ring-primary"
            aria-label={`Select trade in ${trade.instrument || trade.symbol || 'unknown instrument'}`}
          />
        </div>
      )}

      {/* Symbol/Instrument */}
      <div className="flex-shrink-0 w-24">
        <Badge variant="outline" className="font-mono text-xs">
          {trade.instrument || trade.symbol}
        </Badge>
      </div>

      {/* Side */}
      <div className="flex-shrink-0 w-16">
        <Badge
          variant="outline"
          className={cn(
            "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5",
            trade.side?.toLowerCase() === 'buy' || trade.side?.toLowerCase() === 'long'
              ? "bg-long/10 text-long border-long/20"
              : "bg-short/10 text-short border-short/20"
          )}
        >
          {trade.side || 'N/A'}
        </Badge>
      </div>

      {/* Entry Price */}
      <div className="flex-shrink-0 w-28 text-right text-sm font-mono">
        {formatTradePrice(trade.entryPrice, trade.instrument)}
      </div>

      {/* Close Price */}
      <div className="flex-shrink-0 w-28 text-right text-sm font-mono">
        {formatTradePrice(trade.closePrice, trade.instrument)}
      </div>

      {/* Quantity */}
      <div className="flex-shrink-0 w-20 text-right text-sm">
        {formatQuantity(trade.quantity)}
      </div>

      {/* P&L */}
      <div className={cn("flex-shrink-0 w-32 text-right font-semibold flex items-center justify-end gap-1", pnlColor)}>
        <Icon className="h-3 w-3" />
        ${trade.pnl.toFixed(2)}
      </div>

      {/* Account */}
      <div className="flex-shrink-0 w-28 text-sm text-muted-foreground truncate">
        {trade.accountNumber}
      </div>

      {/* Date */}
      <div className="flex-shrink-0 w-32 text-sm text-muted-foreground">
        {formatTimeInZone(trade.entryDate, 'MMM dd, yyyy', timezone)}
      </div>
    </div>
  )
}, (prev, next) => {
  // Only re-render if trade data or selection changed
  return prev.trade.id === next.trade.id &&
    prev.isSelected === next.isSelected
})

TradeRow.displayName = 'TradeRow'

// Row component wrapper for react-window List
const VirtualizedRow = memo(({
  index,
  style,
  trades,
  selectedTrades,
  onTradeClick,
  onTradeSelect
}: {
  index: number
  style: React.CSSProperties
  trades: Trade[]
  selectedTrades: Set<string>
  onTradeClick?: (trade: Trade) => void
  onTradeSelect?: (tradeId: string) => void
}): React.ReactElement | null => {
  const trade = trades[index]
  if (!trade) return null

  return (
    <div style={style}>
      <TradeRow
        trade={trade}
        isSelected={selectedTrades.has(trade.id)}
        onTradeClick={onTradeClick}
        onTradeSelect={onTradeSelect}
      />
    </div>
  )
})

VirtualizedRow.displayName = 'VirtualizedRow'

export const VirtualizedTradeTable = memo(function VirtualizedTradeTable({
  trades,
  onTradeClick,
  selectedTrades = new Set(),
  onTradeSelect
}: VirtualizedTradeTableProps) {

  // Calculate container height (max 800px or viewport height - 200px)
  const containerHeight = Math.min(800, typeof window !== 'undefined' ? window.innerHeight - 200 : 800)

  if (trades.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No trades to display
      </div>
    )
  }

  return (
    <div className="border rounded-lg sm:rounded-xl overflow-hidden">
      {/* Header - hide on mobile, show condensed on tablet */}
      <div className="hidden md:flex items-center gap-4 px-4 py-3 bg-muted/50 border-b font-semibold text-sm">
        {onTradeSelect && <div className="flex-shrink-0 w-4" />}
        <div className="flex-shrink-0 w-24">Symbol</div>
        <div className="flex-shrink-0 w-16">Side</div>
        <div className="flex-shrink-0 w-28 text-right">Entry</div>
        <div className="flex-shrink-0 w-28 text-right">Close</div>
        <div className="flex-shrink-0 w-20 text-right">Qty</div>
        <div className="flex-shrink-0 w-32 text-right">P&L</div>
        <div className="flex-shrink-0 w-28">Account</div>
        <div className="flex-shrink-0 w-32">Date</div>
      </div>

      {/* Mobile header - simplified */}
      <div className="flex md:hidden items-center justify-between px-3 py-2 bg-muted/50 border-b text-xs font-semibold text-muted-foreground">
        <span>Trades</span>
        <span>{trades.length} total</span>
      </div>

      {/* Virtualized Trades List */}
      <div className="overflow-x-auto">
        <div style={{ minWidth: 980, height: containerHeight }}>
          <List
            rowCount={trades.length}
            rowHeight={ROW_HEIGHT}
            rowComponent={VirtualizedRow as any}
            rowProps={{
              trades,
              selectedTrades,
              onTradeClick,
              onTradeSelect
            }}
            style={{ height: containerHeight, width: '100%' }}
          />
        </div>
      </div>

      {/* Footer with count */}
      <div className="px-3 sm:px-4 py-2 border-t bg-muted/30 text-xs sm:text-sm text-muted-foreground text-center">
        Showing {trades.length} trade{trades.length !== 1 ? 's' : ''}
      </div>
    </div>
  )
})

export default VirtualizedTradeTable
