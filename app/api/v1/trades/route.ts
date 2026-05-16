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
import { getResolvedUserIdentity } from '@/server/user-identity'
import { convertDecimal } from '@/lib/utils/decimal'
import { format as formatDate } from 'date-fns'
import { calculateStatistics, classifyTrade, formatCalendarData, groupTradesByExecution } from '@/lib/utils'
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
  calculateSessionAnalysis,
  calculateAccountProgression,
  calculateTagPerformance,
  calculateTimeOfDayPerformance,
  calculateDisciplineAnalytics,
} from '@/lib/dashboard-math'
import { calculateBalanceInfo } from '@/lib/utils/balance-calculator'
import { CacheHeaders } from '@/lib/api-cache-headers'
import { applyRateLimit, apiLimiter } from '@/lib/rate-limiter'
import { logger } from '@/lib/logger'
import { getBreakEvenThreshold } from '@/lib/metrics/outcome'
import { getTradeNetPnl, normalizePnlDisplayMode } from '@/lib/metrics/pnl'

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
  entryPriceValue: true,
  closePrice: true,
  closePriceValue: true,
  stopLoss: true,
  stopLossValue: true,
  takeProfit: true,
  takeProfitValue: true,
  closeReason: true,
  comment: true,
  cardPreviewImage: true,
  cardPreviewTransform: true,
  imageOne: true,
  imageTwo: true,
  imageThree: true,
  imageFour: true,
  imageFive: true,
  imageSix: true,
  tags: true,
  marketBias: true,
  modelId: true,
  selectedRules: true,
  outcome: true,
  ruleBroken: true,
  newsDay: true,
  selectedNews: true,
  newsTraded: true,
  biasTimeframe: true,
  narrativeTimeframe: true,
  entryTimeframe: true,
  structureTimeframe: true,
  orderType: true,
  chartLinks: true,
  chartLinksList: true,
  tradeIdentityKey: true,
  userId: true,
  mae: true,
  mfe: true,
  setup: true,
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
    const { internalUserId } = await getResolvedUserIdentity()
    const params = request.nextUrl.searchParams
    
    // Parse filter params
    const accountNumbers = params.get('accounts')?.split(',').filter(Boolean) || []
    const dateFrom = params.get('dateFrom')
    const dateTo = params.get('dateTo')
    const tradeDate = params.get('tradeDate')
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
    const groupByExecution = params.get('groupByExecution') === 'true'
    const timezone = params.get('timezone') || 'UTC'
    const search = params.get('search') || ''
    const side = params.get('side') || ''
    const outcome = params.get('outcome') || ''
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
    
    // PERF: Fetch trades (slim select) + accounts (both regular and prop firm) in parallel
    const [rawTrades, regularAccounts, propFirmAccounts, userSettings] = await Promise.all([
      prisma.trade.findMany({
        where: whereClause,
        orderBy: { entryDate: 'desc' },
        take: limit,
        select: TRADE_SELECT,
      }),
      includeStats ? prisma.account.findMany({
        where: { userId: internalUserId },
        select: { id: true, number: true, startingBalance: true }
      }) : Promise.resolve([]),
      includeStats ? prisma.masterAccount.findMany({
        where: { userId: internalUserId },
        include: {
          PhaseAccount: {
            select: { id: true, phaseId: true, phaseNumber: true, status: true }
          }
        }
      }) : Promise.resolve([]),
      prisma.userSettings.findUnique({
        where: { userId: internalUserId },
        select: {
          breakEvenThreshold: true,
          pnlDisplayMode: true,
        }
      })
    ])

    const breakEvenThreshold = getBreakEvenThreshold(userSettings?.breakEvenThreshold)
    const pnlDisplayMode = normalizePnlDisplayMode(userSettings?.pnlDisplayMode)
    
    // Combine regular accounts + transform prop firm phases to unified format with startingBalance
    const accounts = [
      ...regularAccounts,
      ...propFirmAccounts.flatMap((master: any) => 
        (master.PhaseAccount || []).map((phase: any) => ({
          id: phase.id,
          number: phase.phaseId,
          startingBalance: master.accountSize, // Use master account size
          accountType: 'prop-firm' as const,
          status: phase.status,
          currentPhaseDetails: {
            phaseNumber: phase.phaseNumber,
            status: phase.status,
            masterAccountId: master.id,
            masterAccountName: master.accountName,
          }
        }))
      )
    ]
    
    // Convert decimals
    let trades = rawTrades.map((trade: any) => ({
      ...trade,
      entryPrice: convertDecimal(trade.entryPrice),
      closePrice: convertDecimal(trade.closePrice),
      stopLoss: convertDecimal(trade.stopLoss),
      takeProfit: convertDecimal(trade.takeProfit),
      tradingModel: trade.TradingModel?.name || null,
    }))

    if (tradeDate) {
      trades = trades.filter((trade: any) => {
        const rawTradeDate = trade.closeDate || trade.entryDate
        if (!rawTradeDate) return false
        return formatDate(new Date(rawTradeDate), 'yyyy-MM-dd') === tradeDate
      })
    }
    
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
    if (outcome === 'win' || outcome === 'loss' || outcome === 'breakeven') {
      trades = trades.filter((trade: any) => {
        const pnl = getTradeNetPnl(trade)
        return classifyTrade(pnl, breakEvenThreshold) === outcome
      })
    }
    
    // PERF: Group trades ONCE, pass to all grouped consumers
    const grouped = (includeStats || includeCalendar || groupByExecution)
      ? groupTradesByExecution(trades)
      : undefined
    const statistics = includeStats ? calculateStatistics(trades, accounts, grouped, breakEvenThreshold) : null
    const calendarData = includeCalendar ? formatCalendarData(trades, accounts, timezone, grouped) : null

    const responseTrades = groupByExecution ? (grouped ?? groupTradesByExecution(trades)) : trades

    // Filter accounts to match selected account numbers (for balance calculation)
    const filteredAccounts = accountNumbers.length > 0
      ? accounts.filter((acc: any) => accountNumbers.includes(acc.number) || accountNumbers.includes(acc.id))
      : accounts
    
    // PERF: Compute all widget chart data server-side (trades already in memory)
    // This eliminates 6 separate /api/v1/dashboard/widgets calls
    const includeWidgets = params.get('includeWidgets') !== 'false'
    const widgetCalendarData = includeWidgets
      ? (calendarData || formatCalendarData(trades as any, accounts as any, timezone, grouped as any))
      : null

    let relevantTransactions: any[] = []
    try {
      if ('transaction' in prisma) {
        const liveAccountIds = filteredAccounts
          .filter((account: any) => account.accountType === 'live')
          .map((account: any) => account.id)
          .filter(Boolean)
        if (liveAccountIds.length > 0) {
          relevantTransactions = await (prisma as any).transaction.findMany({
            where: {
              userId: internalUserId,
              accountId: { in: liveAccountIds },
            },
            select: { accountId: true, amount: true },
          })
        }
      }
    } catch {
      relevantTransactions = []
    }

    const widgets = includeWidgets ? {
      equityCurve: calculateEquityCurve(trades),
      netDailyPnl: calculateNetDailyPnl(trades, breakEvenThreshold),
      dailyCumulativePnl: calculateDailyCumulativePnl(trades, breakEvenThreshold),
      outcomeDistribution: calculateOutcomeDistribution(trades, breakEvenThreshold),
      dayOfWeekPerformance: calculateDayOfWeekPerformance(trades, breakEvenThreshold),
      accountBalanceChart: calculateAccountBalanceChart(trades, filteredAccounts, breakEvenThreshold),
      pnlByStrategy: calculatePnlByStrategy(trades, breakEvenThreshold),
      pnlByInstrument: calculatePnlByInstrument(trades, breakEvenThreshold),
      winRateByStrategy: calculateWinRateByStrategy(trades, breakEvenThreshold),
      tradeDurationPerformance: calculateTradeDurationPerformance(trades, breakEvenThreshold),
      weekdayPnl: calculateWeekdayPnl(trades, breakEvenThreshold),
      performanceScore: calculatePerformanceScoreResult(trades, breakEvenThreshold),
      sessionAnalysis: calculateSessionAnalysis(trades, breakEvenThreshold),
      accountProgression: calculateAccountProgression(trades, filteredAccounts, breakEvenThreshold),
      tagPerformance: calculateTagPerformance(trades, breakEvenThreshold),
      timeOfDayPerformance: calculateTimeOfDayPerformance(trades, breakEvenThreshold),
      disciplineAnalytics: calculateDisciplineAnalytics(trades, breakEvenThreshold),
      calendarData: widgetCalendarData,
      accountBalancePnl: calculateBalanceInfo(filteredAccounts, trades, relevantTransactions, { pnlDisplayMode }),
    } : null

    const total = responseTrades.length
    const pagedTrades = pageLimit !== null && pageLimit > 0
      ? responseTrades.slice(Math.max(0, pageOffset), Math.max(0, pageOffset) + pageLimit)
      : responseTrades
    
    const response = NextResponse.json({
      trades: pagedTrades,
      total,
      page: pageLimit !== null ? { limit: pageLimit, offset: Math.max(0, pageOffset) } : null,
      breakEvenThreshold,
      pnlDisplayMode,
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
    if (error.message?.includes('User not found')) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
