"use client"

import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { PropFirmWidgetShell } from './prop-firm-widget-shell'
import { formatMoney } from './prop-firm-widget-utils'
import { formatPropFirmAxisMoney } from '@/lib/prop-firm/widget-metrics'

function getReferenceValues(account: any, data: any) {
  const accountSize = Number(account.accountSize || 0)
  const phase = account.currentPhase || {}
  const targetAmount = accountSize * (Number(phase.profitTargetPercent || 0) / 100)
  const maxLossLimit = accountSize * (Number(phase.maxDrawdownPercent || 0) / 100)
  const dailyLossFloor = data.dailyDrawdown.dailyLossFloor
  const highWaterMark = Math.max(Number(data.peakEquity || accountSize), accountSize)
  const isTrailing = phase.maxDrawdownType === 'trailing'
  const maxLossFloor = isTrailing ? highWaterMark - (highWaterMark * (Number(phase.maxDrawdownPercent || 0) / 100)) : accountSize - maxLossLimit

  return {
    accountSize,
    targetBalance: accountSize + targetAmount,
    dailyLossFloor,
    maxLossFloor,
  }
}

function buildChartData(account: any, data: any, refs: ReturnType<typeof getReferenceValues>) {
  return [
    {
      label: 'Start',
      timestamp: 0,
      balance: refs.accountSize,
      pnl: 0,
      tradePnl: 0,
      startingBalance: refs.accountSize,
      profitTarget: refs.targetBalance,
      dailyLossFloor: refs.dailyLossFloor,
      maxLossFloor: refs.maxLossFloor,
    },
    ...data.growth.map((point: any) => ({
      ...point,
      startingBalance: refs.accountSize,
      profitTarget: refs.targetBalance,
      dailyLossFloor: refs.dailyLossFloor,
      maxLossFloor: refs.maxLossFloor,
    })),
  ]
}

function getYAxisDomain(chartData: any[], refs: ReturnType<typeof getReferenceValues>) {
  const values = [
    refs.accountSize,
    refs.targetBalance,
    refs.dailyLossFloor,
    refs.maxLossFloor,
    ...chartData.map((point) => Number(point.balance || 0)),
  ]
  const min = Math.min(...values)
  const max = Math.max(...values)
  const padding = Math.max((max - min) * 0.12, refs.accountSize * 0.01, 50)

  return [Math.floor(min - padding), Math.ceil(max + padding)] as [number, number]
}

import { useTheme } from '@/context/theme-provider'

function GrowthTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const point = payload[0]?.payload
  if (!point) return null

  const isStart = point.label === 'Start'
  const targetDistance = Number(point.profitTarget || 0) - Number(point.balance || 0)
  const dailyDistance = Number(point.balance || 0) - Number(point.dailyLossFloor || 0)
  const maxDistance = Number(point.balance || 0) - Number(point.maxLossFloor || 0)

  return (
    <div className="rounded-xl border border-border/40 bg-popover/95 p-3 text-xs shadow-xl backdrop-blur">
      <p className="mb-2 font-bold text-foreground">{isStart ? 'Start balance' : `Trade ${point.label}`}</p>
      <div className="space-y-1.5 text-muted-foreground">
        <div className="flex min-w-[11rem] justify-between gap-4"><span>Equity</span><span className="font-mono text-foreground">{formatMoney(point.balance)}</span></div>
        <div className="flex justify-between gap-4"><span>Net P&L</span><span className={point.pnl >= 0 ? 'font-mono text-long' : 'font-mono text-short'}>{formatMoney(point.pnl)}</span></div>
        {!isStart ? <div className="flex justify-between gap-4"><span>Trade P&L</span><span className={point.tradePnl >= 0 ? 'font-mono text-long' : 'font-mono text-short'}>{formatMoney(point.tradePnl)}</span></div> : null}
        <div className="h-px bg-border/50 my-2" />
        <div className="flex justify-between gap-4"><span>To target</span><span className="font-mono text-primary">{formatMoney(targetDistance)}</span></div>
        <div className="flex justify-between gap-4"><span>Above daily DD</span><span className="font-mono text-amber-500">{formatMoney(dailyDistance)}</span></div>
        <div className="flex justify-between gap-4"><span>Above max DD</span><span className="font-mono text-short">{formatMoney(maxDistance)}</span></div>
      </div>
    </div>
  )
}

export function PropFirmGrowthCurveWidget() {
  const { chartStyle } = useTheme()

  return (
    <PropFirmWidgetShell title="Prop Firm Growth Curve">
      {({ data }) => {
        const account = data.account
        const refs = getReferenceValues(account, data)
        const chartData = buildChartData(account, data, refs)
        const yDomain = getYAxisDomain(chartData, refs)

        const isSharp = chartStyle === 'sharp'
        const strokeColor = isSharp ? '#a78bfa' : 'hsl(var(--primary))'
        const gradientColor = isSharp ? '#a78bfa' : 'hsl(var(--primary))'
        const curveType = isSharp ? 'linear' : 'monotone'

        return (
          <div className="flex h-full min-h-0 flex-col gap-4">
            <div className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground sm:grid-cols-4">
              <span>Start <b className="font-mono text-foreground">{formatMoney(refs.accountSize)}</b></span>
              <span>Target <b className="font-mono text-long">{formatMoney(refs.targetBalance)}</b></span>
              <span>Daily DD <b className="font-mono text-amber-500">{formatMoney(refs.dailyLossFloor)}</b></span>
              <span>Max DD <b className="font-mono text-short">{formatMoney(refs.maxLossFloor)}</b></span>
            </div>
            <div className="min-h-0 flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 18, right: 28, bottom: 8, left: 20 }}>
                  <defs>
                    <linearGradient id="propFirmGrowth" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={gradientColor} stopOpacity={0.32} />
                      <stop offset="95%" stopColor={gradientColor} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.35} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} minTickGap={14} />
                  <YAxis
                    width={78}
                    domain={yDomain}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 10 }}
                    tickFormatter={(value) => formatPropFirmAxisMoney(Number(value))}
                  />
                  <Tooltip content={<GrowthTooltip />} cursor={{ stroke: strokeColor, strokeDasharray: '4 4', strokeWidth: 1.5 }} />
                  <ReferenceLine y={refs.accountSize} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" label={{ value: 'Start', position: 'right', fontSize: 10 }} />
                  <ReferenceLine y={refs.targetBalance} stroke="hsl(var(--long))" strokeDasharray="5 5" label={{ value: 'Target', position: 'right', fontSize: 10 }} />
                  <ReferenceLine y={refs.dailyLossFloor} stroke="#f59e0b" strokeDasharray="5 5" label={{ value: 'Daily DD', position: 'right', fontSize: 10 }} />
                  <ReferenceLine y={refs.maxLossFloor} stroke="hsl(var(--short))" strokeDasharray="5 5" label={{ value: 'Max DD', position: 'right', fontSize: 10 }} />
                  <Area type={curveType} dataKey="balance" stroke={strokeColor} strokeWidth={2.5} fill="url(#propFirmGrowth)" dot={false} activeDot={{ r: 4, strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )
      }}
    </PropFirmWidgetShell>
  )
}
