'use client'

import { useMemo, useRef } from 'react'
import { cn, formatCurrency } from '@/lib/utils'
import { getTradeNetPnl } from '@/lib/metrics/pnl'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Printer } from 'lucide-react'

interface StatementViewProps {
  trades: any[]
  dateRange?: { from: Date; to: Date } | null
}

export function StatementView({ trades, dateRange }: StatementViewProps) {
  const printRef = useRef<HTMLDivElement>(null)

  const { sortedTrades, summary } = useMemo(() => {
    if (!trades || trades.length === 0) return { sortedTrades: [], summary: null }

    const sorted = [...trades].sort((a: any, b: any) => {
      const dateA = new Date(a.closeDate || a.entryDate || 0).getTime()
      const dateB = new Date(b.closeDate || b.entryDate || 0).getTime()
      return dateA - dateB
    })

    let grossProfit = 0
    let grossLoss = 0
    let totalCommission = 0
    let totalNet = 0
    let wins = 0
    let losses = 0

    sorted.forEach((t: any) => {
      const pnl = Number(t.pnl || 0)
      const commission = Math.abs(Number(t.commission || 0))
      const net = getTradeNetPnl(t)

      totalCommission += commission
      totalNet += net

      if (pnl > 0) { grossProfit += pnl; wins++ }
      else if (pnl < 0) { grossLoss += Math.abs(pnl); losses++ }
    })

    return {
      sortedTrades: sorted,
      summary: {
        totalTrades: sorted.length,
        grossProfit,
        grossLoss,
        totalCommission,
        totalNet,
        wins,
        losses,
        winRate: sorted.length > 0 ? (wins / sorted.length) * 100 : 0,
        profitFactor: grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0,
      }
    }
  }, [trades])

  const handlePrint = () => {
    const el = printRef.current
    if (!el) return

    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    printWindow.document.write(`
      <html>
        <head>
          <title>Trading Statement</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 24px; color: #111; font-size: 11px; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th { background: #f5f5f5; font-weight: 700; text-transform: uppercase; font-size: 9px; letter-spacing: 0.1em; padding: 8px 6px; text-align: left; border-bottom: 2px solid #ddd; }
            td { padding: 6px; border-bottom: 1px solid #eee; font-size: 10px; }
            .mono { font-family: 'SF Mono', 'Fira Code', monospace; }
            .right { text-align: right; }
            .center { text-align: center; }
            .green { color: #16a34a; }
            .red { color: #dc2626; }
            .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 20px 0; }
            .summary-card { border: 1px solid #eee; border-radius: 6px; padding: 10px; }
            .summary-label { font-size: 8px; text-transform: uppercase; letter-spacing: 0.15em; color: #888; font-weight: 700; }
            .summary-value { font-size: 16px; font-weight: 800; margin-top: 4px; font-family: monospace; }
            h1 { font-size: 18px; margin: 0; font-weight: 800; }
            .subtitle { font-size: 11px; color: #666; margin-top: 2px; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          ${el.innerHTML}
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => printWindow.print(), 300)
  }

  if (!summary || sortedTrades.length === 0) return null

  const firstDate = sortedTrades[0]?.closeDate || sortedTrades[0]?.entryDate
  const lastDate = sortedTrades[sortedTrades.length - 1]?.closeDate || sortedTrades[sortedTrades.length - 1]?.entryDate

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] uppercase font-black text-muted-foreground tracking-[0.2em]">Statement View</h3>
        <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5 text-xs font-bold">
          <Printer className="h-3.5 w-3.5" />
          Print / Export PDF
        </Button>
      </div>

      <div ref={printRef} className="bg-background border border-border/40 rounded-2xl p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>Trading Statement</h1>
          <p className="text-xs text-muted-foreground mt-1">
            {firstDate && lastDate
              ? `${format(new Date(firstDate), 'MMM dd, yyyy')} — ${format(new Date(lastDate), 'MMM dd, yyyy')}`
              : 'All Time'
            }
            {' · '}{summary.totalTrades} trades
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="border border-border/20 rounded-lg p-3">
            <p className="text-[8px] uppercase font-bold text-muted-foreground/50 tracking-widest">Net P&L</p>
            <p className={cn("text-lg font-black font-mono mt-1", summary.totalNet >= 0 ? "text-long" : "text-short")}>
              {summary.totalNet >= 0 ? '+' : ''}{formatCurrency(summary.totalNet)}
            </p>
          </div>
          <div className="border border-border/20 rounded-lg p-3">
            <p className="text-[8px] uppercase font-bold text-muted-foreground/50 tracking-widest">Win Rate</p>
            <p className="text-lg font-black font-mono mt-1">{summary.winRate.toFixed(1)}%</p>
            <p className="text-[9px] text-muted-foreground">{summary.wins}W / {summary.losses}L</p>
          </div>
          <div className="border border-border/20 rounded-lg p-3">
            <p className="text-[8px] uppercase font-bold text-muted-foreground/50 tracking-widest">Profit Factor</p>
            <p className={cn("text-lg font-black font-mono mt-1", summary.profitFactor >= 1 ? "text-long" : "text-short")}>
              {summary.profitFactor === Infinity ? '∞' : summary.profitFactor.toFixed(2)}
            </p>
          </div>
          <div className="border border-border/20 rounded-lg p-3">
            <p className="text-[8px] uppercase font-bold text-muted-foreground/50 tracking-widest">Total Fees</p>
            <p className="text-lg font-black font-mono text-short mt-1">{formatCurrency(summary.totalCommission)}</p>
          </div>
        </div>

        {/* Gross Breakdown */}
        <div className="grid grid-cols-2 gap-3">
          <div className="border border-border/20 rounded-lg p-3">
            <p className="text-[8px] uppercase font-bold text-muted-foreground/50 tracking-widest">Gross Profit</p>
            <p className="text-base font-black font-mono text-long mt-1">+{formatCurrency(summary.grossProfit)}</p>
          </div>
          <div className="border border-border/20 rounded-lg p-3">
            <p className="text-[8px] uppercase font-bold text-muted-foreground/50 tracking-widest">Gross Loss</p>
            <p className="text-base font-black font-mono text-short mt-1">-{formatCurrency(summary.grossLoss)}</p>
          </div>
        </div>

        {/* Trade Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-border/30">
                <th className="text-left px-3 py-2.5 text-[9px] font-black uppercase tracking-widest text-muted-foreground">#</th>
                <th className="text-left px-3 py-2.5 text-[9px] font-black uppercase tracking-widest text-muted-foreground">Date</th>
                <th className="text-left px-3 py-2.5 text-[9px] font-black uppercase tracking-widest text-muted-foreground">Instrument</th>
                <th className="text-center px-3 py-2.5 text-[9px] font-black uppercase tracking-widest text-muted-foreground">Side</th>
                <th className="text-right px-3 py-2.5 text-[9px] font-black uppercase tracking-widest text-muted-foreground">Qty</th>
                <th className="text-right px-3 py-2.5 text-[9px] font-black uppercase tracking-widest text-muted-foreground">Entry</th>
                <th className="text-right px-3 py-2.5 text-[9px] font-black uppercase tracking-widest text-muted-foreground">Exit</th>
                <th className="text-right px-3 py-2.5 text-[9px] font-black uppercase tracking-widest text-muted-foreground">Gross P&L</th>
                <th className="text-right px-3 py-2.5 text-[9px] font-black uppercase tracking-widest text-muted-foreground">Comm</th>
                <th className="text-right px-3 py-2.5 text-[9px] font-black uppercase tracking-widest text-muted-foreground">Net P&L</th>
                <th className="text-right px-3 py-2.5 text-[9px] font-black uppercase tracking-widest text-muted-foreground">Cumul.</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                let cumulative = 0
                return sortedTrades.map((trade: any, i: number) => {
                  const netPnl = getTradeNetPnl(trade)
                  cumulative += netPnl
                  const tradeDate = trade.closeDate || trade.entryDate
                  const grossPnl = Number(trade.pnl || 0)
                  const commission = Math.abs(Number(trade.commission || 0))

                  return (
                    <tr key={trade.id || i} className="border-b border-border/10 hover:bg-muted/10 transition-colors">
                      <td className="px-3 py-2 text-[10px] text-muted-foreground/50 font-mono">{i + 1}</td>
                      <td className="px-3 py-2 text-[10px] text-muted-foreground font-mono whitespace-nowrap">
                        {tradeDate ? format(new Date(tradeDate), 'MM/dd/yy HH:mm') : '—'}
                      </td>
                      <td className="px-3 py-2 text-[10px] font-semibold">{trade.instrument || trade.symbol || '—'}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={cn(
                          "text-[9px] font-bold",
                          trade.side === 'LONG' || trade.side === 'BUY' ? "text-long" : "text-short"
                        )}>
                          {trade.side || '—'}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right text-[10px] font-mono">{trade.quantity || '—'}</td>
                      <td className="px-3 py-2 text-right text-[10px] font-mono">{trade.entryPrice ? Number(trade.entryPrice).toFixed(2) : '—'}</td>
                      <td className="px-3 py-2 text-right text-[10px] font-mono">{trade.closePrice ? Number(trade.closePrice).toFixed(2) : '—'}</td>
                      <td className={cn("px-3 py-2 text-right text-[10px] font-mono font-bold", grossPnl >= 0 ? "text-long" : "text-short")}>
                        {grossPnl >= 0 ? '+' : ''}{grossPnl.toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-right text-[10px] font-mono text-muted-foreground">
                        {commission > 0 ? commission.toFixed(2) : '—'}
                      </td>
                      <td className={cn("px-3 py-2 text-right text-[10px] font-mono font-bold", netPnl >= 0 ? "text-long" : "text-short")}>
                        {netPnl >= 0 ? '+' : ''}{netPnl.toFixed(2)}
                      </td>
                      <td className={cn("px-3 py-2 text-right text-[10px] font-mono font-bold", cumulative >= 0 ? "text-long" : "text-short")}>
                        {cumulative >= 0 ? '+' : ''}{cumulative.toFixed(2)}
                      </td>
                    </tr>
                  )
                })
              })()}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border/30 bg-muted/20">
                <td colSpan={7} className="px-3 py-2.5 text-[9px] font-black uppercase tracking-widest text-muted-foreground">Totals</td>
                <td className={cn("px-3 py-2.5 text-right text-xs font-black font-mono", (summary.grossProfit - summary.grossLoss) >= 0 ? "text-long" : "text-short")}>
                  {(summary.grossProfit - summary.grossLoss) >= 0 ? '+' : ''}{(summary.grossProfit - summary.grossLoss).toFixed(2)}
                </td>
                <td className="px-3 py-2.5 text-right text-xs font-black font-mono text-short">
                  {summary.totalCommission.toFixed(2)}
                </td>
                <td className={cn("px-3 py-2.5 text-right text-xs font-black font-mono", summary.totalNet >= 0 ? "text-long" : "text-short")}>
                  {summary.totalNet >= 0 ? '+' : ''}{summary.totalNet.toFixed(2)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Footer */}
        <div className="text-center pt-4 border-t border-border/20">
          <p className="text-[9px] text-muted-foreground/40 font-medium">
            Generated by Deltalytix · {format(new Date(), 'MMMM dd, yyyy HH:mm')}
          </p>
        </div>
      </div>
    </div>
  )
}
