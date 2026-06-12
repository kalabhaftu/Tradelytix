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
import { useData } from "@/context/data-provider"
import { classifyOutcome, getBreakEvenThreshold } from "@/lib/metrics/outcome"
import { useDashboardDisplay } from '@/hooks/use-dashboard-display'

// ============================================================================
// TYPES
// ============================================================================

interface PnLByStrategyProps {
  size?: WidgetSize
}

interface StrategyData {
  strategy: string
  pnl: number
  trades: number
  wins: number
  losses: number
  winRate: number
  avgPnl: number
  profitFactor: number
}

const AnyBarChart = (RechartsPrimitive as any).BarChart as React.ComponentType<any>

// ============================================================================
// CONSTANTS - Tradezella Premium Styling
// ============================================================================

const COLORS = {
  profit: 'hsl(var(--chart-profit))',
  loss: 'hsl(var(--chart-loss))',
  grid: 'hsl(var(--border))',
  axis: 'hsl(var(--muted-foreground))'
} as const

const CHART_CONFIG = {
  gridOpacity: 0.25,
  barRadius: [4, 4, 0, 0] as [number, number, number, number],
  referenceLineOpacity: 0.4
} as const


// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function PnLByStrategy({ size = 'small-long' }: PnLByStrategyProps) {
  const { statistics } = useData()
  const breakEvenThreshold = getBreakEvenThreshold(statistics?.breakEvenThreshold)
  const { formatValue } = useDashboardDisplay()
  // ---------------------------------------------------------------------------
  // DATA HOOKS (PRESERVED - DO NOT MODIFY)
  // ---------------------------------------------------------------------------
  const { data: chartData = [], isLoading } = useWidgetData('pnlByStrategy')

  if (isLoading) {
    return (
      <WidgetCard title="P/L by Strategy">
        <div className="flex items-center justify-center h-full">
          <div className="animate-pulse w-full h-[200px] bg-muted/20 rounded-xl" />
        </div>
      </WidgetCard>
    )
  }

  if (chartData.length === 0) {
    return (
      <WidgetCard title="P/L by Strategy">
        <div className="flex items-center justify-center h-full text-muted-foreground/50 text-sm">
          No trade data available
        </div>
      </WidgetCard>
    )
  }

  // ---------------------------------------------------------------------------
  // SIZE-RESPONSIVE VALUES
  // ---------------------------------------------------------------------------
  const isCompact = size === 'small' || size === 'small-long'

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------
  return (
    <WidgetCard title="P/L by Strategy">
      <div className="w-full h-full">
        <ResponsiveContainer width="100%" height="100%">
            <AnyBarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 20, right: 20, left: 10, bottom: 20 }}
              barGap={4}
            >
              {/* Subtle Grid - Vertical Only (since horizontal chart) */}
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={COLORS.grid}
                strokeOpacity={CHART_CONFIG.gridOpacity}
                horizontal={false}
              />

{/* X Axis - Currency Values */}
               <XAxis
                 type="number"
                 tickFormatter={(value) => formatValue(value, { kind: 'money', compact: true, sensitive: true })}
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

              {/* Zero Reference Line */}
              <ReferenceLine
                x={0}
                stroke={COLORS.axis}
                strokeDasharray="3 3"
                strokeOpacity={CHART_CONFIG.referenceLineOpacity}
              />

              {/* Tooltip */}
              <RechartsTooltip
                content={<SharedChartTooltip />}
                cursor={{ fill: 'hsl(var(--muted)/0.3)' }}
              />

              {/* Bars with Rounded Ends */}
              <Bar
                dataKey="pnl"
                radius={[0, 4, 4, 0]}
                maxBarSize={40}
              >
                {chartData.map((entry: any, index: number) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      classifyOutcome(entry.pnl, breakEvenThreshold) === 'win'
                        ? COLORS.profit
                        : classifyOutcome(entry.pnl, breakEvenThreshold) === 'loss'
                          ? COLORS.loss
                          : 'hsl(var(--muted-foreground)/0.4)'
                    }
                  />
                ))}
              </Bar>
            </AnyBarChart>
          </ResponsiveContainer>
      </div>
    </WidgetCard>
  )
}
