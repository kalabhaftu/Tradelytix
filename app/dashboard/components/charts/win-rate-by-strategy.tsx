"use client"

import * as React from "react"
import * as RechartsPrimitive from "recharts"
import {
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ReferenceLine
} from "recharts"
import { Info } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { WidgetCard, ChartTooltip as SharedChartTooltip } from '../widget-card'
import { useWidgetData } from "@/hooks/use-widget-data"
import { WidgetSize } from '@/app/dashboard/types/dashboard'

// ============================================================================
// TYPES
// ============================================================================

interface WinRateByStrategyProps {
  size?: WidgetSize
}

interface StrategyWinRate {
  strategy: string
  winRate: number
  totalTrades: number
  wins: number
  losses: number
  profitFactor: number
  consistency: number
}

const AnyBarChart = (RechartsPrimitive as any).BarChart as React.ComponentType<any>

// ============================================================================
// CONSTANTS - Tradezella Premium Styling
// ============================================================================

const COLORS = {
  profit: 'hsl(var(--chart-profit))',
  loss: 'hsl(var(--chart-loss))',
  grid: 'hsl(var(--border))',
  axis: 'hsl(var(--muted-foreground))',
  reference: 'hsl(var(--chart-4))'  // 50% reference line
} as const

const CHART_CONFIG = {
  gridOpacity: 0.25,
  barRadius: [0, 4, 4, 0] as [number, number, number, number],
  referenceLineOpacity: 0.6
} as const



// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function WinRateByStrategy({ size = 'small-long' }: WinRateByStrategyProps) {
  // ---------------------------------------------------------------------------
  // DATA HOOKS (PRESERVED - DO NOT MODIFY)
  // ---------------------------------------------------------------------------
  const { data: chartData = [], isLoading } = useWidgetData('winRateByStrategy')

  if (isLoading) {
    return (
      <WidgetCard title="Win Rate by Strategy">
        <div className="flex items-center justify-center h-full">
          <div className="animate-pulse w-full h-[200px] bg-muted/20 rounded-xl" />
        </div>
      </WidgetCard>
    )
  }

  if (chartData.length === 0) {
    return (
      <WidgetCard title="Win Rate by Strategy">
        <div className="flex items-center justify-center h-full text-muted-foreground/50 text-sm">
          No trade data available
        </div>
      </WidgetCard>
    )
  }

  // ---------------------------------------------------------------------------
  // COMPUTED VALUES
  // ---------------------------------------------------------------------------
  const avgWinRate = chartData.length > 0
    ? chartData.reduce((sum: number, item: any) => sum + item.winRate, 0) / chartData.length
    : 0

  // ---------------------------------------------------------------------------
  // SIZE-RESPONSIVE VALUES
  // ---------------------------------------------------------------------------
  const isCompact = size === 'small' || size === 'small-long'

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------
  return (
    <WidgetCard title="Win Rate by Strategy">
                  <ResponsiveContainer width="100%" height="100%">
            <AnyBarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
              barGap={4}
            >
              {/* Subtle Grid */}
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={COLORS.grid}
                strokeOpacity={CHART_CONFIG.gridOpacity}
                horizontal={false}
              />

              {/* X Axis - Win Rate Percentage */}
              <XAxis
                type="number"
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
                stroke={COLORS.axis}
                fontSize={isCompact ? 10 : 11}
                tickLine={false}
                axisLine={false}
              />

              {/* Y Axis - Strategy Names */}
              <YAxis
                type="category"
                dataKey="strategy"
                stroke={COLORS.axis}
                fontSize={isCompact ? 9 : 10}
                tickLine={false}
                axisLine={false}
                width={80}
                tickFormatter={(value) => value.length > 12 ? value.substring(0, 10) + '...' : value}
              />

              {/* 50% Reference Line */}
              <ReferenceLine
                x={50}
                stroke={COLORS.reference}
                strokeDasharray="3 3"
                strokeOpacity={CHART_CONFIG.referenceLineOpacity}
                label={{
                  value: '50%',
                  position: 'top',
                  fontSize: 10,
                  fill: COLORS.reference
                }}
              />

              {/* Tooltip */}
              <RechartsTooltip
                content={<SharedChartTooltip />}
                cursor={{ fill: 'hsl(var(--muted)/0.3)' }}
              />

              {/* Bars with Rounded Ends */}
              <Bar
                dataKey="winRate"
                radius={CHART_CONFIG.barRadius}
                maxBarSize={35}
              >
                {chartData.map((entry: any, index: number) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.winRate >= 50 ? COLORS.profit : COLORS.loss}
                  />
                ))}
              </Bar>
            </AnyBarChart>
          </ResponsiveContainer>
    </WidgetCard>
  )
}
