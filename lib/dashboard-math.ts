import { Trade, Account } from '@prisma/client'
import { startOfMonth, endOfMonth, parseISO, isWithinInterval, startOfWeek, endOfWeek, format, differenceInDays, getDay } from 'date-fns'
import { getTradingSession } from '@/lib/time-utils'
import { classifyTrade, BREAK_EVEN_THRESHOLD } from '@/lib/utils'
import { CHART_COLORS } from '@/app/dashboard/components/widget-card'
import { 
  calculateRMultiple, 
  calculatePeakToTroughDrawdown,
  calculateExpectancy 
} from '@/lib/math/performance-metrics'
import { calculateTotalStartingBalance } from '@/lib/utils/balance-calculator'

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// Generate an aggregated map of daily PnL and trade counts
function getDailyAggregations(trades: Partial<Trade>[]) {
  const dailyMap: Record<string, { pnl: number; wins: number; losses: number; shortNumber: number; longNumber: number }> = {}

  trades.forEach(trade => {
    if (!trade.entryDate) return
    const dateStr = trade.entryDate.toString().split('T')[0]
    
    if (!dailyMap[dateStr]) {
      dailyMap[dateStr] = { pnl: 0, wins: 0, losses: 0, shortNumber: 0, longNumber: 0 }
    }

    const netPnl = Number(trade.pnl || 0) + Number(trade.commission || 0)
    dailyMap[dateStr].pnl += netPnl

    if (netPnl > BREAK_EVEN_THRESHOLD) dailyMap[dateStr].wins++
    else if (netPnl < -BREAK_EVEN_THRESHOLD) dailyMap[dateStr].losses++

    if (trade.side === 'SHORT') dailyMap[dateStr].shortNumber++
    if (trade.side === 'LONG') dailyMap[dateStr].longNumber++
  })

  return dailyMap
}

export function calculateDayOfWeekPerformance(trades: Partial<Trade>[]) {
  const dayMap: Record<number, { totalPnl: number; winPnl: number; lossPnl: number; wins: number; losses: number; total: number }> = {}

  for (let i = 0; i < 7; i++) {
    dayMap[i] = { totalPnl: 0, winPnl: 0, lossPnl: 0, wins: 0, losses: 0, total: 0 }
  }

  trades.forEach((trade) => {
    if (!trade.entryDate) return
    const dayOfWeek = getDay(new Date(trade.entryDate))
    const netPnl = Number(trade.pnl || 0) + Number(trade.commission || 0)
    
    dayMap[dayOfWeek].totalPnl += netPnl
    dayMap[dayOfWeek].total++
    if (netPnl > BREAK_EVEN_THRESHOLD) {
      dayMap[dayOfWeek].wins++
      dayMap[dayOfWeek].winPnl += netPnl
    } else if (netPnl < -BREAK_EVEN_THRESHOLD) {
      dayMap[dayOfWeek].losses++
      dayMap[dayOfWeek].lossPnl += Math.abs(netPnl)
    }
  })

  return [1, 2, 3, 4, 5, 0, 6]
    .map((day) => ({
      day: DAY_NAMES[day],
      pnl: parseFloat(dayMap[day].totalPnl.toFixed(2)),
      Win: parseFloat(dayMap[day].winPnl.toFixed(2)),
      Loss: parseFloat(dayMap[day].lossPnl.toFixed(2)),
      wins: dayMap[day].wins,
      losses: dayMap[day].losses,
      total: dayMap[day].total,
    }))
    .filter((d) => d.total > 0)
}

export function calculateOutcomeDistribution(trades: Partial<Trade>[]) {
  let wins = 0, losses = 0, breakeven = 0

  trades.forEach((trade) => {
    const netPnl = Number(trade.pnl || 0) + Number(trade.commission || 0)
    if (netPnl > BREAK_EVEN_THRESHOLD) wins++
    else if (netPnl < -BREAK_EVEN_THRESHOLD) losses++
    else breakeven++
  })

  return {
    data: [
      { name: 'Wins', value: wins, color: CHART_COLORS.bullish },
      { name: 'Losses', value: losses, color: CHART_COLORS.bearish },
      { name: 'Breakeven', value: breakeven, color: CHART_COLORS.muted },
    ].filter(d => d.value > 0),
    totalTrades: wins + losses + breakeven,
  }
}

export function calculateEquityCurve(trades: Partial<Trade>[]) {
  const sorted = [...trades].sort(
    (a, b) => new Date(a.entryDate!).getTime() - new Date(b.entryDate!).getTime()
  )

  let cumulative = 0
  return sorted.map((trade) => {
    const netPnl = Number(trade.pnl || 0) + Number(trade.commission || 0)
    cumulative += netPnl
    return {
      date: format(new Date(trade.entryDate!), 'MMM dd'),
      equity: parseFloat(cumulative.toFixed(2)),
    }
  })
}

export function calculateNetDailyPnl(trades: Partial<Trade>[]) {
  const dailyMap = getDailyAggregations(trades)

  return Object.entries(dailyMap)
    .map(([date, values]) => ({
      date,
      pnl: parseFloat(values.pnl.toFixed(2)),
      shortNumber: values.shortNumber,
      longNumber: values.longNumber,
      wins: values.wins,
      losses: values.losses,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}

export function calculateDailyCumulativePnl(trades: Partial<Trade>[]) {
  const dailyMap = getDailyAggregations(trades)
  let cumulative = 0

  return Object.entries(dailyMap)
    .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
    .map(([date, values]) => {
      cumulative += values.pnl
      return {
        date,
        dailyPnL: parseFloat(values.pnl.toFixed(2)),
        cumulativePnL: parseFloat(cumulative.toFixed(2)),
        trades: values.shortNumber + values.longNumber,
      }
    })
}

export function calculateAccountBalanceChart(trades: Partial<Trade>[], activeAccountsData?: any[]) {
  const dailyMap = getDailyAggregations(trades)
  
  // Use calculateTotalStartingBalance for proper prop-firm phase deduplication
  // This prevents double/triple counting when master account has multiple phases
  let startingBalance = 0
  if (activeAccountsData && activeAccountsData.length > 0) {
    startingBalance = calculateTotalStartingBalance(activeAccountsData)
  }

  let rollingBalance = startingBalance
  return Object.entries(dailyMap)
    .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
    .map(([date, values]) => {
      const prevBalance = rollingBalance
      rollingBalance += values.pnl
      return {
        date,
        balance: parseFloat(rollingBalance.toFixed(2)),
        change: parseFloat(values.pnl.toFixed(2)),
        changePercent: prevBalance !== 0 ? (values.pnl / prevBalance) * 100 : 0,
        trades: values.shortNumber + values.longNumber,
        wins: values.wins,
        losses: values.losses,
        hasActivity: true
      }
    })
}

import { groupTradesByExecution } from '@/lib/utils'
import { calculateZellaScore, calculateMetricsFromTrades } from '@/lib/zella-score'

export function calculatePnlByStrategy(trades: Partial<Trade>[]) {
  const groupedTrades = groupTradesByExecution(trades as any)
  const strategyMap: Record<string, { pnl: number; trades: number; wins: number; losses: number; grossWin: number; grossLoss: number }> = {}

  groupedTrades.forEach((trade: any) => {
    const strategy = trade.tradingModel || trade.TradingModel?.name || 'No Strategy'
    if (!strategyMap[strategy]) strategyMap[strategy] = { pnl: 0, trades: 0, wins: 0, losses: 0, grossWin: 0, grossLoss: 0 }
    const netPnl = (trade.pnl || 0) + (trade.commission || 0)
    strategyMap[strategy].pnl += netPnl
    strategyMap[strategy].trades += 1

    if (netPnl > BREAK_EVEN_THRESHOLD) {
      strategyMap[strategy].wins += 1
      strategyMap[strategy].grossWin += netPnl
    } else if (netPnl < -BREAK_EVEN_THRESHOLD) {
      strategyMap[strategy].losses += 1
      strategyMap[strategy].grossLoss += Math.abs(netPnl)
    }
  })

  return Object.entries(strategyMap).map(([strategy, stats]) => {
    const tradableCount = stats.wins + stats.losses
    return {
      strategy,
      pnl: stats.pnl,
      trades: stats.trades,
      wins: stats.wins,
      losses: stats.losses,
      winRate: tradableCount > 0 ? (stats.wins / tradableCount) * 100 : 0,
      avgPnl: stats.trades > 0 ? stats.pnl / stats.trades : 0,
      profitFactor: stats.grossLoss > 0 ? stats.grossWin / stats.grossLoss : stats.grossWin > 0 ? 999 : 0,
    }
  }).sort((a, b) => b.pnl - a.pnl)
}

export function calculatePnlByInstrument(trades: Partial<Trade>[]) {
  const groupedTrades = groupTradesByExecution(trades as any)
  const instrumentMap: Record<string, { pnl: number; trades: number; wins: number; losses: number }> = {}

  groupedTrades.forEach((trade: any) => {
    const instrument = trade.symbol || trade.instrument || 'Unknown'
    if (!instrumentMap[instrument]) instrumentMap[instrument] = { pnl: 0, trades: 0, wins: 0, losses: 0 }
    const netPnl = (trade.pnl || 0) + (trade.commission || 0)
    instrumentMap[instrument].pnl += netPnl
    instrumentMap[instrument].trades += 1
    if (netPnl > BREAK_EVEN_THRESHOLD) instrumentMap[instrument].wins += 1
    else if (netPnl < -BREAK_EVEN_THRESHOLD) instrumentMap[instrument].losses += 1
  })

  return Object.entries(instrumentMap).map(([instrument, stats]) => ({
    instrument,
    pnl: stats.pnl,
    trades: stats.trades,
    wins: stats.wins,
    losses: stats.losses,
    winRate: stats.trades > 0 ? (stats.wins / stats.trades) * 100 : 0,
  })).sort((a, b) => b.pnl - a.pnl)
}

export function calculateWinRateByStrategy(trades: Partial<Trade>[]) {
  const groupedTrades = groupTradesByExecution(trades as any)
  const strategyMap: Record<string, { wins: number; losses: number; grossWin: number; grossLoss: number; allWins: number[] }> = {}

  groupedTrades.forEach((trade: any) => {
    const strategy = trade.tradingModel || trade.TradingModel?.name || 'No Strategy'
    if (!strategyMap[strategy]) strategyMap[strategy] = { wins: 0, losses: 0, grossWin: 0, grossLoss: 0, allWins: [] }
    const netPnl = (trade.pnl || 0) + (trade.commission || 0)
    if (netPnl > BREAK_EVEN_THRESHOLD) {
      strategyMap[strategy].wins += 1
      strategyMap[strategy].grossWin += netPnl
      strategyMap[strategy].allWins.push(netPnl)
    } else if (netPnl < -BREAK_EVEN_THRESHOLD) {
      strategyMap[strategy].losses += 1
      strategyMap[strategy].grossLoss += Math.abs(netPnl)
    }
  })

  return Object.entries(strategyMap).map(([strategy, stats]) => {
    const totalTrades = stats.wins + stats.losses
    const avgWin = stats.allWins.length > 0 ? stats.allWins.reduce((a, b) => a + b, 0) / stats.allWins.length : 0
    const variance = stats.allWins.length > 0
      ? stats.allWins.reduce((sum, win) => sum + Math.pow(win - avgWin, 2), 0) / stats.allWins.length : 0
    const stdDev = Math.sqrt(variance)
    return {
      strategy,
      winRate: totalTrades > 0 ? (stats.wins / totalTrades) * 100 : 0,
      totalTrades,
      wins: stats.wins,
      losses: stats.losses,
      profitFactor: stats.grossLoss > 0 ? stats.grossWin / stats.grossLoss : stats.grossWin > 0 ? 999 : 0,
      consistency: avgWin > 0 ? Math.max(0, 100 - (stdDev / avgWin) * 100) : 0,
    }
  }).sort((a, b) => b.winRate - a.winRate)
}

function calculateDurationMinutes(entryTime: string, exitTime: string): number {
  return (new Date(exitTime).getTime() - new Date(entryTime).getTime()) / (1000 * 60)
}

function getDurationBucket(minutes: number): string {
  if (minutes < 1) return "< 1min"
  if (minutes < 5) return "1-5min"
  if (minutes < 15) return "5-15min"
  if (minutes < 30) return "15-30min"
  if (minutes < 60) return "30min-1hr"
  if (minutes < 120) return "1-2hr"
  if (minutes < 240) return "2-4hr"
  return "4hr+"
}

export function calculateTradeDurationPerformance(trades: Partial<Trade>[]) {
  const groupedTrades = groupTradesByExecution(trades as any)
  const durationMap: Record<string, { pnl: number; trades: number; wins: number; losses: number }> = {}
  
  const order = ["< 1min", "1-5min", "5-15min", "15-30min", "30min-1hr", "1-2hr", "2-4hr", "4hr+"]
  order.forEach(b => { durationMap[b] = { pnl: 0, trades: 0, wins: 0, losses: 0 } })

  groupedTrades.forEach((trade: any) => {
    if (trade.entryDate && trade.closeDate) {
      const durationMinutes = calculateDurationMinutes(trade.entryDate.toString(), trade.closeDate.toString())
      const bucket = getDurationBucket(durationMinutes)
      const netPnL = (trade.pnl || 0) + (trade.commission || 0)
      durationMap[bucket].pnl += netPnL
      durationMap[bucket].trades++

      if (netPnL > BREAK_EVEN_THRESHOLD) durationMap[bucket].wins++
      else if (netPnL < -BREAK_EVEN_THRESHOLD) durationMap[bucket].losses++
    }
  })

  return order.map(bucket => {
    const data = durationMap[bucket]
    return {
      bucket,
      pnl: data.pnl,
      trades: data.trades,
      wins: data.wins,
      losses: data.losses,
      winRate: data.trades > 0 ? (data.wins / data.trades) * 100 : 0,
      avgPnl: data.trades > 0 ? data.pnl / data.trades : 0,
    }
  }).filter(item => item.trades > 0)
}

export function calculateWeekdayPnl(trades: Partial<Trade>[]) {
  const groupedTrades = groupTradesByExecution(trades as any)
  const weekdayMap: Record<number, { pnl: number; trades: number; wins: number; losses: number }> = {}

  groupedTrades.forEach((trade: any) => {
    if (!trade.entryDate) return
    const dayOfWeek = new Date(trade.entryDate).getDay()

    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      if (!weekdayMap[dayOfWeek]) weekdayMap[dayOfWeek] = { pnl: 0, trades: 0, wins: 0, losses: 0 }
      const netPnL = (trade.pnl || 0) + (trade.commission || 0)
      weekdayMap[dayOfWeek].pnl += netPnL
      weekdayMap[dayOfWeek].trades++
      if (netPnL > BREAK_EVEN_THRESHOLD) weekdayMap[dayOfWeek].wins++
      else if (netPnL < -BREAK_EVEN_THRESHOLD) weekdayMap[dayOfWeek].losses++
    }
  })

  const weekdays = [
    { day: '1', dayName: 'Monday' },
    { day: '2', dayName: 'Tuesday' },
    { day: '3', dayName: 'Wednesday' },
    { day: '4', dayName: 'Thursday' },
    { day: '5', dayName: 'Friday' },
  ]

  return weekdays.map(({ day, dayName }) => {
    const dayNum = parseInt(day)
    const data = weekdayMap[dayNum] || { pnl: 0, trades: 0, wins: 0, losses: 0 }
    return {
      day,
      dayName,
      pnl: data.pnl,
      trades: data.trades,
      wins: data.wins,
      losses: data.losses,
      winRate: data.trades > 0 ? (data.wins / data.trades) * 100 : 0,
    }
  })
}

export function calculatePerformanceScoreResult(trades: Partial<Trade>[]) {
  const metrics = calculateMetricsFromTrades(trades as any)
  if (!metrics) return { hasData: false }
  
  const scoreResult = calculateZellaScore(metrics)
  const radarData = [
    { metric: 'Win %', value: scoreResult.breakdown.tradeWinPercentageScore, fullMark: 100, rawValue: scoreResult.metrics.tradeWinPercentage, weight: 15, description: 'Percentage of winning trades', target: '60%+' },
    { metric: 'Profit Factor', value: scoreResult.breakdown.profitFactorScore, fullMark: 100, rawValue: scoreResult.metrics.profitFactor, weight: 25, description: 'Total Wins ÷ Total Losses', target: '2.6+' },
    { metric: 'Avg W/L', value: scoreResult.breakdown.avgWinLossScore, fullMark: 100, rawValue: scoreResult.metrics.avgWinLoss, weight: 20, description: 'Average Win ÷ Average Loss', target: '2.6+' },
    { metric: 'Recovery', value: scoreResult.breakdown.recoveryFactorScore, fullMark: 100, rawValue: scoreResult.metrics.recoveryFactor, weight: 10, description: 'Net Profit ÷ Max Drawdown', target: '3.5+' },
    { metric: 'Consistency', value: scoreResult.breakdown.consistencyScoreValue, fullMark: 100, rawValue: scoreResult.metrics.consistencyScore, weight: 10, description: 'Stability of daily returns', target: 'Higher is better' },
    { metric: 'Drawdown', value: scoreResult.breakdown.maxDrawdownScore, fullMark: 100, rawValue: scoreResult.metrics.maxDrawdown, weight: 20, description: 'Maximum peak-to-trough decline', target: 'Lower is better' },
  ]

  return { chartData: radarData, overallScore: scoreResult.overallScore, hasData: true }
}



export function calculateTradingOverviewKpis(trades: Partial<Trade>[]) {
  if (!trades?.length) {
    return {
      currentStats: { monthTrades: 0, monthWinRate: 0, weekPnL: 0 },
      riskStats: { maxDrawdown: 0, largestLoss: 0, avgLoss: 0, lossStreak: 0 },
      streakData: { currentStreak: 0, isWinning: true, longestWinStreak: 0, longestLoseStreak: 0 }
    }
  }

  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)
  const weekStart = startOfWeek(now, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 })

  const monthTrades = trades.filter(t => {
    if (!t.entryDate) return false
    return isWithinInterval(new Date(t.entryDate), { start: monthStart, end: monthEnd })
  })

  const weekTrades = trades.filter(t => {
    if (!t.entryDate) return false
    return isWithinInterval(new Date(t.entryDate), { start: weekStart, end: weekEnd })
  })

  const monthWins = monthTrades.filter(t => (Number(t.pnl || 0) + Number(t.commission || 0)) > BREAK_EVEN_THRESHOLD).length
  const weekPnL = weekTrades.reduce((sum, t) => sum + (Number(t.pnl || 0) + Number(t.commission || 0)), 0)

  const currentStats = { 
    monthTrades: monthTrades.length, 
    monthWinRate: monthTrades.length > 0 ? (monthWins / monthTrades.length) * 100 : 0, 
    weekPnL 
  }

  const sortedByTime = [...trades].sort((a, b) => (new Date(a.entryDate || 0).getTime()) - (new Date(b.entryDate || 0).getTime()))
  const pnls = sortedByTime.map(t => (Number(t.pnl || 0) + Number(t.commission || 0)))
  
  const { maxDrawdown } = calculatePeakToTroughDrawdown(pnls)

  const losses = trades.filter(t => (Number(t.pnl || 0) + Number(t.commission || 0)) < -BREAK_EVEN_THRESHOLD)
  const largestLoss = Math.abs(Math.min(...losses.map(t => (Number(t.pnl || 0) + Number(t.commission || 0))), 0))
  const avgLoss = losses.length > 0 ? losses.reduce((sum, t) => sum + Math.abs(Number(t.pnl || 0) + Number(t.commission || 0)), 0) / losses.length : 0

  let lossStreak = 0
  for (let i = sortedByTime.length - 1; i >= 0; i--) {
    const netPnl = (Number(sortedByTime[i].pnl || 0) + Number(sortedByTime[i].commission || 0))
    if (netPnl < -BREAK_EVEN_THRESHOLD) lossStreak++
    else if (netPnl > BREAK_EVEN_THRESHOLD) break
  }

  const riskStats = { maxDrawdown, largestLoss, avgLoss, lossStreak }

  const sortedDesc = [...sortedByTime].reverse()
  let currentStreak = 0
  const firstNetPnl = (Number(sortedDesc[0].pnl || 0) + Number(sortedDesc[0].commission || 0))
  const isWinning = firstNetPnl > BREAK_EVEN_THRESHOLD
  const wasWin = isWinning

  for (const trade of sortedDesc) {
    const netPnl = (Number(trade.pnl || 0) + Number(trade.commission || 0))
    if (netPnl > BREAK_EVEN_THRESHOLD === wasWin) currentStreak++
    else break
  }

  let longestWinStreak = 0, longestLoseStreak = 0, tempStreak = 0
  let lastWasWin: boolean | null = null

  for (const trade of sortedByTime) {
    const isWin = (trade.pnl || 0) > 0
    if (lastWasWin === null) { tempStreak = 1; lastWasWin = isWin }
    else if (isWin === lastWasWin) { tempStreak++ }
    else {
      if (lastWasWin) longestWinStreak = Math.max(longestWinStreak, tempStreak)
      else longestLoseStreak = Math.max(longestLoseStreak, tempStreak)
      tempStreak = 1; lastWasWin = isWin
    }
  }
  if (lastWasWin) longestWinStreak = Math.max(longestWinStreak, tempStreak)
  else if (lastWasWin === false) longestLoseStreak = Math.max(longestLoseStreak, tempStreak)

  const streakData = { currentStreak, isWinning, longestWinStreak, longestLoseStreak }

  return { currentStats, riskStats, streakData }
}

export function calculateCalendarData(trades: Partial<Trade>[]) {
  const data: Record<string, { 
    pnl: number; 
    tradeNumber: number; 
    longNumber: number; 
    shortNumber: number;
    dailyRMultiple: number;
    isProfit: boolean;
    isLoss: boolean;
    isBreakEven: boolean;
  }> = {}

  trades.forEach(trade => {
    if (!trade.entryDate) return

    const key = format(new Date(trade.entryDate), 'yyyy-MM-dd')
    if (!data[key]) {
      data[key] = { 
        pnl: 0, 
        tradeNumber: 0, 
        longNumber: 0, 
        shortNumber: 0,
        dailyRMultiple: 0,
        isProfit: false,
        isLoss: false,
        isBreakEven: true
      }
    }

    const netPnl = (trade.pnl || 0) + (trade.commission || 0)
    data[key].pnl += netPnl
    data[key].tradeNumber++

    const r = calculateRMultiple(trade.side, trade.entryPrice || 0, trade.closePrice || 0, trade.stopLoss)
    data[key].dailyRMultiple += r

    const side = trade.side?.toLowerCase()
    const isLong = side === 'long' || side === 'buy' || side === 'b'
    if (isLong) data[key].longNumber++
    else data[key].shortNumber++
    
    // Update outcome flags based on daily aggregate
    data[key].isProfit = data[key].pnl > BREAK_EVEN_THRESHOLD
    data[key].isLoss = data[key].pnl < -BREAK_EVEN_THRESHOLD
    data[key].isBreakEven = !data[key].isProfit && !data[key].isLoss
  })

  return data
}

export function calculateSessionAnalysis(trades: Partial<Trade>[]) {
  const stats: Record<string, { trades: number; wins: number; pnl: number }> = {
      'New York': { trades: 0, wins: 0, pnl: 0 },
      'London': { trades: 0, wins: 0, pnl: 0 },
      'Asia': { trades: 0, wins: 0, pnl: 0 },
      'Outside Session': { trades: 0, wins: 0, pnl: 0 }
  }

  trades.forEach(trade => {
      if (!trade.entryDate) return

      try {
          const session = getTradingSession(trade.entryDate)

          if (session && stats[session]) {
              stats[session].trades++
              stats[session].pnl += trade.pnl || 0
              if (classifyTrade(trade.pnl || 0) === 'win') {
                  stats[session].wins++
              }
          }
      } catch (e) {
          // Invalid date, skip
      }
  })

  return stats
}
