"use client"

import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { PropFirmWidgetShell } from './prop-firm-widget-shell'
import { useDashboardDisplay } from '@/hooks/use-dashboard-display'
import { useTheme } from '@/context/theme-provider'

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
  const points = [
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

  if (points.length === 1) {
    points.push({
      ...points[0],
      label: 'Current',
      timestamp: 1,
    })
  }

  return points
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

function GrowthTooltip({ active, payload }: any) {
  const { formatValue, isPrivacyMode } = useDashboardDisplay()
  const forcedMode = isPrivacyMode ? 'privacy' : 'dollars'
  
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
        <div className="flex min-w-[11rem] justify-between gap-4"><span>Equity</span><span className="font-mono text-foreground">{formatValue(point.balance, { kind: 'money', sensitive: true, forceMode: forcedMode })}</span></div>
        <div className="flex justify-between gap-4"><span>Net P&L</span><span className={point.pnl >= 0 ? 'font-mono text-long' : 'font-mono text-short'}>{formatValue(point.pnl, { kind: 'money', sensitive: true, forceMode: forcedMode })}</span></div>
        {!isStart ? <div className="flex justify-between gap-4"><span>Trade P&L</span><span className={point.tradePnl >= 0 ? 'font-mono text-long' : 'font-mono text-short'}>{formatValue(point.tradePnl, { kind: 'money', sensitive: true, forceMode: forcedMode })}</span></div> : null}
        <div className="h-px bg-border/50 my-2" />
        <div className="flex justify-between gap-4"><span>To target</span><span className="font-mono text-primary">{formatValue(targetDistance, { kind: 'money', sensitive: true, forceMode: forcedMode })}</span></div>
        <div className="flex justify-between gap-4"><span>Above daily DD</span><span className="font-mono text-amber-500">{formatValue(dailyDistance, { kind: 'money', sensitive: true, forceMode: forcedMode })}</span></div>
        <div className="flex justify-between gap-4"><span>Above max DD</span><span className="font-mono text-short">{formatValue(maxDistance, { kind: 'money', sensitive: true, forceMode: forcedMode })}</span></div>
      </div>
    </div>
  )
}

export function PropFirmGrowthCurveWidget() {
  const { chartStyle } = useTheme()
  const { formatValue, isPrivacyMode } = useDashboardDisplay()
  const forcedMode = isPrivacyMode ? 'privacy' : 'dollars'

  return (
    <PropFirmWidgetShell title="Prop Firm Growth Curve">
      {({ data }) => {
        const account = data.account
        const refs = getReferenceValues(account, data)
        const chartData = buildChartData(account, data, refs)
        const yDomain = getYAxisDomain(chartData, refs)

        const isSharp = chartStyle === 'sharp'
        const strokeColor = 'hsl(var(--primary))'
        const gradientColor = 'hsl(var(--primary))'
        const curveType = isSharp ? 'linear' : 'monotone'

        return (
          <div className="flex h-full min-h-0 flex-col gap-4">
            <div className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground sm:grid-cols-4">
              <span>Start <b className="font-mono text-foreground">{formatValue(refs.accountSize, { kind: 'money', sensitive: true, forceMode: forcedMode })}</b></span>
              <span>Target <b className="font-mono text-long">{formatValue(refs.targetBalance, { kind: 'money', sensitive: true, forceMode: forcedMode })}</b></span>
              <span>Daily DD <b className="font-mono text-amber-500">{formatValue(refs.dailyLossFloor, { kind: 'money', sensitive: true, forceMode: forcedMode })}</b></span>
              <span>Max DD <b className="font-mono text-short">{formatValue(refs.maxLossFloor, { kind: 'money', sensitive: true, forceMode: forcedMode })}</b></span>
            </div>
            <div className="min-h-0 flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 18, right: 56, bottom: 8, left: 10 }}>
                  <defs>
                    <linearGradient id="propFirmGrowth" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={gradientColor} stopOpacity={0.32} />
                      <stop offset="95%" stopColor={gradientColor} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.35} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} minTickGap={14} />
                  <YAxis
                    width={48}
                    domain={yDomain}
                    tickLine={false}
                    axisLine={false}
                    tick={isPrivacyMode ? false : { fontSize: 10 }}
                    tickFormatter={(value) => isPrivacyMode ? '' : formatValue(Number(value), { kind: 'money', compact: true, sensitive: true, forceMode: forcedMode })}
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