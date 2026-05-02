"use client"

import { useMemo } from "react"
import { cn, formatCurrency } from "@/lib/utils"
import { TrendingUp, TrendingDown, Trophy } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

interface AccountSummary {
  id: string
  name: string
  propFirmName: string
  accountSize: number
  currentPnL: number
  winRate: number
  totalTrades: number
  maxDrawdownPct: number
  status: string
  evaluationType?: string
  profitSplitPercent?: number
}

interface MultiAccountComparisonProps {
  accounts: AccountSummary[]
  className?: string
}

function AccountRow({ account, rank, maxPnL }: { account: AccountSummary; rank: number; maxPnL: number }) {
  const pnlPct = account.accountSize > 0 ? (account.currentPnL / account.accountSize) * 100 : 0
  const barWidth = maxPnL !== 0 ? Math.abs(account.currentPnL / maxPnL) * 100 : 0
  const isPositive = account.currentPnL >= 0

  return (
    <div className="flex items-center gap-3 py-3 border-b border-border/10 last:border-none">
      {/* Rank */}
      <div className={cn(
        "h-6 w-6 rounded-full flex items-center justify-center text-[9px] font-black shrink-0",
        rank === 1 ? "bg-yellow-500/10 text-yellow-500" :
        rank === 2 ? "bg-zinc-400/10 text-zinc-400" :
        rank === 3 ? "bg-amber-700/10 text-amber-700" :
        "bg-muted/20 text-muted-foreground/40"
      )}>
        {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank}
      </div>

      {/* Account info */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] font-bold truncate">{account.name}</p>
          <span className={cn(
            "text-[11px] font-black font-mono shrink-0",
            isPositive ? "text-long" : "text-short"
          )}>
            {isPositive ? '+' : ''}{formatCurrency(account.currentPnL)}
          </span>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1 bg-muted/20 rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-700", isPositive ? "bg-long" : "bg-short")}
              style={{ width: `${Math.min(barWidth, 100)}%` }}
            />
          </div>
          <span className={cn("text-[9px] font-bold shrink-0", isPositive ? "text-long" : "text-short")}>
            {pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(1)}%
          </span>
        </div>

        {/* Secondary stats */}
        <div className="flex items-center gap-3 text-[9px] text-muted-foreground/40 font-bold">
          <span>{account.winRate.toFixed(0)}% WR</span>
          <span>·</span>
          <span>{account.totalTrades} trades</span>
          <span>·</span>
          <span className="text-short">{account.maxDrawdownPct.toFixed(1)}% DD</span>
        </div>
      </div>

      {/* Status badge */}
      <Badge
        variant="outline"
        className={cn(
          "text-[9px] font-black uppercase tracking-wider border shrink-0",
          account.status === 'active' ? "border-long/20 bg-long/5 text-long" :
          account.status === 'funded' ? "border-yellow-500/20 bg-yellow-500/5 text-yellow-500" :
          "border-border/20 text-muted-foreground/50"
        )}
      >
        {account.status}
      </Badge>
    </div>
  )
}

export function MultiAccountComparison({ accounts, className }: MultiAccountComparisonProps) {
  const sorted = useMemo(
    () => [...accounts].sort((a, b) => b.currentPnL - a.currentPnL),
    [accounts]
  )

  const maxPnL = useMemo(
    () => Math.max(...accounts.map(a => Math.abs(a.currentPnL)), 1),
    [accounts]
  )

  const totalPnL = accounts.reduce((sum, a) => sum + a.currentPnL, 0)
  const bestAccount = sorted[0]
  const worstAccount = sorted[sorted.length - 1]

  if (accounts.length === 0) return null

  return (
    <div className={cn("rounded-[24px] border border-border/20 bg-card/40 overflow-hidden", className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/10">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-primary" />
          <span className="text-[11px] font-black uppercase tracking-wider">Account Leaderboard</span>
        </div>
        <div className="flex items-center gap-1 text-[10px]">
          <span className="text-muted-foreground/50 font-bold">Total:</span>
          <span className={cn("font-black font-mono", totalPnL >= 0 ? "text-long" : "text-short")}>
            {totalPnL >= 0 ? '+' : ''}{formatCurrency(totalPnL)}
          </span>
        </div>
      </div>

      {/* Rows */}
      <div className="px-5">
        {sorted.map((account, idx) => (
          <AccountRow key={account.id} account={account} rank={idx + 1} maxPnL={maxPnL} />
        ))}
      </div>

      {/* Summary footer */}
      {sorted.length >= 2 && (
        <div className="grid grid-cols-2 border-t border-border/10">
          <div className="flex items-center gap-2 px-4 py-3 border-r border-border/10">
            <TrendingUp className="h-3.5 w-3.5 text-long shrink-0" />
            <div className="min-w-0">
              <p className="text-[8px] font-black uppercase text-muted-foreground/40 tracking-widest">Best</p>
              <p className="text-[10px] font-bold truncate">{bestAccount?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-3">
            <TrendingDown className="h-3.5 w-3.5 text-short shrink-0" />
            <div className="min-w-0">
              <p className="text-[8px] font-black uppercase text-muted-foreground/40 tracking-widest">Worst</p>
              <p className="text-[10px] font-bold truncate">{worstAccount?.name}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
