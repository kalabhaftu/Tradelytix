'use client'

import { useMemo, useRef } from 'react'
import { cn, formatCurrency } from '@/lib/utils'
import { getTradeNetPnl } from '@/lib/metrics/pnl'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Printer } from 'lucide-react'

interface StatementViewProps {
  trades: any[]
  dateRange?: { from?: Date; to?: Date } | null
}

type StatementRow = {
  label: string
  value: string
  tone?: 'positive' | 'negative'
}

function StatementMetric({ label, value, tone }: StatementRow) {
  return (
    <div className="flex items-center justify-between gap-6 border-b border-slate-200 py-2.5 last:border-b-0">
      <span className="text-[13px] font-semibold text-slate-600">{label}</span>
      <span
        className={cn(
          'font-mono text-[13px] font-bold text-slate-900',
          tone === 'positive' && 'text-emerald-700',
          tone === 'negative' && 'text-red-700'
        )}
      >
        {value}
      </span>
    </div>
  )
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
    let breakEven = 0
    let largestProfit = Number.NEGATIVE_INFINITY
    let largestLoss = Number.POSITIVE_INFINITY
    let cumulative = 0
    let peak = 0
    let maxDrawdown = 0

    sorted.forEach((trade: any) => {
      const pnl = Number(trade.pnl || 0)
      const commission = Math.abs(Number(trade.commission || 0))
      const net = getTradeNetPnl(trade)

      totalCommission += commission
      totalNet += net
      cumulative += net
      peak = Math.max(peak, cumulative)
      maxDrawdown = Math.max(maxDrawdown, peak - cumulative)
      largestProfit = Math.max(largestProfit, net)
      largestLoss = Math.min(largestLoss, net)

      if (pnl > 0) {
        grossProfit += pnl
        wins++
      } else if (pnl < 0) {
        grossLoss += Math.abs(pnl)
        losses++
      } else {
        breakEven++
      }
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
        breakEven,
        winRate: sorted.length > 0 ? (wins / sorted.length) * 100 : 0,
        profitFactor: grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0,
        averageTrade: sorted.length > 0 ? totalNet / sorted.length : 0,
        largestProfit: largestProfit === Number.NEGATIVE_INFINITY ? 0 : largestProfit,
        largestLoss: largestLoss === Number.POSITIVE_INFINITY ? 0 : largestLoss,
        maxDrawdown,
      },
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
            body { margin: 0; background: #f5f7fb; color: #172033; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
            .statement-sheet { box-shadow: none !important; border-color: #d8dee8 !important; margin: 24px; }
            @media print { body { background: #fff; } .statement-sheet { margin: 0; border: none !important; } }
          </style>
        </head>
        <body>${el.innerHTML}</body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => printWindow.print(), 300)
  }

  if (!summary || sortedTrades.length === 0) return null

  const firstDate = dateRange?.from || sortedTrades[0]?.closeDate || sortedTrades[0]?.entryDate
  const lastDate = dateRange?.to || sortedTrades[sortedTrades.length - 1]?.closeDate || sortedTrades[sortedTrades.length - 1]?.entryDate
  const period = firstDate && lastDate
    ? `${format(new Date(firstDate), 'MMM dd, yyyy')} - ${format(new Date(lastDate), 'MMM dd, yyyy')}`
    : 'All Time'
  const grossNet = summary.grossProfit - summary.grossLoss

  const leftRows: StatementRow[] = [
    { label: 'Total P&L', value: formatCurrency(summary.totalNet), tone: summary.totalNet >= 0 ? 'positive' : 'negative' },
    { label: 'Average Trade P&L', value: formatCurrency(summary.averageTrade), tone: summary.averageTrade >= 0 ? 'positive' : 'negative' },
    { label: 'Average Winning Trade', value: summary.wins ? formatCurrency(summary.grossProfit / summary.wins) : 'N/A', tone: 'positive' },
    { label: 'Average Losing Trade', value: summary.losses ? `-${formatCurrency(summary.grossLoss / summary.losses)}` : 'N/A', tone: 'negative' },
    { label: 'Total Number of Trades', value: String(summary.totalTrades) },
    { label: 'Number of Winning Trades', value: String(summary.wins), tone: 'positive' },
    { label: 'Number of Losing Trades', value: String(summary.losses), tone: 'negative' },
    { label: 'Number of Break Even Trades', value: String(summary.breakEven) },
    { label: 'Total Commissions', value: formatCurrency(summary.totalCommission), tone: 'negative' },
    { label: 'Largest Profit', value: formatCurrency(summary.largestProfit), tone: 'positive' },
    { label: 'Largest Loss', value: formatCurrency(summary.largestLoss), tone: 'negative' },
  ]

  const rightRows: StatementRow[] = [
    { label: 'Win Rate', value: `${summary.winRate.toFixed(1)}%` },
    { label: 'Profit Factor', value: summary.profitFactor === Infinity ? 'Infinity' : summary.profitFactor.toFixed(2) },
    { label: 'Open Trades', value: '0' },
    { label: 'Total Trading Days', value: String(new Set(sortedTrades.map((trade: any) => (trade.closeDate || trade.entryDate || '').slice(0, 10)).filter(Boolean)).size) },
    { label: 'Winning Trades', value: String(summary.wins), tone: 'positive' },
    { label: 'Losing Trades', value: String(summary.losses), tone: 'negative' },
    { label: 'Breakeven Trades', value: String(summary.breakEven) },
    { label: 'Gross Profit', value: formatCurrency(summary.grossProfit), tone: 'positive' },
    { label: 'Gross Loss', value: `-${formatCurrency(summary.grossLoss)}`, tone: 'negative' },
    { label: 'Gross Net', value: formatCurrency(grossNet), tone: grossNet >= 0 ? 'positive' : 'negative' },
    { label: 'Max Drawdown', value: formatCurrency(summary.maxDrawdown), tone: 'negative' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-[10px] uppercase font-black text-muted-foreground tracking-[0.2em]">Statement View</h3>
        <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5 text-xs font-bold">
          <Printer className="h-3.5 w-3.5" />
          Print / Export PDF
        </Button>
      </div>

      <div ref={printRef}>
        <div className="statement-sheet overflow-hidden rounded-sm border border-slate-200 bg-white text-slate-900 shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-[12px] font-bold uppercase tracking-[0.2em] text-slate-500">Your Stats</p>
                <h1 className="mt-1 text-xl font-extrabold tracking-tight text-slate-950">Trading Statement</h1>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">From {period}</p>
              </div>
              <div className="grid grid-cols-3 gap-8 text-left">
                <div>
                  <p className="text-[12px] font-bold text-slate-500">Best Trade</p>
                  <p className="font-mono text-sm font-extrabold text-emerald-700">{formatCurrency(summary.largestProfit)}</p>
                </div>
                <div>
                  <p className="text-[12px] font-bold text-slate-500">Worst Trade</p>
                  <p className="font-mono text-sm font-extrabold text-red-700">{formatCurrency(summary.largestLoss)}</p>
                </div>
                <div>
                  <p className="text-[12px] font-bold text-slate-500">Average</p>
                  <p className="font-mono text-sm font-extrabold text-slate-950">{formatCurrency(summary.averageTrade)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-8 px-6 py-4 lg:grid-cols-2">
            <div>{leftRows.map((row) => <StatementMetric key={row.label} {...row} />)}</div>
            <div>{rightRows.map((row) => <StatementMetric key={row.label} {...row} />)}</div>
          </div>

          <div className="border-t border-slate-200 px-6 py-4">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[960px] border-collapse text-[12px]">
                <thead>
                  <tr className="border-b border-slate-300 text-left">
                    {['#', 'Date', 'Instrument', 'Side', 'Qty', 'Entry', 'Exit', 'Gross P&L', 'Fees', 'Net P&L', 'Cumulative'].map((heading) => (
                      <th key={heading} className="px-2 py-2 text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-500 last:text-right">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    let cumulative = 0
                    return sortedTrades.map((trade: any, index: number) => {
                      const netPnl = getTradeNetPnl(trade)
                      cumulative += netPnl
                      const tradeDate = trade.closeDate || trade.entryDate
                      const grossPnl = Number(trade.pnl || 0)
                      const commission = Math.abs(Number(trade.commission || 0))

                      return (
                        <tr key={trade.id || index} className="border-b border-slate-100">
                          <td className="px-2 py-2 font-mono text-slate-400">{index + 1}</td>
                          <td className="px-2 py-2 font-mono text-slate-600">{tradeDate ? format(new Date(tradeDate), 'MM/dd/yy HH:mm') : '-'}</td>
                          <td className="px-2 py-2 font-bold">{trade.instrument || trade.symbol || '-'}</td>
                          <td className="px-2 py-2 font-bold uppercase">{trade.side || '-'}</td>
                          <td className="px-2 py-2 text-right font-mono">{trade.quantity || '-'}</td>
                          <td className="px-2 py-2 text-right font-mono">{trade.entryPrice ? Number(trade.entryPrice).toFixed(2) : '-'}</td>
                          <td className="px-2 py-2 text-right font-mono">{trade.closePrice ? Number(trade.closePrice).toFixed(2) : '-'}</td>
                          <td className={cn('px-2 py-2 text-right font-mono font-bold', grossPnl >= 0 ? 'text-emerald-700' : 'text-red-700')}>
                            {grossPnl >= 0 ? '+' : ''}{grossPnl.toFixed(2)}
                          </td>
                          <td className="px-2 py-2 text-right font-mono text-slate-500">{commission > 0 ? commission.toFixed(2) : '-'}</td>
                          <td className={cn('px-2 py-2 text-right font-mono font-bold', netPnl >= 0 ? 'text-emerald-700' : 'text-red-700')}>
                            {netPnl >= 0 ? '+' : ''}{netPnl.toFixed(2)}
                          </td>
                          <td className={cn('px-2 py-2 text-right font-mono font-bold', cumulative >= 0 ? 'text-emerald-700' : 'text-red-700')}>
                            {cumulative >= 0 ? '+' : ''}{cumulative.toFixed(2)}
                          </td>
                        </tr>
                      )
                    })
                  })()}
                </tbody>
              </table>
            </div>
          </div>

          <div className="border-t border-slate-200 px-6 py-3 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Generated by Deltalytix on {format(new Date(), 'MMM dd, yyyy HH:mm')}
          </div>
        </div>
      </div>
    </div>
  )
}
