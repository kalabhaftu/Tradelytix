"use client"

import { Target, ShieldAlert, CalendarClock, Trophy, TrendingDown, Activity } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PropFirmWidgetShell } from './prop-firm-widget-shell'
import { clampPercent, formatInteger, formatMoney, formatPercent, getObjectiveTone } from './prop-firm-widget-utils'

function ObjectiveCard({ title, icon: Icon, current, limit, remaining, progress, danger }: any) {
  const tone = danger || getObjectiveTone(remaining) === 'short' ? 'short' : 'long'
  return (
    <div className="rounded-xl border border-border/25 bg-card/55 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className={cn('rounded-lg p-2', tone === 'long' ? 'bg-long/10 text-long' : 'bg-short/10 text-short')}>
            <Icon className="h-4 w-4" />
          </span>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">{title}</p>
        </div>
        <span className="font-mono text-xs font-bold text-muted-foreground">{formatPercent(progress)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted/35">
        <div className={cn('h-full rounded-full', tone === 'long' ? 'bg-long' : 'bg-short')} style={{ width: `${clampPercent(progress)}%` }} />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
        <div><p className="text-muted-foreground">Current</p><p className="font-mono font-bold">{formatMoney(current)}</p></div>
        <div><p className="text-muted-foreground">Limit</p><p className="font-mono font-bold">{formatMoney(limit)}</p></div>
        <div><p className="text-muted-foreground">Remaining</p><p className={cn('font-mono font-bold', remaining <= 0 ? 'text-short' : 'text-long')}>{formatMoney(remaining)}</p></div>
      </div>
    </div>
  )
}

function StatTile({ label, value, icon: Icon, tone = 'neutral' }: any) {
  return (
    <div className="rounded-xl border border-border/25 bg-muted/10 p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{label}</p>
        <Icon className={cn('h-4 w-4', tone === 'positive' && 'text-long', tone === 'negative' && 'text-short', tone === 'neutral' && 'text-muted-foreground')} />
      </div>
      <p className="font-mono text-lg font-black tracking-tight">{value}</p>
    </div>
  )
}

export function PropFirmObjectivesTodayWidget() {
  return (
    <PropFirmWidgetShell title="Trading Objectives + Today">
      {({ data }) => {
        const account = data.account
        const phase = account.currentPhase
        const accountSize = Number(account.accountSize || 0)
        const targetAmount = accountSize * (Number(phase.profitTargetPercent || 0) / 100)
        const maxLossLimit = accountSize * (Number(phase.maxDrawdownPercent || 0) / 100)
        const dailyLossLimit = accountSize * (Number(phase.dailyDrawdownPercent || 0) / 100)
        const grossPnl = Number(account.currentGrossPnL || 0)
        const maxRemaining = Number(data.drawdown?.maxDrawdownRemaining ?? account.maxDrawdownRemaining ?? 0)
        const dailyRemaining = Number(data.drawdown?.dailyDrawdownRemaining ?? account.dailyDrawdownRemaining ?? 0)
        const maxUsed = Math.max(0, maxLossLimit - maxRemaining)
        const dailyUsed = Math.max(0, dailyLossLimit - dailyRemaining)

        return (
          <div className="grid h-full gap-4 xl:grid-cols-[1.35fr_0.85fr]">
            <div className="grid gap-3 lg:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
              <ObjectiveCard title="Profit target" icon={Target} current={grossPnl} limit={targetAmount} remaining={Math.max(0, targetAmount - grossPnl)} progress={targetAmount > 0 ? (grossPnl / targetAmount) * 100 : 0} />
              <ObjectiveCard title="Maximum loss limit" icon={ShieldAlert} current={maxUsed} limit={maxLossLimit} remaining={maxRemaining} progress={maxLossLimit > 0 ? (maxUsed / maxLossLimit) * 100 : 0} danger={maxRemaining <= maxLossLimit * 0.25} />
              <ObjectiveCard title="Daily loss limit" icon={CalendarClock} current={dailyUsed} limit={dailyLossLimit} remaining={dailyRemaining} progress={dailyLossLimit > 0 ? (dailyUsed / dailyLossLimit) * 100 : 0} danger={dailyRemaining <= dailyLossLimit * 0.25} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              <StatTile label="Today P&L" icon={Activity} value={formatMoney(data.todayStats.pnl)} tone={data.todayStats.pnl >= 0 ? 'positive' : 'negative'} />
              <StatTile label="Today trades" icon={CalendarClock} value={formatInteger(data.todayStats.trades)} />
              <StatTile label="Today win rate" icon={Trophy} value={formatPercent(data.todayStats.winRate)} tone="positive" />
              <StatTile label="Wins / Losses" icon={TrendingDown} value={`${data.todayStats.wins} / ${data.todayStats.losses}`} />
              <StatTile label="Best trade" icon={Trophy} value={formatMoney(data.todayStats.bestTrade)} tone="positive" />
              <StatTile label="Worst trade" icon={TrendingDown} value={formatMoney(data.todayStats.worstTrade)} tone="negative" />
            </div>
          </div>
        )
      }}
    </PropFirmWidgetShell>
  )
}
