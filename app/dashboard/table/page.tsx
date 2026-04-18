'use client'

import dynamic from 'next/dynamic'
import { useSearchParams, useRouter } from 'next/navigation'
import { useData } from '@/context/data-provider'
import TradeReplay from '../components/trades/trade-replay'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from "lucide-react"
import { Suspense } from 'react'
import { cn, classifyTrade, ensureExtendedTrade } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { TradeDetailPanel } from '../components/tables/trade-detail-panel'
import { TradeEditPanel } from '../components/tables/trade-edit-panel'
import { TableRouteSkeleton } from '@/components/ui/non-dashboard-skeletons'
import { getBreakEvenThreshold } from '@/lib/metrics/outcome'

// Lazy load the trade table component
const TradeTableReview = dynamic(
  () => import('../components/tables/trade-table-review').then(mod => ({ default: mod.TradeTableReview })),
  { ssr: false }
)



function TableView() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { formattedTrades = [], updateTrades, statistics } = useData()
  const breakEvenThreshold = getBreakEvenThreshold(statistics?.breakEvenThreshold)

  const view = searchParams.get('view')
  const tradeId = searchParams.get('tradeId')
  const backUrl = searchParams.get('backUrl')

  if (view === 'replay' && tradeId) {
    const trade = formattedTrades.find((t: any) => t.id === tradeId)

    if (trade) {
      const isLong = trade.side?.toLowerCase() === 'long' || trade.side?.toLowerCase() === 'buy'
      const outcome = classifyTrade(trade.pnl, breakEvenThreshold)
      const isProfit = outcome === 'win'
      const isLoss = outcome === 'loss'

      return (
        <div className="flex flex-col h-[calc(100vh-120px)] bg-background border border-border/40 rounded-xl overflow-hidden shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between px-3 py-2 border-b shrink-0 bg-muted gap-2">
            {/* Left: Back + Symbol */}
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (backUrl) {
                    router.push(backUrl)
                  } else {
                    router.back()
                  }
                }}
                className="h-8 px-2 text-xs hover:bg-accent/50"
              >
                <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                <span className="hidden sm:inline">Back</span>
              </Button>
              <div className="h-4 w-px bg-border/60 hidden sm:block" />
              <h1 className="text-xs font-bold tracking-tight uppercase text-muted-foreground mr-2">
                {trade.instrument}
              </h1>
              <Badge variant={isLong ? 'default' : 'destructive'} className="text-[10px] px-1.5 py-0 h-4 uppercase font-bold">
                {isLong ? 'Buy' : 'Sell'}
              </Badge>
            </div>

            {/* Right: Trade Info - Responsive grid on mobile */}
            <div className="flex items-center gap-3 sm:gap-6 text-[10px] sm:text-xs overflow-x-auto">
              <div className="flex flex-col items-start sm:items-end shrink-0">
                <span className="text-[9px] uppercase font-bold text-muted-foreground leading-none mb-0.5">Entry/Exit</span>
                <span className="font-mono font-medium leading-none">
                  ${Number(trade.entryPrice).toFixed(2)} → ${trade.closePrice ? Number(trade.closePrice).toFixed(2) : 'OPEN'}
                </span>
              </div>
              <div className="flex flex-col items-start sm:items-end shrink-0 hidden xs:flex">
                <span className="text-[9px] uppercase font-bold text-muted-foreground leading-none mb-0.5">Size</span>
                <span className="font-mono font-medium leading-none">{trade.quantity}</span>
              </div>
              <div className="flex flex-col items-start sm:items-end shrink-0">
                <span className="text-[9px] uppercase font-bold text-muted-foreground leading-none mb-0.5">P&L</span>
                <span className={cn(
                  "font-mono font-bold leading-none",
                  isProfit ? "text-profit" : "text-loss"
                )}>
                  {isProfit ? '+' : ''}${trade.pnl.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-hidden relative bg-card">
            <TradeReplay trade={trade} />
          </div>
        </div>
      )
    }
  }

  if (view === 'details' && tradeId) {
    const trade = formattedTrades.find((t: any) => t.id === tradeId)
    if (trade) {
      return (
        <div className="fixed inset-0 z-50 bg-background">
          <TradeDetailPanel
            trade={trade}
            onClose={() => router.replace('/dashboard/table')}
            basePath="/dashboard/table"
          />
        </div>
      )
    }
  }

  if (view === 'edit' && tradeId) {
    const trade = formattedTrades.find((t: any) => t.id === tradeId)
    if (trade) {
      return (
        <div className="fixed inset-0 z-50 bg-background">
          <TradeEditPanel
            trade={ensureExtendedTrade(trade as any)}
            onClose={() => router.replace('/dashboard/table')}
            onSave={async (data: any) => {
              await updateTrades([tradeId], data)
            }}
          />
        </div>
      )
    }
  }

  return <TradeTableReview />
}

export default function TablePage() {
  const searchParams = useSearchParams()
  const isReplay = searchParams.get('view') === 'replay'

  return (
    <div className="w-full px-3 sm:px-4 md:px-6 py-4">
      <Suspense fallback={<TableRouteSkeleton />}>
        <TableView />
      </Suspense>
    </div>
  )
}
