"use client"

import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { RECHARTS_COLORS } from '../widget-card'
import { PropFirmWidgetShell } from './prop-firm-widget-shell'
import { formatInteger, formatMoney } from './prop-firm-widget-utils'

type GrowthTooltipProps = {
  active?: boolean
  payload?: Array<{ payload?: any; name?: string; value?: number }>
}

function Pill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/25 bg-muted/10 px-3 py-2">
      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="font-mono text-sm font-black">{value}</p>
    </div>
  )
}

function LegendDot({ label, value, className }: { label: string; value: string; className: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border/20 bg-background/20 px-3 py-2 text-xs">
      <span className="flex items-center gap-2 text-muted-foreground">
        <span className={`h-2 w-2 rounded-full ${className}`} />
        {label}
      </span>
      <span className="font-mono font-bold">{value}</span>
    </div>
  )
}

function GrowthTooltip({ active, payload }: GrowthTooltipProps) {
  if (!active || !payload?.length) return null
  const point = payload[0]?.payload
  if (!point) return null

  return (
    <div className="rounded-lg border border-border bg-popover p-3 text-xs shadow-lg">
      <p className="mb-2 font-bold text-foreground">Trade {point.label}</p>
      <div className="grid gap-1.5">
        <div className="flex items-center justify-between gap-4"><span className="text-long">Equity</span><span className="font-mono font-bold">{formatMoney(point.balance)}</span></div>
        <div className="flex items-center justify-between gap-4"><span className="text-muted-foreground">Starting balance</span><span className="font-mono font-bold">{formatMoney(point.startingBalance)}</span></div>
        <div className="flex items-center justify-between gap-4"><span className="text-long">Profit target</span><span className="font-mono font-bold">{formatMoney(point.profitTarget)}</span></div>
        <div className="flex items-center justify-between gap-4"><span className="text-short">Daily loss limit</span><span className="font-mono font-bold">{formatMoney(point.dailyLossFloor)}</span></div>
        <div className="flex items-center justify-between gap-4"><span className="text-short">Max loss limit</span><span className="font-mono font-bold">{formatMoney(point.maxLossFloor)}</span></div>
        <div className="flex items-center justify-between gap-4"><span className={point.pnl >= 0 ? 'text-long' : 'text-short'}>Net P&L</span><span className="font-mono font-bold">{formatMoney(point.pnl)}</span></div>
      </div>
    </div>
  )
}

export function PropFirmGrowthCurveWidget() {
  return (
    <PropFirmWidgetShell title="Prop Firm Growth Curve">
      {({ data }) => {
        const account = data.account
        const phase = account.currentPhase
        const accountSize = Number(account.accountSize || 0)
        const targetBalance = accountSize + accountSize * (Number(phase.profitTargetPercent || 0) / 100)
        const maxDrawdownFloor = accountSize - accountSize * (Number(phase.maxDrawdownPercent || 0) / 100)
        const dailyDrawdownFloor = accountSize - accountSize * (Number(phase.dailyDrawdownPercent || 0) / 100)
        const withReferenceValues = (point: any) => ({
          ...point,
          startingBalance: accountSize,
          profitTarget: targetBalance,
          maxLossFloor: maxDrawdownFloor,
          dailyLossFloor: dailyDrawdownFloor,
        })
        const chartData = data.growth.length ? [{ label: 'Start', balance: accountSize, pnl: 0, timestamp: 0 }, ...data.growth].map(withReferenceValues) : []

        if (!chartData.length) {
          return (
            <div className="flex h-full items-center justify-center rounded-xl border border-border/30 bg-muted/10 p-6 text-center text-sm text-muted-foreground">
              No current-phase trades yet. The growth curve will appear after this challenge has trades.
            </div>
          )
        }

        return (
          <div className="grid h-full min-h-0 gap-4 xl:grid-cols-[1fr_15rem]">
            <div className="min-h-0 rounded-xl border border-border/25 bg-card/45 p-3">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 14, right: 14, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="propFirmGrowth" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={RECHARTS_COLORS.dark.bullish} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={RECHARTS_COLORS.dark.bullish} stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.18} vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} tickFormatter={(value) => `$${Math.round(Number(value) / 1000)}k`} />
                  <Tooltip content={<GrowthTooltip />} />
                  <ReferenceLine y={accountSize} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" opacity={0.45} />
                  <ReferenceLine y={targetBalance} stroke="hsl(var(--chart-bullish))" strokeDasharray="4 4" opacity={0.8} />
                  <ReferenceLine y={dailyDrawdownFloor} stroke="hsl(var(--warning))" strokeDasharray="4 4" opacity={0.8} />
                  <ReferenceLine y={maxDrawdownFloor} stroke="hsl(var(--chart-bearish))" strokeDasharray="4 4" opacity={0.8} />
                  <Area type="monotone" dataKey="balance" name="Equity" stroke={RECHARTS_COLORS.dark.bullish} strokeWidth={2} fill="url(#propFirmGrowth)" dot={false} activeDot={{ r: 4 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="grid content-start gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <Pill label="Net P&L" value={formatMoney(Number(account.currentNetPnL || 0))} />
              <Pill label="Peak equity" value={formatMoney(data.peakEquity)} />
              <Pill label="Max drawdown" value={formatMoney(data.maxDrawdown)} />
              <Pill label="Trading days" value={formatInteger(data.tradingDays)} />
              <Pill label="Trades" value={formatInteger(data.trades.length)} />
              <div className="grid gap-2 sm:col-span-2 xl:col-span-1">
                <LegendDot label="Equity" value="Hover value" className="bg-long" />
                <LegendDot label="Profit target" value={formatMoney(targetBalance)} className="bg-long" />
                <LegendDot label="Daily loss limit" value={formatMoney(dailyDrawdownFloor)} className="bg-warning" />
                <LegendDot label="Max loss limit" value={formatMoney(maxDrawdownFloor)} className="bg-short" />
              </div>
            </div>
          </div>
        )
      }}
    </PropFirmWidgetShell>
  )
}
