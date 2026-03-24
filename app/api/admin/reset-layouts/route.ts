import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/admin/reset-layouts
 * 
 * Resets ALL default templates to the updated default layout.
 * Run once after deploying layout changes to sync all users.
 * 
 * Protected: requires admin secret in Authorization header.
 */

const UPDATED_DEFAULT_LAYOUT = [
  { i: 'kpi-1', type: 'accountBalancePnl', size: 'kpi', x: 0, y: 0, w: 1, h: 1 },
  { i: 'kpi-2', type: 'tradeWinRate', size: 'kpi', x: 1, y: 0, w: 1, h: 1 },
  { i: 'kpi-3', type: 'dayWinRate', size: 'kpi', x: 2, y: 0, w: 1, h: 1 },
  { i: 'kpi-4', type: 'profitFactor', size: 'kpi', x: 3, y: 0, w: 1, h: 1 },
  { i: 'kpi-5', type: 'avgWinLoss', size: 'kpi', x: 4, y: 0, w: 1, h: 1 },
  { i: 'equity-curve', type: 'equityCurve', size: 'large', x: 0, y: 1, w: 8, h: 4 },
  { i: 'drawdown', type: 'drawdown', size: 'small-long', x: 8, y: 1, w: 4, h: 4 },
  { i: 'mini-calendar', type: 'calendarMini', size: 'large', x: 0, y: 5, w: 8, h: 5 },
  { i: 'recent-trades', type: 'recentTrades', size: 'small', x: 8, y: 5, w: 4, h: 5 },
  { i: 'net-daily-pnl', type: 'netDailyPnL', size: 'small-long', x: 0, y: 10, w: 4, h: 4 },
  { i: 'daily-cumulative-pnl', type: 'dailyCumulativePnL', size: 'small-long', x: 4, y: 10, w: 4, h: 4 },
  { i: 'account-balance', type: 'accountBalanceChart', size: 'small-long', x: 8, y: 10, w: 4, h: 4 },
  { i: 'outcome-dist', type: 'outcomeDistribution', size: 'medium', x: 0, y: 14, w: 4, h: 4 },
  { i: 'day-of-week', type: 'dayOfWeekPerformance', size: 'medium', x: 4, y: 14, w: 4, h: 4 },
  { i: 'weekday-pnl', type: 'weekdayPnL', size: 'small-long', x: 8, y: 14, w: 4, h: 4 },
  { i: 'pnl-by-strategy', type: 'pnlByStrategy', size: 'small-long', x: 0, y: 18, w: 4, h: 4 },
  { i: 'win-rate-by-strategy', type: 'winRateByStrategy', size: 'small-long', x: 4, y: 18, w: 4, h: 4 },
  { i: 'pnl-by-instrument', type: 'pnlByInstrument', size: 'small-long', x: 8, y: 18, w: 4, h: 4 },
  { i: 'performance-score', type: 'performanceScore', size: 'small-long', x: 0, y: 22, w: 4, h: 4 },
  { i: 'trade-duration', type: 'tradeDurationPerformance', size: 'small-long', x: 4, y: 22, w: 4, h: 4 },
  { i: 'session-analysis', type: 'sessionAnalysis', size: 'medium', x: 8, y: 22, w: 4, h: 4 },
  { i: 'calendar-advanced', type: 'calendarAdvanced', size: 'extra-large', x: 0, y: 26, w: 12, h: 8 },
]

export async function POST(request: Request) {
  // Simple auth check — use env secret or admin header
  const authHeader = request.headers.get('Authorization')
  const adminSecret = process.env.ADMIN_SECRET || 'reset-layouts-secret'

  if (authHeader !== `Bearer ${adminSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Update all default templates to the new layout
    const result = await prisma.dashboardTemplate.updateMany({
      where: { isDefault: true },
      data: {
        layout: UPDATED_DEFAULT_LAYOUT as any,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      updatedCount: result.count,
      message: `Reset ${result.count} default template(s) to updated layout`,
    })
  } catch (error) {
    console.error('Failed to reset layouts:', error)
    return NextResponse.json({ error: 'Failed to reset layouts' }, { status: 500 })
  }
}
