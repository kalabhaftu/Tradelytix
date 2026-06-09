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

const MAX_ANALYTICS_TRADE_LIMIT = 5000
const MAX_TABLE_PAGE_LIMIT = 500
const MAX_FILTER_VALUES = 100

function boundedInt(value: string | null, fallback: number, min: number, max: number) {
  const parsed = Number.parseInt(value || '', 10)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(max, Math.max(min, parsed))
}

function boundedFloat(value: string | null) {
  if (value === null || value.trim() === '') return undefined
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function boundedList(value: string | null, max = MAX_FILTER_VALUES) {
  return (value?.split(',') || [])
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, max)
}

function isDateOnly(value: string | null) {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value))
}

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
    const accountNumbers = boundedList(params.get('accounts'))
    const dateFrom = params.get('dateFrom')
    const dateTo = params.get('dateTo')
    const tradeDate = isDateOnly(params.get('tradeDate')) ? params.get('tradeDate') : null
    const instruments = boundedList(params.get('instruments'))
    const pnlMin = boundedFloat(params.get('pnlMin'))
    const pnlMax = boundedFloat(params.get('pnlMax'))
    const timeRange = params.get('timeRange') || null
    const weekday = params.get('weekday') ? boundedInt(params.get('weekday'), -1, 0, 6) : null
    const hour = params.get('hour') ? boundedInt(params.get('hour'), -1, 0, 23) : null
    const includeStats = params.get('includeStats') !== 'false'
    const includeCalendar = params.get('includeCalendar') !== 'false'
    const groupByExecution = params.get('groupByExecution') === 'true'
    const includeWidgets = params.get('includeWidgets') !== 'false'
    const needsAnalytics = includeStats || includeCalendar || includeWidgets || groupByExecution
    const pageLimit = params.get('pageLimit') ? boundedInt(params.get('pageLimit'), 50, 1, MAX_TABLE_PAGE_LIMIT) : null
    const pageOffset = boundedInt(params.get('pageOffset'), 0, 0, 1_000_000)
    const limit = boundedInt(params.get('limit'), needsAnalytics ? MAX_ANALYTICS_TRADE_LIMIT : (pageLimit || MAX_TABLE_PAGE_LIMIT), 1, needsAnalytics ? MAX_ANALYTICS_TRADE_LIMIT : MAX_TABLE_PAGE_LIMIT)
    const timezone = params.get('timezone')?.slice(0, 64) || 'UTC'
    const search = (params.get('search') || '').trim().slice(0, 120)
    const side = (params.get('side') || '').trim().slice(0, 16)
    const outcome = (params.get('outcome') || '').trim()
    const tagIds = boundedList(params.get('tags'))
    
    // Build Prisma where clause — ALL filtering server-side
    const whereClause: any = { userId: internalUserId }
    
    if (accountNumbers.length > 0) {
      // Find the user's regular accounts matching these accountNumbers (either by ID or number)
      const userAccounts = await prisma.account.findMany({
        where: {
          userId: internalUserId,
          OR: [
            { id: { in: accountNumbers } },
            { number: { in: accountNumbers } }
          ]
        },
        select: { id: true, number: true }
      })

      // Find the user's phase accounts matching these accountNumbers (either by ID or phaseId)
      const userPhaseAccounts = await prisma.phaseAccount.findMany({
        where: {
          MasterAccount: { userId: internalUserId },
          OR: [
            { id: { in: accountNumbers } },
            { phaseId: { in: accountNumbers } }
          ]
        },
        select: { id: true, phaseId: true }
      })

      const resolvedAccountIds = userAccounts.map(a => a.id)
      const resolvedAccountNumbers = userAccounts.map(a => a.number)
      
      const resolvedPhaseAccountIds = userPhaseAccounts.map(pa => pa.id)
      const resolvedPhaseIds = userPhaseAccounts.map(pa => pa.phaseId).filter(Boolean) as string[]

      // For any value in accountNumbers that was NOT a UUID (i.e. did not match any ID),
      // we treat it as a raw number/phaseId directly (for backward compatibility).
      const rawNumbers = accountNumbers.filter(
        num => !resolvedAccountIds.includes(num) && !resolvedPhaseAccountIds.includes(num)
      )

      whereClause.OR = [
        { accountId: { in: resolvedAccountIds } },
        { phaseAccountId: { in: resolvedPhaseAccountIds } },
        {
          AND: [
            { accountId: null },
            { phaseAccountId: null },
            { accountNumber: { in: [...resolvedAccountNumbers, ...resolvedPhaseIds, ...rawNumbers] } }
          ]
        }
      ]
    }
    
    if (tradeDate) {
      if (!whereClause.AND) whereClause.AND = []
      whereClause.AND.push({
        OR: [
          {
            closeDate: {
              gte: `${tradeDate}T00:00:00.000Z`,
              lte: `${tradeDate}T23:59:59.999Z`,
            }
          },
          {
            closeDate: '',
            entryDate: {
              gte: `${tradeDate}T00:00:00.000Z`,
              lte: `${tradeDate}T23:59:59.999Z`,
            }
          }
        ]
      })
    } else if (dateFrom || dateTo) {
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
    const useDirectPagination = !needsAnalytics && pageLimit !== null && weekday === null && hour === null && !outcome
    const tradeQuery = {
      where: whereClause,
      orderBy: { entryDate: 'desc' as const },
      take: useDirectPagination ? pageLimit : limit,
      ...(useDirectPagination ? { skip: pageOffset } : {}),
      select: TRADE_SELECT,
    }

    const rawTrades = await prisma.trade.findMany(tradeQuery)
    const totalForDirectPagination = useDirectPagination
      ? await prisma.trade.count({ where: whereClause })
      : null
    const userSettings = await prisma.userSettings.findUnique({
      where: { userId: internalUserId },
      select: {
        breakEvenThreshold: true,
        pnlDisplayMode: true,
      }
    })
    const regularAccounts = includeStats ? await prisma.account.findMany({
      where: { userId: internalUserId },
      select: { id: true, number: true, startingBalance: true }
    }) : []
    const propFirmAccounts = includeStats ? await prisma.masterAccount.findMany({
      where: { userId: internalUserId },
      include: {
        PhaseAccount: {
          select: { id: true, phaseId: true, phaseNumber: true, status: true }
        }
      }
    }) : []

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

    const safeWidget = <T>(fn: () => T, fallback: T): T => {
      try { return fn() } catch { return fallback }
    }
    const zeroBalanceResult = {
      startingBalance: 0, currentBalance: 0, currentGrossBalance: 0,
      totalPnL: 0, grossPnL: 0, totalFees: 0, totalCommissions: 0,
      netPnL: 0, displayPnL: 0, displayBalance: 0, pnlDisplayMode: 'net' as const,
      changeAmount: 0, changePercent: 0,
    }
    const widgets = includeWidgets ? {
      equityCurve: safeWidget(() => calculateEquityCurve(trades), []),
      netDailyPnl: safeWidget(() => calculateNetDailyPnl(trades, breakEvenThreshold), []),
      dailyCumulativePnl: safeWidget(() => calculateDailyCumulativePnl(trades, breakEvenThreshold), []),
      outcomeDistribution: safeWidget(() => calculateOutcomeDistribution(trades, breakEvenThreshold), { data: [], totalTrades: 0 } as any),
      dayOfWeekPerformance: safeWidget(() => calculateDayOfWeekPerformance(trades, breakEvenThreshold), []),
      accountBalanceChart: safeWidget(() => calculateAccountBalanceChart(trades, filteredAccounts, breakEvenThreshold), []),
      pnlByStrategy: safeWidget(() => calculatePnlByStrategy(trades, breakEvenThreshold), []),
      pnlByInstrument: safeWidget(() => calculatePnlByInstrument(trades, breakEvenThreshold), []),
      winRateByStrategy: safeWidget(() => calculateWinRateByStrategy(trades, breakEvenThreshold), []),
      tradeDurationPerformance: safeWidget(() => calculateTradeDurationPerformance(trades, breakEvenThreshold), []),
      weekdayPnl: safeWidget(() => calculateWeekdayPnl(trades, breakEvenThreshold), []),
      performanceScore: safeWidget(() => calculatePerformanceScoreResult(trades, breakEvenThreshold), { hasData: false } as any),
      sessionAnalysis: safeWidget(() => calculateSessionAnalysis(trades, breakEvenThreshold), {} as any),
      accountProgression: safeWidget(() => calculateAccountProgression(trades, filteredAccounts, breakEvenThreshold), { cumulative: [], balance: [], summary: {} } as any),
      tagPerformance: safeWidget(() => calculateTagPerformance(trades, breakEvenThreshold), {} as any),
      timeOfDayPerformance: safeWidget(() => calculateTimeOfDayPerformance(trades, breakEvenThreshold), []),
      disciplineAnalytics: safeWidget(() => calculateDisciplineAnalytics(trades, breakEvenThreshold), { totalTrades: 0, brokenRules: 0, ruleBrokenRate: 0, ruleCoverage: 0, avgRulesPerTaggedTrade: 0, playbooks: [] } as any),
      calendarData: widgetCalendarData,
      accountBalancePnl: safeWidget(() => calculateBalanceInfo(filteredAccounts, trades, relevantTransactions, { pnlDisplayMode }), zeroBalanceResult),
    } : null

    const total = useDirectPagination ? (totalForDirectPagination ?? rawTrades.length) : responseTrades.length
    const pagedTrades = useDirectPagination
      ? responseTrades
      : pageLimit !== null && pageLimit > 0
        ? responseTrades.slice(pageOffset, pageOffset + pageLimit)
        : responseTrades
    const truncated = needsAnalytics && rawTrades.length >= MAX_ANALYTICS_TRADE_LIMIT

    const response = NextResponse.json({
      trades: pagedTrades,
      total,
      page: pageLimit !== null ? { limit: pageLimit, offset: pageOffset } : null,
      meta: { directPagination: useDirectPagination, truncated },
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
