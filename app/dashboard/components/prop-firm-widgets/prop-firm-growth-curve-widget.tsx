"use client"

import { useCallback, useMemo } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { PropFirmWidgetShell } from './prop-firm-widget-shell'
import { useDashboardDisplay } from '@/hooks/use-dashboard-display'
import { useTheme } from '@/context/theme-provider'

/* ──────────────────────────────────────────────────────────────────── *
 *  Data helpers
 * ──────────────────────────────────────────────────────────────────── */

function getReferenceValues(account: any, data: any) {
  const accountSize = Number(account.accountSize || 0)
  const phase = account.currentPhase || {}
  const targetAmount = accountSize * (Number(phase.profitTargetPercent || 0) / 100)
  const maxLossLimit = accountSize * (Number(phase.maxDrawdownPercent || 0) / 100)
  const dailyLossFloor = data.dailyDrawdown.dailyLossFloor
  const highWaterMark = Math.max(Number(data.peakEquity || accountSize), accountSize)
  const isTrailing = phase.maxDrawdownType === 'trailing'
  const maxLossFloor = isTrailing
    ? highWaterMark - (highWaterMark * (Number(phase.maxDrawdownPercent || 0) / 100))
    : accountSize - maxLossLimit

  // Current balance = last growth point or accountSize
  const growthPoints = data.growth || []
  const lastPoint = growthPoints[growthPoints.length - 1]
  const currentBalance = lastPoint ? Number(lastPoint.balance) : accountSize

  return {
    accountSize,
    targetBalance: accountSize + targetAmount,
    dailyLossFloor,
    maxLossFloor,
    currentBalance,
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
    },
    ...data.growth.map((point: any) => ({
      ...point,
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

/* ──────────────────────────────────────────────────────────────────── *
 *  Y-axis: use exact reference values as ticks
 * ──────────────────────────────────────────────────────────────────── */

function getYAxisConfig(chartData: any[], refs: ReturnType<typeof getReferenceValues>) {
  // The Y-axis must show exact meaningful values
  const balances = chartData.map((p) => Number(p.balance || 0)).filter((v) => !isNaN(v) && v > 0)
  const currentBalance = balances.length > 0 ? balances[balances.length - 1] : refs.accountSize

  // Gather all reference values + min/max balance
  const allValues = [
    refs.accountSize,
    refs.targetBalance,
    refs.dailyLossFloor,
    refs.maxLossFloor,
    currentBalance,
    ...balances,
  ].filter((v) => !isNaN(v) && v > 0)

  const rawMin = Math.min(...allValues)
  const rawMax = Math.max(...allValues)
  const range = rawMax - rawMin

  // Domain: small padding so reference lines don't sit on the edge
  const pad = Math.max(range * 0.05, 10)
  const domainMin = Math.floor(rawMin - pad)
  const domainMax = Math.ceil(rawMax + pad)

  // Build custom ticks: exact reference values + current balance
  // Deduplicate and sort
  const tickSet = new Set<number>()
  tickSet.add(refs.accountSize)
  tickSet.add(refs.targetBalance)
  if (refs.dailyLossFloor > 0) tickSet.add(refs.dailyLossFloor)
  if (refs.maxLossFloor > 0) tickSet.add(refs.maxLossFloor)
  // Only add current balance if it's meaningfully different from accountSize
  if (Math.abs(currentBalance - refs.accountSize) > 1) {
    tickSet.add(Math.round(currentBalance * 100) / 100)
  }
  const ticks = Array.from(tickSet).sort((a, b) => a - b)

  return {
    domain: [domainMin, domainMax] as [number, number],
    ticks,
    currentBalance,
  }
}

/* ──────────────────────────────────────────────────────────────────── *
 *  Tooltip: shows all reference values relative to current point
 * ──────────────────────────────────────────────────────────────────── */

function GrowthTooltip({ active, payload, refs }: any) {
  const { formatValue, isPrivacyMode } = useDashboardDisplay()
  const forcedMode = isPrivacyMode ? 'privacy' : 'dollars'

  if (!active || !payload?.length) return null
  const point = payload[0]?.payload
  if (!point) return null

  const balance = Number(point.balance || 0)
  const isStart = point.label === 'Start'
  const targetDistance = Number(refs?.targetBalance || 0) - balance
  const dailyDistance = balance - Number(refs?.dailyLossFloor || 0)
  const maxDistance = balance - Number(refs?.maxLossFloor || 0)

  return (
    <div className="rounded-xl border border-border/40 bg-popover/95 p-3 text-xs shadow-xl backdrop-blur">
      <p className="mb-2 font-bold text-foreground">
        {isStart ? 'Start balance' : `Trade ${point.label}`}
      </p>
      <div className="space-y-1.5 text-muted-foreground">
        <div className="flex min-w-[12rem] justify-between gap-4">
          <span>Equity</span>
          <span className="font-mono text-foreground">
            {formatValue(balance, { kind: 'money', sensitive: true, forceMode: forcedMode })}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span>Net P&L</span>
          <span className={(point.pnl ?? 0) >= 0 ? 'font-mono text-long' : 'font-mono text-short'}>
            {formatValue(point.pnl ?? 0, { kind: 'money', sensitive: true, forceMode: forcedMode })}
          </span>
        </div>
        {!isStart && (
          <div className="flex justify-between gap-4">
            <span>Trade P&L</span>
            <span className={(point.tradePnl ?? 0) >= 0 ? 'font-mono text-long' : 'font-mono text-short'}>
              {formatValue(point.tradePnl ?? 0, { kind: 'money', sensitive: true, forceMode: forcedMode })}
            </span>
          </div>
        )}
        <div className="h-px bg-border/50 my-2" />

        {/* Reference line distances */}
        <div className="flex justify-between gap-4">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-[2px] rounded bg-[hsl(var(--long))]" />
            To target
          </span>
          <span className="font-mono text-[hsl(var(--long))]">
            {formatValue(targetDistance, { kind: 'money', sensitive: true, forceMode: forcedMode })}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-[2px] rounded bg-amber-500" />
            Above daily DD
          </span>
          <span className="font-mono text-amber-500">
            {formatValue(dailyDistance, { kind: 'money', sensitive: true, forceMode: forcedMode })}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-[2px] rounded bg-[hsl(var(--short))]" />
            Above max DD
          </span>
          <span className="font-mono text-[hsl(var(--short))]">
            {formatValue(maxDistance, { kind: 'money', sensitive: true, forceMode: forcedMode })}
          </span>
        </div>

        {/* Starting balance reference */}
        <div className="flex justify-between gap-4">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-[2px] rounded bg-[hsl(var(--muted-foreground))]" />
            Start
          </span>
          <span className="font-mono text-muted-foreground">
            {formatValue(refs?.accountSize ?? 0, { kind: 'money', sensitive: true, forceMode: forcedMode })}
          </span>
        </div>
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────────── *
 *  Main widget
 * ──────────────────────────────────────────────────────────────────── */

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
        const yAxisConfig = getYAxisConfig(chartData, refs)

        const isSharp = chartStyle === 'sharp'
        const strokeColor = 'hsl(var(--primary))'
        const gradientColor = 'hsl(var(--primary))'
        const curveType = isSharp ? 'linear' : 'monotone'

        return (
          <div className="flex h-full min-h-0 flex-col gap-4">
            {/* Stats row */}
            <div className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground sm:grid-cols-4">
              <span>
                Start{' '}
                <b className="font-mono text-foreground">
                  {formatValue(refs.accountSize, { kind: 'money', sensitive: true, forceMode: forcedMode })}
                </b>
              </span>
              <span>
                Target{' '}
                <b className="font-mono text-long">
                  {formatValue(refs.targetBalance, { kind: 'money', sensitive: true, forceMode: forcedMode })}
                </b>
              </span>
              <span>
                Daily DD{' '}
                <b className="font-mono text-amber-500">
                  {formatValue(refs.dailyLossFloor, { kind: 'money', sensitive: true, forceMode: forcedMode })}
                </b>
              </span>
              <span>
                Max DD{' '}
                <b className="font-mono text-short">
                  {formatValue(refs.maxLossFloor, { kind: 'money', sensitive: true, forceMode: forcedMode })}
                </b>
              </span>
            </div>

            {/* Chart */}
            <div className="min-h-0 flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 18, right: 72, bottom: 8, left: 10 }}
                >
                  <defs>
                    <linearGradient id="propFirmGrowth" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={gradientColor} stopOpacity={0.32} />
                      <stop offset="95%" stopColor={gradientColor} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                    opacity={0.35}
                  />

                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 10 }}
                    minTickGap={14}
                  />

                  {/* Y-axis uses exact reference values as ticks */}
                  <YAxis
                    width={60}
                    domain={yAxisConfig.domain}
                    ticks={yAxisConfig.ticks}
                    tickLine={false}
                    axisLine={false}
                    tick={isPrivacyMode ? false : { fontSize: 9 }}
                    tickFormatter={(value) =>
                      isPrivacyMode
                        ? ''
                        : formatValue(Number(value), {
                            kind: 'money',
                            compact: false,
                            sensitive: true,
                            forceMode: forcedMode,
                          })
                    }
                  />

                  {/* Tooltip: fires on hover anywhere across full chart width */}
                  <Tooltip
                    content={<GrowthTooltip refs={refs} />}
                    cursor={{
                      stroke: strokeColor,
                      strokeDasharray: '4 4',
                      strokeWidth: 1.5,
                    }}
                    isAnimationActive={false}
                    filterNull={false}
                  />

                  {/* Reference lines — labels pinned to the right edge */}
                  <ReferenceLine
                    y={refs.accountSize}
                    stroke="hsl(var(--muted-foreground))"
                    strokeDasharray="4 4"
                    label={{
                      value: 'Start',
                      position: 'right',
                      fontSize: 9,
                      fill: 'hsl(var(--muted-foreground))',
                      offset: 8,
                    }}
                  />
                  <ReferenceLine
                    y={refs.targetBalance}
                    stroke="hsl(var(--long))"
                    strokeDasharray="5 5"
                    label={{
                      value: 'Target',
                      position: 'right',
                      fontSize: 9,
                      fill: 'hsl(var(--long))',
                      offset: 8,
                    }}
                  />
                  <ReferenceLine
                    y={refs.dailyLossFloor}
                    stroke="#f59e0b"
                    strokeDasharray="5 5"
                    label={{
                      value: 'Daily DD',
                      position: 'right',
                      fontSize: 9,
                      fill: '#f59e0b',
                      offset: 8,
                    }}
                  />
                  <ReferenceLine
                    y={refs.maxLossFloor}
                    stroke="hsl(var(--short))"
                    strokeDasharray="5 5"
                    label={{
                      value: 'Max DD',
                      position: 'right',
                      fontSize: 9,
                      fill: 'hsl(var(--short))',
                      offset: 8,
                    }}
                  />

                  {/* Balance area — baseValue stretches fill to domain floor for full hover area */}
                  <Area
                    type={curveType}
                    dataKey="balance"
                    stroke={strokeColor}
                    strokeWidth={2.5}
                    fill="url(#propFirmGrowth)"
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 2 }}
                    isAnimationActive={false}
                    baseValue={yAxisConfig.domain[0]}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )
      }}
    </PropFirmWidgetShell>
  )
}