/**
 * Server-Side Report Statistics Calculator
 * 
 * Absorbs ALL client-side useMemo calculations from reports/page.tsx:
 * - tradingActivity (win rate, avg trades/month, trading days)
 * - psychMetrics (drawdown, expectancy, streaks, avg holding time, profit factor)
 * - sessionPerformance (per-session stats for NY/London/Asia/Outside)
 * - rMultipleDistribution (R-multiple buckets)
 * 
 * These were previously computed client-side on 50,000+ trade arrays.
 * Now they run server-side in a single pass and return pre-computed DTOs.
 */

import { prisma } from '@/lib/prisma'
import { classifyTrade } from '@/lib/utils'
import { getTradingSession } from '@/lib/time-utils'
import { groupTradesByExecution } from '@/lib/utils'
import { 
  calculateRMultiple, 
  calculateRSquared, 
  calculatePeakToTroughDrawdown,
  calculateExpectancy,
  calculateProfitFactor,
  calculateRecoveryFactor
} from '@/lib/math/performance-metrics'

export { calculateRMultiple }

// Moved to @/lib/math/performance-metrics.ts

// ===========================================
// TYPES (Report-specific DTOs)
// ===========================================

export interface TradingActivityDTO {
  totalTrades: number
  winRate: string
  avgTradesPerMonth: number
  tradingDaysActive: number
  mostTradedDay: string | null
  mostProfitableDay: string | null
  mostProfitablePair: string | null
  mostLosingDay: string | null
  mostLosingPair: string | null
}

export interface PsychMetricsDTO {
  longestWinStreak: number
  longestLoseStreak: number
  avgWin: string
  avgLoss: string
  totalNetPnL: number
  expectancy: string
  profitFactor: string
  avgHoldingTime: string
  maxDrawdown: string
  peakEquity: string
  rrEfficiency: string
  consistencyScore: string
  recoveryFactor: string
  totalRMultiple: string
}

export interface SessionPerformanceDTO {
  [sessionName: string]: {
    name: string
    range: string
    trades: number
    wins: number
    pnl: number
    totalHoldMs: number
    peak: number
    maxDD: number
  }
}

export interface RMultipleDistributionDTO {
  '<-1R': number
  '-1R to 0R': number
  '0R to 1R': number
  '1R to 2R': number
  '2R to 3R': number
  '>3R': number
}

export interface ReportStatsResponse {
  tradingActivity: TradingActivityDTO | null
  psychMetrics: PsychMetricsDTO | null
  sessionPerformance: SessionPerformanceDTO | null
  rMultipleDistribution: RMultipleDistributionDTO | null
  rMultipleDataQuality: {
    totalTrades: number
    tradesWithStopLoss: number
    percentageComplete: number
  } | null
  chartData: {
    equityCurve: any[]
    outcomeDistribution: any[]
    dayOfWeekPerformance: any[]
  } | null
  filteredTrades: any[]
  filterOptions: {
    symbols: string[]
    sessions: string[]
    outcomes: Array<{ value: string; label: string }>
    strategies: Array<{ id: string; name: string }>
  }
}

export interface ReportStatsFilters {
  userId: string
  accountId?: string
  accountNumbers?: string[]
  dateFrom?: string
  dateTo?: string
  symbol?: string
  session?: string
  outcome?: string
  strategy?: string
  ruleBroken?: string
}

// ===========================================
// CORE COMPUTATION
// ===========================================

export async function calculateReportStatistics(
  filters: ReportStatsFilters
): Promise<ReportStatsResponse> {
  const { userId, accountNumbers, dateFrom, dateTo, accountId } = filters

  // Build Prisma where clause — all filtering done server-side
  const whereClause: any = { userId }

  if (accountId) {
    whereClause.accountId = accountId
  }

  if (accountNumbers && accountNumbers.length > 0) {
    whereClause.accountNumber = { in: accountNumbers }
  }

  // entryDate is String in schema — compare as ISO strings (not Date objects)
  // Reports UI sends ISO via toISOString(). We preserve full timestamps to match stored values.
  if (dateFrom || dateTo) {
    whereClause.entryDate = {}
    if (dateFrom) {
      whereClause.entryDate.gte = dateFrom.includes('T') ? dateFrom : `${dateFrom}T00:00:00.000Z`
    }
    if (dateTo) {
      whereClause.entryDate.lte = dateTo.includes('T') ? dateTo : `${dateTo}T23:59:59.999Z`
    }
  }

  if (filters.symbol && filters.symbol !== 'all') {
    whereClause.OR = [
      { symbol: filters.symbol },
      { instrument: filters.symbol }
    ]
  }

  if (filters.outcome && filters.outcome !== 'all') {
    if (filters.outcome === 'WIN') {
      // PnL-based: positive net PnL
      whereClause.pnl = { gt: 0 }
    } else if (filters.outcome === 'LOSS') {
      // PnL-based: negative net PnL
      whereClause.pnl = { lt: 0 }
    } else {
      whereClause.outcome = filters.outcome
    }
  }

  if (filters.strategy && filters.strategy !== 'all') {
    if (filters.strategy === 'unassigned') {
      whereClause.modelId = null
    } else {
      whereClause.modelId = filters.strategy
    }
  }

  if (filters.ruleBroken && filters.ruleBroken !== 'all') {
    whereClause.ruleBroken = filters.ruleBroken === 'broken'
  }

  // Fetch trades with fields needed for computations + spreadsheet display
  // Fetch filter options separately to ensure they are always populated regardless of current filters
  const [rawTrades, tradingModels, allPossibleSymbols] = await Promise.all([
    prisma.trade.findMany({
      where: whereClause,
      select: {
        id: true,
        entryId: true,
        entryDate: true,
        closeDate: true,
        closePrice: true,
        instrument: true,
        symbol: true,
        side: true,
        pnl: true,
        commission: true,
        quantity: true,
        entryPrice: true,
        stopLoss: true,
        takeProfit: true,
        groupId: true,
        accountNumber: true,
        accountId: true,
        phaseAccountId: true,
        timeInPosition: true,
        outcome: true,
        modelId: true,
        ruleBroken: true,
      },
      orderBy: { entryDate: 'asc' },
    }),
    prisma.tradingModel.findMany({
      where: { userId },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    prisma.trade.findMany({
      where: {
        userId,
        // When fetching options, we only filter by account if one is selected, 
        // ensuring the list adapts to the selected account but not the date range.
        ...(accountId && accountId !== 'all' ? { accountId } : {}),
        ...(accountNumbers && accountNumbers.length > 0 ? { accountNumber: { in: accountNumbers } } : {})
      },
      select: { symbol: true, instrument: true },
    }),
  ])

  // Extract unique symbols from the separate query for filter options
  // Extract unique symbols from the separate query for filter options
  // Use a Case-Insensitive Set to deduplicate instrument vs symbol
  const symbols = [...new Set(
    allPossibleSymbols.map(t => (t.symbol || t.instrument || '').trim())
      .filter(Boolean)
  )].sort() as string[]
  const strategies = tradingModels.map(m => ({ id: m.id, name: m.name }))

  // Group by execution for accurate counting
  const trades = groupTradesByExecution(rawTrades as any[]) as any[]

  // Session filter (needs to be done post-query since it's derived from entryDate)
  const filteredTrades = filters.session && filters.session !== 'all'
    ? trades.filter(trade => {
      if (!trade.entryDate) return false
      const session = getTradingSession(new Date(trade.entryDate))
      return session === filters.session
    })
    : trades

  if (filteredTrades.length === 0) {
    return {
      tradingActivity: null,
      psychMetrics: null,
      sessionPerformance: null,
      rMultipleDistribution: null,
      rMultipleDataQuality: null,
      chartData: null,
      filteredTrades: [],
      filterOptions: buildFilterOptions(symbols, strategies),
    }
  }

  // Single-pass computation for all metrics
  const result = computeAllMetrics(filteredTrades, dateFrom, dateTo)

  return {
    ...result,
    filteredTrades: filteredTrades.slice(0, 100),
    filterOptions: buildFilterOptions(symbols, strategies),
  }
}

function buildFilterOptions(symbols: string[], strategies: Array<{ id: string; name: string }>) {
  return {
    symbols,
    sessions: [
      'New York',
      'London',
      'Asia',
      'Outside Session',
    ],
    outcomes: [
      { value: 'WIN', label: 'Win' },
      { value: 'LOSS', label: 'Loss' },
      { value: 'GOOD_WIN', label: 'Good Win' },
      { value: 'BAD_WIN', label: 'Bad Win' },
      { value: 'GOOD_LOSS', label: 'Good Loss' },
      { value: 'BAD_LOSS', label: 'Bad Loss' },
      { value: 'BREAKEVEN', label: 'Breakeven' },
    ],
    strategies: [
      { id: 'unassigned', name: 'No Strategy' },
      ...strategies,
    ],
  }
}


// ===========================================
// ALL METRICS IN OPTIMIZED PASSES
// ===========================================

function computeAllMetrics(
  trades: any[],
  dateFrom?: string,
  dateTo?: string
): Omit<ReportStatsResponse, 'filterOptions' | 'filteredTrades'> {
  const sorted = [...trades].sort((a, b) => {
    const dateA = a.entryDate ? new Date(a.entryDate).getTime() : 0
    const dateB = b.entryDate ? new Date(b.entryDate).getTime() : 0
    return dateA - dateB
  })

  // --- Pass 1: Core metrics (drawdown, PnL, wins/losses, holding time, sessions, R-multiples) ---
  let cumulativePnL = 0
  let maxDD = 0
  let peakEquity = 0
  let totalGrossProfit = 0
  let totalGrossLoss = 0
  let totalHoldingTimeMs = 0
  let tradesWithDuration = 0

  // Win/loss tracking
  const wins: any[] = []
  const losses: any[] = []

  // Streak tracking
  let maxWinStreak = 0
  let maxLoseStreak = 0
  let tempStreak = 0
  let lastWasWin: boolean | null = null

  // Unique trading days
  const tradeDates = new Set<string>()

  // Session performance
  const sessions: SessionPerformanceDTO = {
    'New York': { name: 'New York Session', range: '08:00 - 17:00', trades: 0, wins: 0, pnl: 0, totalHoldMs: 0, peak: 0, maxDD: 0 },
    'London': { name: 'London Session', range: '03:00 - 12:00', trades: 0, wins: 0, pnl: 0, totalHoldMs: 0, peak: 0, maxDD: 0 },
    'Asia': { name: 'Asia Session', range: '19:00 - 04:00', trades: 0, wins: 0, pnl: 0, totalHoldMs: 0, peak: 0, maxDD: 0 },
    'Outside Session': { name: 'Outside Session', range: 'N/A', trades: 0, wins: 0, pnl: 0, totalHoldMs: 0, peak: 0, maxDD: 0 },
  }

  // R-multiple distribution
  const rDistribution: RMultipleDistributionDTO = {
    '<-1R': 0,
    '-1R to 0R': 0,
    '0R to 1R': 0,
    '1R to 2R': 0,
    '2R to 3R': 0,
    '>3R': 0,
  }

  // Track R-multiple data quality (trades with valid stop loss)
  let tradesWithStopLoss = 0

  let totalRMultipleDelta = 0

  // Chart data
  const equityCurve: any[] = []
  const outcomeDistribution: any[] = [
    { name: 'Wins', value: 0, color: 'hsl(var(--chart-bullish))' },
    { name: 'Losses', value: 0, color: 'hsl(var(--chart-bearish))' },
    { name: 'Breakeven', value: 0, color: 'hsl(220, 15%, 55%)' }
  ]

  // New metrics: day-of-week and pair aggregation
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const dayTradeCount: Record<string, number> = {}
  const dayPnL: Record<string, number> = {}
  const pairPnL: Record<string, number> = {}

  // Single pass through all trades
  for (const trade of sorted) {
    const netPnL = (trade.pnl || 0) + (trade.commission || 0)
    const outcome = classifyTrade(netPnL)

    // Cumulative PnL + Drawdown
    cumulativePnL += netPnL
    if (cumulativePnL > peakEquity) peakEquity = cumulativePnL
    const dd = peakEquity - cumulativePnL
    if (dd > maxDD) maxDD = dd

    if (trade.entryDate) {
      equityCurve.push({
        name: new Date(trade.entryDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit' }),
        date: trade.entryDate,
        equity: cumulativePnL,
        netPnL: netPnL
      })
    }

    // Win/Loss classification
    if (outcome === 'win') {
      wins.push(trade)
      totalGrossProfit += netPnL
      outcomeDistribution[0].value++
    } else if (outcome === 'loss') {
      losses.push(trade)
      totalGrossLoss += Math.abs(netPnL)
      outcomeDistribution[1].value++
    } else {
      outcomeDistribution[2].value++
    }

    // Streaks
    if (outcome === 'breakeven') {
      if (lastWasWin !== null) {
        if (lastWasWin) maxWinStreak = Math.max(maxWinStreak, tempStreak)
        else maxLoseStreak = Math.max(maxLoseStreak, tempStreak)
      }
      tempStreak = 0
      lastWasWin = null
    } else {
      const isWin = outcome === 'win'
      if (lastWasWin === null) {
        tempStreak = 1
        lastWasWin = isWin
      } else if (isWin === lastWasWin) {
        tempStreak++
      } else {
        if (lastWasWin) maxWinStreak = Math.max(maxWinStreak, tempStreak)
        else maxLoseStreak = Math.max(maxLoseStreak, tempStreak)
        tempStreak = 1
        lastWasWin = isWin
      }
    }

    // Trading days + day-of-week tracking
    if (trade.entryDate) {
      const d = new Date(trade.entryDate)
      const dateStr = d.toISOString().split('T')[0]
      tradeDates.add(dateStr)

      const dayName = dayNames[d.getDay()]
      dayTradeCount[dayName] = (dayTradeCount[dayName] || 0) + 1
      dayPnL[dayName] = (dayPnL[dayName] || 0) + netPnL
    }

    // Pair P&L tracking
    const pairName = (trade.symbol || trade.instrument || '').trim()
    if (pairName) {
      pairPnL[pairName] = (pairPnL[pairName] || 0) + netPnL
    }

    // Holding time
    if (trade.entryDate && trade.closeDate) {
      const entryTime = new Date(trade.entryDate).getTime()
      const exitTime = new Date(trade.closeDate).getTime()
      if (!isNaN(entryTime) && !isNaN(exitTime) && exitTime > entryTime) {
        totalHoldingTimeMs += (exitTime - entryTime)
        tradesWithDuration++
      }
    }

    // Session performance
    if (trade.entryDate) {
      const entryDateStr = trade.entryDate || ''
      const date = entryDateStr.includes('Z') ? entryDateStr : `${entryDateStr}Z`
      const sessionName = getTradingSession(new Date(date)) || 'Outside Session'

      if (sessions[sessionName]) {
        const s = sessions[sessionName]
        s.trades++
        if (outcome === 'win') s.wins++
        s.pnl += (trade.pnl || 0)

        if (trade.entryDate && trade.closeDate) {
          const entry = new Date(trade.entryDate).getTime()
          const exit = new Date(trade.closeDate).getTime()
          if (!isNaN(entry) && !isNaN(exit) && exit > entry) {
            s.totalHoldMs += (exit - entry)
          }
        }

        const currentPnL = s.pnl
        if (currentPnL > s.peak) s.peak = currentPnL
        const sessionDD = s.peak - currentPnL
        if (sessionDD > s.maxDD) s.maxDD = sessionDD
      }
    }

    // R-multiple distribution (PRICE POINTS - OPTION 1)
    // Track if trade has valid stop loss for data quality indicator
    const hasValidStopLoss = trade.stopLoss && trade.stopLoss !== 0 && trade.stopLoss !== trade.entryPrice
    if (hasValidStopLoss) tradesWithStopLoss++

    const r = calculateRMultiple(trade.side, trade.entryPrice, trade.closePrice, trade.stopLoss)
    totalRMultipleDelta += r

    if (r < -1) rDistribution['<-1R']++
    else if (r < 0) rDistribution['-1R to 0R']++
    else if (r < 1) rDistribution['0R to 1R']++
    else if (r < 2) rDistribution['1R to 2R']++
    else if (r < 3) rDistribution['2R to 3R']++
    else rDistribution['>3R']++
  }

  // Finalize streaks
  if (lastWasWin !== null) {
    if (lastWasWin) maxWinStreak = Math.max(maxWinStreak, tempStreak)
    else maxLoseStreak = Math.max(maxLoseStreak, tempStreak)
  }

  // --- Derived metrics ---
  const tradableCount = wins.length + losses.length
  const winRateNum = tradableCount > 0 ? (wins.length / tradableCount) : 0
  const winRate = (winRateNum * 100).toFixed(1)

  const avgWin = wins.length > 0 ? totalGrossProfit / wins.length : 0
  const avgLoss = losses.length > 0 ? totalGrossLoss / losses.length : 0
  
  // CORRECTED EXPECTANCY: (P_w * AvgWin) - (P_l * Abs(AvgLoss))
  const lossRateNum = tradableCount > 0 ? (losses.length / tradableCount) : 0
  const expectancy = (winRateNum * avgWin) - (lossRateNum * avgLoss)
  
  const profitFactor = totalGrossLoss > 0 ? totalGrossProfit / totalGrossLoss : totalGrossProfit > 0 ? 99 : 0
  const rrEfficiency = avgLoss > 0 ? avgWin / avgLoss : 0
  const recoveryFactor = maxDD > 0 ? cumulativePnL / maxDD : 0
  
  // CONSISTENCY: R-Squared of the equity curve
  const rSquared = calculateRSquared(equityCurve.map(p => p.equity))
  const consistencyScore = (rSquared * 100).toFixed(0)

  const avgHoldingTimeMs = tradesWithDuration > 0 ? totalHoldingTimeMs / tradesWithDuration : 0
  const hours = Math.floor(avgHoldingTimeMs / (1000 * 60 * 60))
  const minutes = Math.floor((avgHoldingTimeMs % (1000 * 60 * 60)) / (1000 * 60))

  // Date range calculation
  const from = dateFrom ? new Date(dateFrom) : null
  const to = dateTo ? new Date(dateTo) : null
  const daysInRange = from && to
    ? Math.max(1, Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)))
    : 30
  const monthsInRange = Math.max(1, Math.ceil(daysInRange / 30))

  // New metrics: most traded day, most profitable/losing day & pair
  let mostTradedDay: string | null = null
  let mostTradedDayCount = 0
  let mostProfitableDay: string | null = null
  let mostProfitableDayPnL = -Infinity
  let mostLosingDay: string | null = null
  let mostLosingDayPnL = Infinity

  for (const [day, count] of Object.entries(dayTradeCount)) {
    if (count > mostTradedDayCount) { mostTradedDayCount = count; mostTradedDay = day }
  }
  for (const [day, pnl] of Object.entries(dayPnL)) {
    if (pnl > mostProfitableDayPnL) { mostProfitableDayPnL = pnl; mostProfitableDay = day }
    if (pnl < mostLosingDayPnL) { mostLosingDayPnL = pnl; mostLosingDay = day }
  }

  let mostProfitablePair: string | null = null
  let mostProfitablePairPnL = -Infinity
  let mostLosingPair: string | null = null
  let mostLosingPairPnL = Infinity

  for (const [pair, pnl] of Object.entries(pairPnL)) {
    if (pnl > mostProfitablePairPnL) { mostProfitablePairPnL = pnl; mostProfitablePair = pair }
    if (pnl < mostLosingPairPnL) { mostLosingPairPnL = pnl; mostLosingPair = pair }
  }

  return {
    tradingActivity: {
      totalTrades: sorted.length,
      winRate,
      avgTradesPerMonth: Math.round(sorted.length / monthsInRange),
      tradingDaysActive: tradeDates.size,
      mostTradedDay,
      mostProfitableDay,
      mostProfitablePair,
      mostLosingDay,
      mostLosingPair,
    },
    psychMetrics: {
      longestWinStreak: maxWinStreak,
      longestLoseStreak: maxLoseStreak,
      avgWin: avgWin.toFixed(2),
      avgLoss: avgLoss.toFixed(2),
      totalNetPnL: cumulativePnL,
      expectancy: expectancy.toFixed(2),
      profitFactor: profitFactor.toFixed(2),
      avgHoldingTime: `${hours}h ${minutes}m`,
      maxDrawdown: maxDD.toFixed(2),
      peakEquity: peakEquity.toFixed(2),
      rrEfficiency: rrEfficiency.toFixed(2),
      consistencyScore,
      recoveryFactor: recoveryFactor.toFixed(2),
      totalRMultiple: totalRMultipleDelta.toFixed(2),
    },
    sessionPerformance: sessions,
    rMultipleDistribution: rDistribution,
    rMultipleDataQuality: {
      totalTrades: sorted.length,
      tradesWithStopLoss,
      percentageComplete: sorted.length > 0 ? Math.round((tradesWithStopLoss / sorted.length) * 100) : 0
    },
    chartData: {
      equityCurve,
      outcomeDistribution: outcomeDistribution.filter(d => d.value > 0),
      dayOfWeekPerformance: dayNames.map(day => ({
        name: day.substring(0, 3),
        Win: Number((dayPnL[day] > 0 ? dayPnL[day] : 0).toFixed(2)),
        Loss: Number((dayPnL[day] < 0 ? Math.abs(dayPnL[day]) : 0).toFixed(2))
      })).filter(d => d.Win > 0 || d.Loss > 0)
    }
  }
}
