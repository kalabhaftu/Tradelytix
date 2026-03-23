/**
 * Widget Dimensions Configuration
 * 
 * TradeZella-inspired fixed widget sizing system.
 * All widgets maintain consistent dimensions for professional layout.
 */

import { WidgetSize } from '../types/dashboard'

export interface WidgetDimensions {
  /**
   * Grid column span (out of 12 columns)
   */
  colSpan: number
  
  /**
   * Minimum width in pixels
   */
  minWidth: string
  
  /**
   * Fixed height
   */
  height: string
  
  /**
   * Aspect ratio (optional, for responsive scaling)
   */
  aspectRatio?: string
}

/**
 * Fixed widget dimensions matching TradeZella's professional layout
 * 
 * Grid System: 12 columns
 * Gap: 1rem (16px)
 * 
 * Sizes are designed to be:
 * - Wider than previous fractional system
 * - Consistent across breakpoints
 * - Professional and spacious
 */
export const WIDGET_DIMENSIONS: Record<WidgetSize, WidgetDimensions> = {
  // KPI widgets - Always in a row of 5
  'kpi': {
    colSpan: 12,  // Full width on mobile, managed by grid on desktop
    minWidth: '280px',
    height: '140px',
  },
  
  // Tiny widgets - Rarely used
  'tiny': {
    colSpan: 3,
    minWidth: '280px',
    height: '180px',
  },
  
  // Small widgets - 4 columns (1/3 width)
  'small': {
    colSpan: 4,
    minWidth: '420px',
    height: '580px',
  },

  // Small-long widgets - 4 columns, taller
  'small-long': {
    colSpan: 4,
    minWidth: '520px',
    height: '360px',
  },

  // Medium widgets - 6 columns (1/2 width)
  'medium': {
    colSpan: 6,
    minWidth: '620px',
    height: '580px',
  },

  // Large widgets - 8 columns (2/3 width)
  'large': {
    colSpan: 8,
    minWidth: '780px',
    height: '580px',
  },
  
  // Extra-large widgets - 12 columns (full width)
  'extra-large': {
    colSpan: 12,
    minWidth: '100%',
    height: '800px',
  },
}

/**
 * Get Tailwind grid column class for a widget size
 */
export function getGridColClass(size: WidgetSize): string {
  const span = WIDGET_DIMENSIONS[size].colSpan
  return `col-span-12 md:col-span-${span}`
}

/**
 * Get Tailwind height class for a widget size
 */
export function getWidgetHeightClass(size: WidgetSize): string {
  return `h-widget-${size}`
}

/**
 * Get inline styles for a widget (use sparingly, prefer Tailwind)
 */
export function getWidgetStyles(size: WidgetSize): React.CSSProperties {
  const dims = WIDGET_DIMENSIONS[size]
  return {
    minWidth: dims.minWidth,
    height: dims.height,
    ...(dims.aspectRatio && { aspectRatio: dims.aspectRatio }),
  }
}

/**
 * Widget grouping configuration
 * Defines how widgets should be visually grouped
 */
export const WIDGET_GROUPS = {
  kpi: {
    name: 'Key Performance Indicators',
    bgClass: 'bg-kpi-section',
    padding: 'p-4',
    gap: 'gap-3',
    gridCols: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
  },
  charts: {
    name: 'Charts & Analytics',
    bgClass: 'bg-transparent',
    padding: 'px-4',
    gap: 'gap-3',
    gridCols: 'grid-cols-1 md:grid-cols-12',
  },
  tables: {
    name: 'Data Tables',
    bgClass: 'bg-transparent',
    padding: 'px-4',
    gap: 'gap-3',
    gridCols: 'grid-cols-1',
  },
} as const

/**
 * Standard card padding based on size
 */
export const CARD_PADDING: Record<WidgetSize, string> = {
  'kpi': 'p-4',
  'tiny': 'p-3',
  'small': 'p-4',
  'small-long': 'p-4',
  'medium': 'p-4',
  'large': 'p-6',
  'extra-large': 'p-6',
}

/**
 * Standard card header height (consistent across all widgets)
 */
export const CARD_HEADER_HEIGHT = '56px'

/**
 * Get responsive grid configuration for dashboard
 */
export function getDashboardGridConfig() {
  return {
    container: 'max-w-[1920px] mx-auto',
    gap: 'gap-3',
    padding: 'px-4 py-6',
    cols: 'grid-cols-12',
  }
}

/**
 * react-grid-layout default and minimum sizes per widget type
 * 
 * w/h = grid units (columns out of 12, rows where 1 row = ROW_HEIGHT px)
 * minW/minH = minimum resize constraints
 */
export interface WidgetGridDefault {
  defaultW: number
  defaultH: number
  minW: number
  minH: number
}

export const WIDGET_GRID_DEFAULTS: Record<string, WidgetGridDefault> = {
  // KPIs — handled separately, but included for completeness
  accountBalancePnl: { defaultW: 1, defaultH: 1, minW: 1, minH: 1 },
  tradeWinRate:      { defaultW: 1, defaultH: 1, minW: 1, minH: 1 },
  dayWinRate:        { defaultW: 1, defaultH: 1, minW: 1, minH: 1 },
  profitFactor:      { defaultW: 1, defaultH: 1, minW: 1, minH: 1 },
  avgWinLoss:        { defaultW: 1, defaultH: 1, minW: 1, minH: 1 },
  currentStreak:     { defaultW: 1, defaultH: 1, minW: 1, minH: 1 },

  // Charts — 4 cols wide, 4 rows tall (320px)
  netDailyPnL:              { defaultW: 4, defaultH: 4, minW: 3, minH: 3 },
  dailyCumulativePnL:       { defaultW: 4, defaultH: 4, minW: 3, minH: 3 },
  accountBalanceChart:      { defaultW: 4, defaultH: 4, minW: 3, minH: 3 },
  weekdayPnL:               { defaultW: 4, defaultH: 4, minW: 3, minH: 3 },
  tradeDurationPerformance: { defaultW: 4, defaultH: 4, minW: 3, minH: 3 },
  performanceScore:         { defaultW: 4, defaultH: 4, minW: 3, minH: 3 },
  pnlByInstrument:          { defaultW: 4, defaultH: 4, minW: 3, minH: 3 },
  pnlByStrategy:            { defaultW: 4, defaultH: 4, minW: 3, minH: 3 },
  winRateByStrategy:        { defaultW: 4, defaultH: 4, minW: 3, minH: 3 },

  // Command center / session / overview

  tradingOverview:        { defaultW: 6, defaultH: 4, minW: 4, minH: 3 },
  weeklyTracker:          { defaultW: 4, defaultH: 3, minW: 3, minH: 2 },
  sessionAnalysis:        { defaultW: 4, defaultH: 4, minW: 3, minH: 3 },

  // Tables — increased height to match calendar widgets
  recentTrades: { defaultW: 4, defaultH: 7, minW: 3, minH: 5 },

  // Calendars — wider, taller, but can be resized down
  calendarAdvanced: { defaultW: 12, defaultH: 8, minW: 4, minH: 5 },
  calendarMini:     { defaultW: 8, defaultH: 7, minW: 4, minH: 5 },

  // New charts
  equityCurve:            { defaultW: 8, defaultH: 4, minW: 4, minH: 3 },
  outcomeDistribution:    { defaultW: 4, defaultH: 4, minW: 3, minH: 3 },
  dayOfWeekPerformance:   { defaultW: 6, defaultH: 4, minW: 3, minH: 3 },

  // Fallback default
  default: { defaultW: 4, defaultH: 4, minW: 3, minH: 3 },
}

