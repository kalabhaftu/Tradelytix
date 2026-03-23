'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { Info } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface WidgetCardProps {
  children: React.ReactNode
  /** Widget title shown in the header */
  title?: string
  /** Optional right-side header content (icons, badges, etc.) */
  headerRight?: React.ReactNode
  /** Whether this is a KPI card (compact, no border-radius padding) */
  isKpi?: boolean
  /** Additional className */
  className?: string
  /** Override padding */
  noPadding?: boolean
}

/**
 * Shared widget wrapper — applies the reports page design language
 * to all dashboard widgets for visual consistency.
 */
export function WidgetCard({
  children,
  title,
  headerRight,
  isKpi = false,
  className,
  noPadding = false,
}: WidgetCardProps) {
  if (isKpi) {
    return (
      <div
        className={cn(
          'w-full h-full overflow-hidden widget-card',
          'bg-muted/10 border border-border/40 rounded-xl sm:rounded-2xl',
          'p-3 sm:p-4',
          className
        )}
      >
        {children}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'w-full h-full overflow-hidden flex flex-col widget-card',
        'bg-muted/10 border border-border/40 rounded-xl sm:rounded-2xl',
        !noPadding && 'p-3 sm:p-5',
        className
      )}
    >
      {title && (
        <div className="flex items-center justify-between mb-3 sm:mb-4 flex-shrink-0">
          <div className="flex items-center gap-1.5">
            <h3 className="text-[9px] sm:text-[10px] uppercase font-black tracking-widest text-muted-foreground">
              {title}
            </h3>
          </div>
          {headerRight}
        </div>
      )}
      <div className="flex-1 min-h-0 w-full">
        {children}
      </div>
    </div>
  )
}

/**
 * Shared chart tooltip — matches the reports page tooltip design
 */
export function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null

  return (
    <div className="bg-card border border-border p-3 rounded-lg shadow-md">
      <p className="text-[10px] uppercase font-bold text-muted-foreground/70 mb-2">
        {label}
      </p>
      {payload.map((entry: any, index: number) => (
        <div
          key={index}
          className="flex items-center justify-between gap-4 mb-1 border-b border-border/20 pb-1 last:border-0 last:pb-0 last:mb-0"
        >
          <span
            className="text-xs font-medium text-foreground capitalize"
            style={{ color: entry.color }}
          >
            {entry.name}:
          </span>
          <span className="text-xs font-mono font-bold">
            {typeof entry.value === 'number' && entry.value % 1 !== 0
              ? `$${entry.value.toFixed(2)}`
              : entry.value}
          </span>
        </div>
      ))}
    </div>
  )
}

/**
 * Standard chart color constants matching reports page.
 * CSS var strings for stylesheet usage.
 */
export const CHART_COLORS = {
  bullish: 'hsl(var(--chart-bullish))',
  bearish: 'hsl(var(--chart-bearish))',
  muted: 'hsl(220, 15%, 55%)',
} as const

/**
 * Resolved color values for Recharts SVG contexts where CSS variables
 * don't reliably work in fill/stroke attributes.
 * These match the CSS vars in globals.css.
 */
export const RECHARTS_COLORS = {
  light: {
    bullish: '#83b885',   // --chart-bullish: 123 27% 62%
    bearish: '#c4572a',   // --chart-bearish: 25 70% 45%
    muted: '#7b8494',     // neutral muted
  },
  dark: {
    bullish: '#83b885',   // same in dark
    bearish: '#c4572a',   // same in dark
    muted: '#7b8494',
  },
} as const
