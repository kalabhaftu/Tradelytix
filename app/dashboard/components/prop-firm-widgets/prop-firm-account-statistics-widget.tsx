"use client"

import { Activity, BadgeCheck, BarChart3, Building2, Scale, ShieldAlert, Target, TrendingDown, TrendingUp, Trophy, Wallet } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PropFirmWidgetShell } from './prop-firm-widget-shell'
import { formatInteger, formatMoney, formatPercent } from './prop-firm-widget-utils'

function IconStat({ label, value, sublabel, icon: Icon, tone = 'neutral' }: any) {
  return (
    <div className="rounded-xl border border-border/25 bg-card/55 p-3">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
          {sublabel ? <p className="mt-1 text-[10px] text-muted-foreground/70">{sublabel}</p> : null}
        </div>
        <span className={cn('rounded-lg p-2', tone === 'positive' && 'bg-long/10 text-long', tone === 'negative' && 'bg-short/10 text-short', tone === 'neutral' && 'bg-primary/10 text-primary')}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="font-mono text-xl font-black tracking-tight">{value}</p>
    </div>
  )
}

export function PropFirmAccountStatisticsWidget() {
  return (
    <PropFirmWidgetShell title="Prop Firm Account Statistics">
      {({ data }) => {
        const account = data.account
        const phase = account.currentPhase
        const stats = account.statistics || data.statistics || {}
        const currentPhaseTrades = data.groupedTradeCount
        const winRate = currentPhaseTrades > 0 ? data.todayStats.winRate : Number(stats.winRate ?? 0)
        const netPnl = Number(account.currentNetPnL || 0)
        const grossPnl = Number(account.currentGrossPnL || 0)

        const items = [
          { label: 'Current balance', value: formatMoney(account.currentBalance ?? account.currentEquity), icon: Wallet, tone: 'neutral' },
          { label: 'Current equity', value: formatMoney(account.currentEquity), icon: Scale, tone: 'neutral' },
          { label: 'Net P&L', value: formatMoney(netPnl), icon: netPnl >= 0 ? TrendingUp : TrendingDown, tone: netPnl >= 0 ? 'positive' : 'negative' },
          { label: 'Gross P&L', value: formatMoney(grossPnl), icon: BarChart3, tone: grossPnl >= 0 ? 'positive' : 'negative' },
          { label: 'Trades', value: formatInteger(currentPhaseTrades), sublabel: 'Current phase · partials counted once', icon: Activity },
          { label: 'Win rate', value: formatPercent(winRate), icon: Trophy, tone: winRate >= 50 ? 'positive' : 'negative' },
          { label: 'Winners', value: formatInteger(stats.wins ?? stats.winningTrades ?? 0), icon: TrendingUp, tone: 'positive' },
          { label: 'Losers', value: formatInteger(stats.losses ?? stats.losingTrades ?? 0), icon: TrendingDown, tone: 'negative' },
          { label: 'Profit target', value: formatPercent(account.profitTargetProgress), icon: Target, tone: 'positive' },
          { label: 'Daily DD left', value: formatMoney(data.drawdown?.dailyDrawdownRemaining ?? account.dailyDrawdownRemaining), icon: ShieldAlert, tone: 'neutral' },
          { label: 'Max DD left', value: formatMoney(data.drawdown?.maxDrawdownRemaining ?? account.maxDrawdownRemaining), icon: ShieldAlert, tone: 'neutral' },
          { label: 'Peak equity', value: formatMoney(data.peakEquity), icon: BadgeCheck, tone: 'positive' },
          { label: 'Account size', value: formatMoney(account.accountSize), icon: Building2 },
          { label: 'Phase', value: `Phase ${phase.phaseNumber ?? account.currentPhaseNumber ?? '-'}`, sublabel: phase.status || account.status, icon: BadgeCheck },
        ]

        return <div className="grid h-full content-start gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">{items.map((item) => <IconStat key={item.label} {...item} />)}</div>
      }}
    </PropFirmWidgetShell>
  )
}
