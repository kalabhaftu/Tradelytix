/**
 * Server-Filtered Trades API (v1)
 * 
 * GET /api/v1/trades
 * 
 * Replaces client-side `formattedTrades` useMemo in DataProvider.
 * All 7 filters (account, date, instrument, PnL, time, weekday, hour)
 * are applied server-side via Prisma WHERE clauses.
 * 
 * Returns: { trades, total, statistics, calendarData }
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserId } from '@/server/auth'
import { convertDecimal } from '@/lib/utils/decimal'
import { calculateStatistics, formatCalendarData, groupTradesByExecution } from '@/lib/utils'
import {
  calculateDayOfWeekPerformance,
  calculateOutcomeDistribution,
  calculateEquityCurve,
  calculateNetDailyPnl,
  calculateDailyCumulativePnl,
  calculateAccountBalanceChart,
  calculatePnlByStrategy,
  calculatePnlByInstrument,
  calculateWinRateByStrategy,
  calculateTradeDurationPerformance,
  calculateWeekdayPnl,
  calculatePerformanceScoreResult,
  calculateTradingOverviewKpis,
  calculateCalendarData,
  calculateSessionAnalysis,
} from '@/lib/dashboard-math'
import { calculateBalanceInfo } from '@/lib/utils/balance-calculator'
import { CacheHeaders } from '@/lib/api-cache-headers'
import { applyRateLimit, apiLimiter } from '@/lib/rate-limiter'
import { logger } from '@/lib/logger'

// PERF: Only select fields the dashboard actually uses (~40% smaller payload)
const TRADE_SELECT = {
  id: true,
  entryDate: true,
  closeDate: true,
  pnl: true,
  commission: true,
  instrument: true,
  side: true,
  accountNumber: true,
  timeInPosition: true,
  quantity: true,
  entryId: true,
  groupId: true,
  phaseAccountId: true,
  entryPrice: true,
  closePrice: true,
  stopLoss: true,
  takeProfit: true,
  comment: true,
  tags: true,
  userId: true,
  entryTime: true,
  exitTime: true,
  symbol: true,
  TradingModel: { select: { id: true, name: true } },
} as const

export async function GET(request: NextRequest) {
  const rateLimitRes = await applyRateLimit(request, apiLimiter)
  if (rateLimitRes) return rateLimitRes

  const start = Date.now()
  try {
    const authUserId = await getUserId()
    
    // Map auth user ID to internal user ID
    const userLookup = await prisma.user.findUnique({
      where: { auth_user_id: authUserId },
      select: { id: true }
    })
    
    if (!userLookup) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    const internalUserId = userLookup.id
    const params = request.nextUrl.searchParams
    
    // Parse filter params
    const accountNumbers = params.get('accounts')?.split(',').filter(Boolean) || []
    const dateFrom = params.get('dateFrom')
    const dateTo = params.get('dateTo')
    const instruments = params.get('instruments')?.split(',').filter(Boolean) || []
    const pnlMin = params.get('pnlMin') ? parseFloat(params.get('pnlMin')!) : undefined
    const pnlMax = params.get('pnlMax') ? parseFloat(params.get('pnlMax')!) : undefined
    const timeRange = params.get('timeRange') || null
    const weekday = params.get('weekday') ? parseInt(params.get('weekday')!) : null
    const hour = params.get('hour') ? parseInt(params.get('hour')!) : null
    const limit = parseInt(params.get('limit') || '5000')
    const pageLimit = params.get('pageLimit') ? parseInt(params.get('pageLimit')!) : null
    const pageOffset = params.get('pageOffset') ? parseInt(params.get('pageOffset')!) : 0
    const includeStats = params.get('includeStats') !== 'false'
    const includeCalendar = params.get('includeCalendar') !== 'false'
    const timezone = params.get('timezone') || 'UTC'
    const search = params.get('search') || ''
    const side = params.get('side') || ''
    const tagIds = params.get('tags') ? params.get('tags')!.split(',').filter(Boolean) : []
    
    // Build Prisma where clause — ALL filtering server-side
    const whereClause: any = { userId: internalUserId }
    
    if (accountNumbers.length > 0) {
      whereClause.OR = [
        { accountNumber: { in: accountNumbers } },
        { phaseAccountId: { in: accountNumbers } }
      ]
    }
    
    if (dateFrom || dateTo) {
      whereClause.entryDate = {}
      if (dateFrom) {
        whereClause.entryDate.gte = dateFrom.includes('T') ? dateFrom : `${dateFrom}T00:00:00.000Z`
      }
      if (dateTo) {
        whereClause.entryDate.lte = dateTo.includes('T') ? dateTo : `${dateTo}T23:59:59.999Z`
      }
    }
    
    if (instruments.length > 0) {
      whereClause.instrument = { in: instruments }
    }
    
    if (pnlMin !== undefined || pnlMax !== undefined) {
      whereClause.pnl = {}
      if (pnlMin !== undefined) whereClause.pnl.gte = pnlMin
      if (pnlMax !== undefined) whereClause.pnl.lte = pnlMax
    }
    
    if (timeRange) {
      const timeRanges: Record<string, [number, number]> = {
        'under1min': [0, 60],
        '1to5min': [60, 300],
        '5to10min': [300, 600],
        '10to15min': [600, 900],
        '15to30min': [900, 1800],
        '30to60min': [1800, 3600],
        '1to2hours': [3600, 7200],
        '2to5hours': [7200, 18000],
        'over5hours': [18000, 999999999],
      }
      const range = timeRanges[timeRange]
      if (range) {
        whereClause.timeInPosition = { gte: range[0], lt: range[1] }
      }
    }
    
    if (tagIds.length > 0) {
      if (!whereClause.AND) whereClause.AND = []
      whereClause.AND.push({ tags: { hasSome: tagIds } })
    }

    if (side) {
      if (!whereClause.AND) whereClause.AND = []
      whereClause.AND.push({ side: { equals: side, mode: 'insensitive' } })
    }

    if (search) {
      if (!whereClause.AND) whereClause.AND = []
      whereClause.AND.push({
        OR: [
          { instrument: { contains: search, mode: 'insensitive' } },
          { symbol: { contains: search, mode: 'insensitive' } },
          { comment: { contains: search, mode: 'insensitive' } },
        ]
      })
    }
    
    // PERF: Fetch trades (slim select) + accounts in parallel
    const [rawTrades, accounts] = await Promise.all([
      prisma.trade.findMany({
        where: whereClause,
        orderBy: { entryDate: 'desc' },
        take: limit,
        select: TRADE_SELECT,
      }),
      includeStats ? prisma.account.findMany({
        where: { userId: internalUserId },
        include: { _count: { select: { Trade: true } } }
      }) : Promise.resolve([])
    ])
    
    // Convert decimals
    let trades = rawTrades.map((trade: any) => ({
      ...trade,
      entryPrice: convertDecimal(trade.entryPrice),
      closePrice: convertDecimal(trade.closePrice),
      stopLoss: convertDecimal(trade.stopLoss),
      takeProfit: convertDecimal(trade.takeProfit),
      tradingModel: trade.TradingModel?.name || null,
    }))
    
    // Post-query filters (can't be done in Prisma WHERE)
    if (weekday !== null) {
      trades = trades.filter((trade: any) => {
        if (!trade.entryDate) return false
        return new Date(trade.entryDate).getDay() === weekday
      })
    }
    if (hour !== null) {
      trades = trades.filter((trade: any) => {
        if (!trade.entryDate) return false
        return new Date(trade.entryDate).getHours() === hour
      })
    }
    
    // PERF: Group trades ONCE, pass to both stats and calendar
    const grouped = (includeStats || includeCalendar) ? groupTradesByExecution(trades) : undefined
    const statistics = includeStats ? calculateStatistics(trades, accounts, grouped) : null
    const calendarData = includeCalendar ? formatCalendarData(trades, accounts, timezone, grouped) : null

    // Filter accounts to match selected account numbers (for balance calculation)
    const filteredAccounts = accountNumbers.length > 0
      ? accounts.filter((acc: any) => accountNumbers.includes(acc.number) || accountNumbers.includes(acc.id))
      : accounts

    // PERF: Compute all widget chart data server-side (trades already in memory)
    // This eliminates 6 separate /api/v1/dashboard/widgets calls
    const includeWidgets = params.get('includeWidgets') !== 'false'
    const widgets = includeWidgets ? {
      equityCurve: calculateEquityCurve(trades),
      netDailyPnl: calculateNetDailyPnl(trades),
      dailyCumulativePnl: calculateDailyCumulativePnl(trades),
      outcomeDistribution: calculateOutcomeDistribution(trades),
      dayOfWeekPerformance: calculateDayOfWeekPerformance(trades),
      accountBalanceChart: calculateAccountBalanceChart(trades, filteredAccounts),
      pnlByStrategy: calculatePnlByStrategy(trades),
      pnlByInstrument: calculatePnlByInstrument(trades),
      winRateByStrategy: calculateWinRateByStrategy(trades),
      tradeDurationPerformance: calculateTradeDurationPerformance(trades),
      weekdayPnl: calculateWeekdayPnl(trades),
      performanceScore: calculatePerformanceScoreResult(trades),
      tradingOverview: calculateTradingOverviewKpis(trades),
      sessionAnalysis: calculateSessionAnalysis(trades),
      calendarData: calculateCalendarData(trades),
      accountBalancePnl: calculateBalanceInfo(filteredAccounts, trades),
    } : null

    const total = trades.length
    const pagedTrades = pageLimit !== null && pageLimit > 0
      ? trades.slice(Math.max(0, pageOffset), Math.max(0, pageOffset) + pageLimit)
      : trades
    
    const response = NextResponse.json({
      trades: pagedTrades,
      total,
      page: pageLimit !== null ? { limit: pageLimit, offset: Math.max(0, pageOffset) } : null,
      statistics,
      calendarData,
      widgets,
    })
    Object.entries(CacheHeaders.privateShort).forEach(([k, v]) => response.headers.set(k, v))

    logger.info('GET /api/v1/trades', { latencyMs: Date.now() - start, total: trades.length }, 'api')
    return response

  } catch (error: any) {
    logger.error('GET /api/v1/trades failed', { error: error?.message, latencyMs: Date.now() - start }, 'api')
    if (error.message?.includes('not authenticated') || error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
