"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown, DollarSign, Clock, Calendar, CheckCircle2, XCircle, Trophy, AlertTriangle, AlertCircle, ShieldAlert } from "lucide-react"
import { cn, formatCurrency, formatPercent } from "@/lib/utils"
import { useData } from '@/context/data-provider'
import { classifyOutcome, getBreakEvenThreshold } from '@/lib/metrics/outcome'

interface PhaseData {
  id: string
  phaseNumber: number
  phaseId: string | null
  status: 'active' | 'archived' | 'passed' | 'failed' | 'pending'
  profitTargetPercent: number
  dailyDrawdownPercent: number
  maxDrawdownPercent: number
  startDate: string
  endDate: string | null
  trades: any[]
  currentPnL?: number
  currentBalance?: number
}

interface PhaseAccordionSectionProps {
  phase: PhaseData
  accountSize: number
  isExpanded?: boolean
}

type BreachLevel = 'safe' | 'warning' | 'danger' | 'critical'

function getBreachLevel(used: number, limit: number): BreachLevel {
  if (limit <= 0) return 'safe'
  const ratio = Math.abs(used) / Math.abs(limit)
  if (ratio >= 0.95) return 'critical'
  if (ratio >= 0.85) return 'danger'
  if (ratio >= 0.70) return 'warning'
  return 'safe'
}

function BreachWarningBar({
  label,
  usedAmount,
  limitAmount,
  limitPercent,
}: {
  label: string
  usedAmount: number
  limitAmount: number
  limitPercent: number
}) {
  const level = getBreachLevel(usedAmount, limitAmount)
  if (level === 'safe') return null

  const usedPercent = limitAmount > 0 ? Math.min((Math.abs(usedAmount) / limitAmount) * 100, 100) : 0
  const remaining = limitAmount - Math.abs(usedAmount)

  const config = {
    warning: {
      bg: 'bg-yellow-500/10 border-yellow-500/30',
      text: 'text-yellow-500',
      bar: 'bg-yellow-500',
      icon: AlertTriangle,
      label: 'Approaching Limit',
    },
    danger: {
      bg: 'bg-orange-500/10 border-orange-500/40',
      text: 'text-orange-500',
      bar: 'bg-orange-500',
      icon: AlertCircle,
      label: 'Limit Near',
    },
    critical: {
      bg: 'bg-destructive/10 border-destructive/50',
      text: 'text-destructive',
      bar: 'bg-destructive',
      icon: ShieldAlert,
      label: 'BREACH IMMINENT',
    },
    safe: {
      bg: '',
      text: '',
      bar: '',
      icon: AlertTriangle,
      label: '',
    },
  }

  const c = config[level]
  const Icon = c.icon

  return (
    <div className={cn('flex flex-col gap-2 rounded-xl border p-3', c.bg)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={cn('h-4 w-4', c.text)} />
          <span className={cn('text-xs font-black uppercase tracking-wider', c.text)}>
            {c.label} — {label}
          </span>
        </div>
        <span className={cn('text-xs font-bold font-mono', c.text)}>
          {formatCurrency(remaining)} remaining
        </span>
      </div>
      <div className="w-full h-2 bg-background/40 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', c.bar)}
          style={{ width: `${usedPercent}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] font-bold text-muted-foreground/60">
        <span>{formatCurrency(Math.abs(usedAmount))} used</span>
        <span>{formatCurrency(limitAmount)} limit ({limitPercent}%)</span>
      </div>
    </div>
  )
}

export function PhaseAccordionSection({ phase, accountSize, isExpanded = false }: PhaseAccordionSectionProps) {
  const [isOpen, setIsOpen] = useState(isExpanded)
  const { statistics } = useData()
  const breakEvenThreshold = getBreakEvenThreshold(statistics?.breakEvenThreshold)

  const formatCurrencyLocal = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusIcon = () => {
    switch (phase.status) {
      case 'active': return <Clock className="h-5 w-5 text-foreground" />
      case 'archived':
      case 'passed': return <CheckCircle2 className="h-5 w-5 text-long" />
      case 'failed': return <XCircle className="h-5 w-5 text-short" />
      case 'pending': return <Trophy className="h-5 w-5 text-muted-foreground" />
      default: return null
    }
  }

  const getStatusBadge = () => {
    const variants = {
      active: 'default',
      archived: 'secondary',
      passed: 'secondary',
      failed: 'destructive',
      pending: 'outline'
    } as const

    const labels = {
      active: 'Active',
      archived: 'Archived (Passed)',
      passed: 'Passed',
      failed: 'Failed',
      pending: 'Pending'
    }

    return (
      <Badge variant={variants[phase.status] || 'outline'} className="ml-auto">
        {labels[phase.status]}
      </Badge>
    )
  }

  const totalTrades = phase.trades?.length || 0
  const totalPnL = phase.trades?.reduce((sum, t) => sum + (t.pnl || 0), 0) || 0

  const winningTrades = phase.trades?.filter(t => classifyOutcome(Number(t.pnl || 0), breakEvenThreshold) === 'win').length || 0
  const losingTrades = phase.trades?.filter(t => classifyOutcome(Number(t.pnl || 0), breakEvenThreshold) === 'loss').length || 0
  const tradableCount = winningTrades + losingTrades
  const winRate = tradableCount > 0 ? (winningTrades / tradableCount) * 100 : 0
  const currentBalance = accountSize + totalPnL
  const profitTargetAmount = (phase.profitTargetPercent / 100) * accountSize
  const profitProgress = profitTargetAmount > 0 ? Math.min((totalPnL / profitTargetAmount) * 100, 100) : 0

  // Drawdown limits
  const dailyLimitAmount = (phase.dailyDrawdownPercent / 100) * accountSize
  const maxDDLimitAmount = (phase.maxDrawdownPercent / 100) * accountSize

  // Today's loss for daily DD
  const todaysLoss = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    return phase.trades
      ?.filter(t => {
        const d = t.exitTime || t.entryDate || ''
        return d.toString().startsWith(today) && (t.pnl || 0) < 0
      })
      .reduce((sum, t) => sum + Math.abs(t.pnl || 0), 0) || 0
  }, [phase.trades])

  // Max DD used: how far below starting balance we've gone
  const maxDDUsed = useMemo(() => {
    let peak = 0
    let maxDD = 0
    let running = 0
    for (const t of (phase.trades || [])) {
      running += t.pnl || 0
      if (running > peak) peak = running
      const dd = peak - running
      if (dd > maxDD) maxDD = dd
    }
    return maxDD
  }, [phase.trades])

  const dailyBreachLevel = getBreachLevel(todaysLoss, dailyLimitAmount)
  const maxDDBreachLevel = getBreachLevel(maxDDUsed, maxDDLimitAmount)
  const hasWarning = phase.status === 'active' && (dailyBreachLevel !== 'safe' || maxDDBreachLevel !== 'safe')

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className={cn(
        "transition-all",
        phase.status === 'active' && !hasWarning && "border-foreground/20 bg-muted/30",
        phase.status === 'active' && hasWarning && "border-orange-500/40 bg-orange-500/5",
        phase.status === 'failed' && "border-destructive/30 bg-destructive/5"
      )}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                {getStatusIcon()}
                <div>
                  <CardTitle className="text-lg">
                    Phase {phase.phaseNumber}
                    {phase.phaseId && <span className="text-sm font-normal text-muted-foreground ml-2">({phase.phaseId})</span>}
                  </CardTitle>
                  <div className="text-xs text-muted-foreground mt-1">
                    Started: {formatDate(phase.startDate)}
                    {phase.endDate && ` • Ended: ${formatDate(phase.endDate)}`}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {hasWarning && (
                  <Badge variant="outline" className="border-orange-500/50 text-orange-500 text-[10px] font-black uppercase tracking-wider hidden sm:flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Risk Alert
                  </Badge>
                )}
                {getStatusBadge()}
                {isOpen ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="space-y-6">

              {/* Breach Warning Bars — only shown for active phases nearing limits */}
              {phase.status === 'active' && (
                <div className="space-y-2">
                  <BreachWarningBar
                    label="Daily Drawdown"
                    usedAmount={todaysLoss}
                    limitAmount={dailyLimitAmount}
                    limitPercent={phase.dailyDrawdownPercent}
                  />
                  <BreachWarningBar
                    label="Max Drawdown"
                    usedAmount={maxDDUsed}
                    limitAmount={maxDDLimitAmount}
                    limitPercent={phase.maxDrawdownPercent}
                  />
                </div>
              )}

              {/* Quick Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Total Trades</span>
                  </div>
                  <p className="text-2xl font-bold">{totalTrades}</p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Total P&L</span>
                  </div>
                  <p className={cn(
                    "text-2xl font-bold",
                    totalPnL >= 0 ? "text-long" : "text-short"
                  )}>
                    {formatCurrencyLocal(totalPnL)}
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Win Rate</span>
                  </div>
                  <p className="text-2xl font-bold">{formatPercent(winRate, 1)}</p>
                  <p className="text-xs text-muted-foreground">{winningTrades} wins</p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Balance</span>
                  </div>
                  <p className="text-2xl font-bold">{formatCurrencyLocal(currentBalance)}</p>
                  <p className="text-xs text-muted-foreground">
                    Start: {formatCurrencyLocal(accountSize)}
                  </p>
                </div>
              </div>

              {/* Profit Target Progress */}
              {phase.status !== 'pending' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Profit Target Progress</span>
                    <span className="font-medium">
                      {formatCurrencyLocal(totalPnL)} / {formatCurrencyLocal(profitTargetAmount)} ({formatPercent(profitProgress, 1)})
                    </span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className={cn(
                        "h-2 rounded-full transition-all",
                        profitProgress >= 100 ? "bg-long" : "bg-foreground"
                      )}
                      style={{ width: `${Math.min(profitProgress, 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Phase Rules */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground">Profit Target</p>
                  <p className="text-sm font-medium">{formatPercent(phase.profitTargetPercent)} ({formatCurrencyLocal(profitTargetAmount)})</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Daily Drawdown</p>
                  <p className="text-sm font-medium">{formatPercent(phase.dailyDrawdownPercent)} ({formatCurrencyLocal(dailyLimitAmount)})</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Max Drawdown</p>
                  <p className="text-sm font-medium">{formatPercent(phase.maxDrawdownPercent)} ({formatCurrencyLocal(maxDDLimitAmount)})</p>
                </div>
              </div>

              {/* Recent Trades */}
              {phase.trades && phase.trades.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold">Recent Trades ({Math.min(5, phase.trades.length)} of {phase.trades.length})</h4>
                  <div className="space-y-2">
                    {phase.trades.slice(0, 5).map((trade, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-background rounded border">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{trade.instrument || trade.symbol}</div>
                          <div className="text-xs text-muted-foreground">
                            {trade.exitTime ? new Date(trade.exitTime).toLocaleDateString() : 'Pending'}
                          </div>
                        </div>
                        <div className={cn(
                          "font-medium",
                          (trade.pnl || 0) >= 0 ? "text-long" : "text-short"
                        )}>
                          {formatCurrencyLocal(trade.pnl || 0)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {phase.status === 'pending' && (
                <div className="text-center py-8 text-muted-foreground">
                  <Trophy className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">This phase is pending activation</p>
                  <p className="text-xs mt-1">Complete the previous phase to unlock</p>
                </div>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}
