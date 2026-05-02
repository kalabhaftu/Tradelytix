"use client"

import { cn } from "@/lib/utils"
import { TrendingUp, Calendar, Eye, Share2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface SharedReport {
  id: string
  slug: string
  title: string
  dateFrom: string | null
  dateTo: string | null
  snapshot: any
  viewCount: number
  createdAt: string
}

interface Props {
  report: SharedReport
}

function StatCard({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (
    <div className="rounded-2xl border border-border/20 bg-card/50 p-4">
      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 mb-2">{label}</p>
      <p className={cn(
        "text-2xl font-black font-mono tracking-tighter",
        positive === true ? "text-green-500" : positive === false ? "text-red-500" : "text-foreground"
      )}>
        {value}
      </p>
    </div>
  )
}

export function SharedReportView({ report }: Props) {
  const snap = report.snapshot as any
  const activity = snap?.tradingActivity
  const psych = snap?.psychMetrics
  const dateRange = report.dateFrom && report.dateTo
    ? `${new Date(report.dateFrom).toLocaleDateString()} — ${new Date(report.dateTo).toLocaleDateString()}`
    : 'All Time'

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/20 bg-card/50 backdrop-blur px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h1 className="text-sm font-black">{report.title}</h1>
              <p className="text-[10px] text-muted-foreground/50 flex items-center gap-1.5">
                <Calendar className="h-3 w-3" />
                {dateRange}
                <span className="opacity-40">·</span>
                <Eye className="h-3 w-3" />
                {report.viewCount} views
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-[9px] font-black uppercase tracking-wider border-border/20 gap-1">
            <Share2 className="h-3 w-3" />
            Shared Report
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {psych && (
          <>
            {/* Key Metrics */}
            <div>
              <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-4">
                Performance Summary
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard
                  label="Net P&L"
                  value={`$${Number(psych.totalNetPnL).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                  positive={psych.totalNetPnL >= 0}
                />
                <StatCard
                  label="Win Rate"
                  value={`${activity?.winRate || '—'}%`}
                  positive={parseFloat(activity?.winRate || '0') >= 50}
                />
                <StatCard
                  label="Profit Factor"
                  value={psych.profitFactor}
                  positive={parseFloat(psych.profitFactor) >= 1}
                />
                <StatCard
                  label="Max Drawdown"
                  value={`$${Number(psych.maxDrawdown).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                  positive={false}
                />
              </div>
            </div>

            {/* Secondary Metrics */}
            <div>
              <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-4">
                Risk-Adjusted Metrics
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <StatCard label="Total Trades" value={String(activity?.totalTrades || '—')} />
                <StatCard label="Avg Win" value={`$${psych.avgWin}`} positive={true} />
                <StatCard label="Avg Loss" value={`$${psych.avgLoss}`} positive={false} />
                <StatCard label="Expectancy" value={`$${psych.expectancy}`} positive={parseFloat(psych.expectancy) >= 0} />
                <StatCard label="Recovery Factor" value={psych.recoveryFactor} positive={parseFloat(psych.recoveryFactor) >= 0} />
                <StatCard label="Consistency" value={`${psych.consistencyScore}%`} positive={parseFloat(psych.consistencyScore) >= 60} />
                {psych.sharpeRatio && <StatCard label="Sharpe Ratio" value={psych.sharpeRatio} positive={parseFloat(psych.sharpeRatio) >= 0} />}
                {psych.sortinoRatio && <StatCard label="Sortino Ratio" value={psych.sortinoRatio} positive={parseFloat(psych.sortinoRatio) >= 0} />}
                {psych.calmarRatio && <StatCard label="Calmar Ratio" value={psych.calmarRatio} positive={parseFloat(psych.calmarRatio) >= 0} />}
              </div>
            </div>
          </>
        )}

        <div className="text-center pt-8 border-t border-border/10">
          <p className="text-[10px] text-muted-foreground/30 font-bold">
            Generated with Deltalytix — the trading journal built for serious traders.
          </p>
        </div>
      </div>
    </div>
  )
}
