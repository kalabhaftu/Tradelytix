"use client"

import * as React from "react"
const { memo } = React
import {
  Line,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Dot
} from "recharts"

const AnyLineChart = LineChart as any
import { Info } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { WidgetCard, ChartTooltip as SharedChartTooltip } from '../widget-card'
import { useWidgetData } from '@/hooks/use-widget-data'
import { useDashboardDisplay } from '@/hooks/use-dashboard-display'
import { useTheme } from '@/context/theme-provider'
import { useUserStore } from "@/store/user-store"
import { formatNumber } from "@/lib/utils"
import { WidgetSize } from '@/app/dashboard/types/dashboard'
import { calculateTotalStartingBalance } from '@/lib/utils/balance-calculator'

// ============================================================================
// TYPES
// ============================================================================

interface AccountBalanceChartProps {
  size?: WidgetSize
}

interface ChartDataPoint {
  date: string
  balance: number
  change: number
  changePercent: number
  trades: number
  wins: number
  losses: number
  hasActivity: boolean
}

// ============================================================================
// CONSTANTS - Tradezella Premium Styling
// ============================================================================

const COLORS = {
  profit: 'hsl(var(--chart-profit))',
  loss: 'hsl(var(--chart-loss))',
  grid: 'hsl(var(--border))',
  axis: 'hsl(var(--muted-foreground))',
  line: 'hsl(var(--chart-profit))'
} as const

const CHART_CONFIG = {
  gridOpacity: 0.25,
  strokeWidth: 2.5,
  dotRadius: 4
} as const


// ============================================================================
// CUSTOM DOT COMPONENT
// ============================================================================
// CUSTOM DOT COMPONENT
// ============================================================================

function CustomDot(props: any) {
  const { cx, cy, payload, fill } = props
  if (!payload.hasActivity) return null

  return (
    <Dot
      cx={cx}
      cy={cy}
      r={CHART_CONFIG.dotRadius}
      fill={fill || COLORS.profit}
      stroke="hsl(var(--background))"
      strokeWidth={2}
    />
  )
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function formatAxisValue(value: number): string {
  const absValue = Math.abs(value)
  if (absValue >= 1000000) {
    return `${value < 0 ? '-' : ''}$${formatNumber(absValue / 1000000, 1)}M`
  }
  if (absValue >= 1000) {
    return `${value < 0 ? '-' : ''}$${formatNumber(absValue / 1000, 1)}k`
  }
  return `${value < 0 ? '-' : ''}$${formatNumber(absValue, 0)}`
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

function AccountBalanceChart({ size = 'small-long' }: AccountBalanceChartProps) {
  const { data: rawChartData, isLoading } = useWidgetData('accountBalanceChart')
  const { formatValue, transformValue, isPrivacyMode } = useDashboardDisplay()
  const { chartStyle } = useTheme()
  const chartData = React.useMemo(
    () =>
      (rawChartData ?? []).map((item: any) => ({
        ...item,
        balance: transformValue(item.balance, { kind: 'balance' }) ?? 0,
        change: transformValue(item.change, { kind: 'money' }) ?? 0,
      })),
    [rawChartData, transformValue]
  )

  if (isLoading) {
    return (
      <WidgetCard title="Account Balance">
        <div className="flex items-center justify-center h-full">
          <div className="animate-pulse w-full h-[200px] bg-muted/20 rounded-xl" />
        </div>
      </WidgetCard>
    )
  }

  if (!chartData || chartData.length === 0) {
    return (
      <WidgetCard title="Account Balance">
        <div className="flex items-center justify-center h-full text-muted-foreground/50 text-sm">
          No trade data available
        </div>
      </WidgetCard>
    )
  }

  // ---------------------------------------------------------------------------
  // LINE COLOR DETERMINATION (PRESERVED - DO NOT MODIFY)
  // ---------------------------------------------------------------------------
  const initialBalance = chartData.length > 0 ? chartData[0].balance : 0
  const currentBalance = chartData.length > 0 ? chartData[chartData.length - 1].balance : initialBalance
  const isPositive = currentBalance >= initialBalance

  // ---------------------------------------------------------------------------
  // SIZE-RESPONSIVE VALUES
  // ---------------------------------------------------------------------------
  const isCompact = size === 'small' || size === 'small-long'

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------
  return (
    <WidgetCard title="Account Balance">
      <div className="w-full h-full">
        <ResponsiveContainer width="100%" height="100%">
            <AnyLineChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              {/* Subtle Grid - Horizontal Only */}
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={COLORS.grid}
                strokeOpacity={CHART_CONFIG.gridOpacity}
                vertical={false}
              />

              {/* X Axis - Dates */}
              <XAxis
                dataKey="date"
                tickFormatter={(value) => {
                  const date = new Date(value + 'T00:00:00Z')
                  return date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    timeZone: 'UTC'
                  })
                }}
                stroke={COLORS.axis}
                fontSize={isCompact ? 10 : 11}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={40}
              />

{/* Y Axis - Currency */}
               <YAxis
                 tick={isPrivacyMode ? false : { fontSize: isCompact ? 10 : 11 }}
                 tickFormatter={(value) => isPrivacyMode ? "" : formatValue(value, { kind: 'balance', compact: true, sensitive: true })}
                 stroke={COLORS.axis}
                 fontSize={isCompact ? 10 : 11}
                 tickLine={false}
                 axisLine={false}
                 width={isPrivacyMode ? 10 : 55}
                 domain={['auto', 'auto']}
               />

              {/* Tooltip */}
              <RechartsTooltip
                content={<SharedChartTooltip />}
                cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeDasharray: '3 3' }}
              />

              {/* Line */}
              <Line
                type={chartStyle === 'sharp' ? 'linear' : 'monotone'}
                dataKey="balance"
                stroke={isPositive ? COLORS.profit : COLORS.loss}
                strokeWidth={CHART_CONFIG.strokeWidth}
                dot={<CustomDot fill={COLORS.profit} />}
                activeDot={{
                  r: 6,
                  strokeWidth: 2,
                  stroke: 'hsl(var(--background))'
                }}
              />
            </AnyLineChart>
        </ResponsiveContainer>
      </div>
    </WidgetCard>
  )
}

export default memo(AccountBalanceChart)
