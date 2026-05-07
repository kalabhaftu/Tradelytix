"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { TrendingUp, Calendar, Eye, Share2, Activity, ShieldCheck, Clock3 } from "lucide-react"
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
  const [viewCount, setViewCount] = useState(report.viewCount)
  const snap = report.snapshot as any
  const reportData = snap?.reportData ?? snap
  const activity = reportData?.tradingActivity ?? snap?.tradingActivity
  const psych = reportData?.psychMetrics ?? snap?.psychMetrics
  const sessions = reportData?.sessionPerformance ?? null
  const rDataQuality = reportData?.rMultipleDataQuality ?? null
  const dateRange = report.dateFrom && report.dateTo
    ? `${new Date(report.dateFrom).toLocaleDateString()} — ${new Date(report.dateTo).toLocaleDateString()}`
    : 'All Time'

  useEffect(() => {
    let cancelled = false

    const recordView = async () => {
      try {
        const response = await fetch(`/api/v1/reports/shared/${report.slug}/view`, {
          method: 'POST',
          cache: 'no-store',
        })
        if (!response.ok) return
        const data = await response.json()
        if (!cancelled && typeof data.viewCount === 'number') {
          setViewCount(data.viewCount)
        }
      } catch {
        // Ignore analytics failures for public views.
      }
    }

    recordView()

    return () => {
      cancelled = true
    }
  }, [report.slug])

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
                {viewCount} views
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
        {psych && activity && (
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
                <StatCard label="Trading Days" value={String(activity?.tradingDaysActive || '—')} />
                <StatCard label="Avg Trades / Month" value={String(activity?.avgTradesPerMonth || '—')} />
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

            <div className="grid gap-4 lg:grid-cols-3">
              <div className="rounded-2xl border border-border/20 bg-card/50 p-4">
                <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                  <Activity className="h-3.5 w-3.5" />
                  Trade Behavior
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Most traded day</span>
                    <span className="font-mono font-bold">{activity.mostTradedDay || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Best day</span>
                    <span className="font-mono font-bold text-green-500">{activity.mostProfitableDay || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Worst day</span>
                    <span className="font-mono font-bold text-red-500">{activity.mostLosingDay || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Best instrument</span>
                    <span className="font-mono font-bold">{activity.mostProfitablePair || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Worst instrument</span>
                    <span className="font-mono font-bold">{activity.mostLosingPair || '—'}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border/20 bg-card/50 p-4">
                <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Streaks
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Longest win streak</span>
                    <span className="font-mono font-bold text-green-500">{psych.longestWinStreak}W</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Longest loss streak</span>
                    <span className="font-mono font-bold text-red-500">{psych.longestLoseStreak}L</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Total R</span>
                    <span className="font-mono font-bold">{psych.totalRMultiple}R</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Peak equity</span>
                    <span className="font-mono font-bold">${psych.peakEquity}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border/20 bg-card/50 p-4">
                <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                  <Clock3 className="h-3.5 w-3.5" />
                  Execution Quality
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Avg hold time</span>
                    <span className="font-mono font-bold">{psych.avgHoldingTime}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">R:R efficiency</span>
                    <span className="font-mono font-bold">{psych.rrEfficiency}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">R data coverage</span>
                    <span className="font-mono font-bold">
                      {rDataQuality ? `${rDataQuality.tradesWithStopLoss}/${rDataQuality.totalTrades} (${rDataQuality.percentageComplete}%)` : '—'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {sessions && (
              <div>
                <h2 className="mb-4 text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                  Session Performance
                </h2>
                <div className="grid gap-3 md:grid-cols-3">
                  {Object.entries(sessions).map(([key, session]: [string, any]) => (
                    <div key={key} className="rounded-2xl border border-border/20 bg-card/50 p-4">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-black">{session.name}</p>
                          <p className="text-[10px] text-muted-foreground">{session.range}</p>
                        </div>
                        <p className={cn("font-mono font-bold", session.pnl >= 0 ? "text-green-500" : "text-red-500")}>
                          ${Number(session.pnl || 0).toFixed(2)}
                        </p>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div>
                          <p className="text-muted-foreground">Trades</p>
                          <p className="font-mono font-bold">{session.trades}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Wins</p>
                          <p className="font-mono font-bold">{session.wins}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Max DD</p>
                          <p className="font-mono font-bold">${Number(session.maxDD || 0).toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
