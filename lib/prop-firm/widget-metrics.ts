import { formatInTimeZone } from 'date-fns-tz'
import { classifyOutcome } from '@/lib/metrics/outcome'
import { getTradeNetPnl } from '@/lib/metrics/pnl'

export const DEFAULT_PROP_FIRM_RESET_TIMEZONE = 'UTC'

export type PropFirmWidgetTrade = {
  id: string
  pnl?: number | string | null
  commission?: number | string | null
  netPnL?: number | string | null
  entryDate?: string | Date | null
  closeDate?: string | Date | null
  entryTime?: string | Date | null
  exitTime?: string | Date | null
}

export function getPropFirmDateKey(date: Date, timezone = DEFAULT_PROP_FIRM_RESET_TIMEZONE) {
  return formatInTimeZone(date, timezone, 'yyyy-MM-dd')
}

export function getPropFirmTradeTimestamp(trade: PropFirmWidgetTrade) {
  const value = trade.exitTime || trade.closeDate || trade.entryTime || trade.entryDate
  const date = value ? new Date(value) : null
  return date && !Number.isNaN(date.getTime()) ? date : null
}

export function getPropFirmTradeNetPnl(trade: PropFirmWidgetTrade) {
  if (trade.netPnL != null) return Number(trade.netPnL) || 0
  return getTradeNetPnl(trade as any)
}

export function buildPropFirmTodayStats(trades: PropFirmWidgetTrade[], timezone = DEFAULT_PROP_FIRM_RESET_TIMEZONE, now = new Date()) {
  const todayKey = getPropFirmDateKey(now, timezone)
  const todayTrades = trades.filter((trade) => {
    const timestamp = getPropFirmTradeTimestamp(trade)
    return timestamp ? getPropFirmDateKey(timestamp, timezone) === todayKey : false
  })
  const pnls = todayTrades.map(getPropFirmTradeNetPnl)
  const wins = pnls.filter((pnl) => classifyOutcome(pnl, 0) === 'win').length
  const losses = pnls.filter((pnl) => classifyOutcome(pnl, 0) === 'loss').length
  const breakeven = Math.max(0, todayTrades.length - wins - losses)
  const pnl = pnls.reduce((sum, value) => sum + value, 0)

  return {
    pnl,
    trades: todayTrades.length,
    wins,
    losses,
    breakeven,
    winRate: wins + losses > 0 ? (wins / (wins + losses)) * 100 : 0,
    bestTrade: pnls.length ? Math.max(...pnls) : 0,
    worstTrade: pnls.length ? Math.min(...pnls) : 0,
    averageTrade: pnls.length ? pnl / pnls.length : 0,
  }
}

export function buildPropFirmAccountExtremes(trades: PropFirmWidgetTrade[]) {
  const pnls = trades.map(getPropFirmTradeNetPnl)
  const pnl = pnls.reduce((sum, value) => sum + value, 0)

  return {
    bestTrade: pnls.length ? Math.max(...pnls) : 0,
    worstTrade: pnls.length ? Math.min(...pnls) : 0,
    averageTrade: pnls.length ? pnl / pnls.length : 0,
  }
}

export function buildPropFirmGrowth(account: any, trades: PropFirmWidgetTrade[], timezone = DEFAULT_PROP_FIRM_RESET_TIMEZONE) {
  const accountSize = Number(account?.accountSize || 0)
  let runningPnl = 0
  let peakEquity = accountSize
  let maxDrawdown = 0
  const dayKeys = new Set<string>()

  const points = [...trades]
    .sort((a, b) => (getPropFirmTradeTimestamp(a)?.getTime() || 0) - (getPropFirmTradeTimestamp(b)?.getTime() || 0))
    .map((trade, index) => {
      const timestamp = getPropFirmTradeTimestamp(trade) || new Date()
      dayKeys.add(getPropFirmDateKey(timestamp, timezone))
      runningPnl += getPropFirmTradeNetPnl(trade)
      const balance = accountSize + runningPnl
      peakEquity = Math.max(peakEquity, balance)
      maxDrawdown = Math.max(maxDrawdown, peakEquity - balance)
      return {
        label: `${index + 1}`,
        timestamp: timestamp.getTime(),
        balance,
        pnl: runningPnl,
        tradePnl: getPropFirmTradeNetPnl(trade),
      }
    })

  return { points, peakEquity, maxDrawdown, tradingDays: dayKeys.size }
}

export function buildPropFirmDailyDrawdown(account: any, trades: PropFirmWidgetTrade[], timezone = DEFAULT_PROP_FIRM_RESET_TIMEZONE, now = new Date()) {
  const accountSize = Number(account?.accountSize || 0)
  const phase = account?.currentPhase || {}
  const dailyLimit = accountSize * (Number(phase.dailyDrawdownPercent || 0) / 100)
  const todayKey = getPropFirmDateKey(now, timezone)
  let pnlBeforeToday = 0
  let todayPnl = 0

  for (const trade of trades) {
    const timestamp = getPropFirmTradeTimestamp(trade)
    const pnl = getPropFirmTradeNetPnl(trade)
    if (!timestamp) continue

    if (getPropFirmDateKey(timestamp, timezone) === todayKey) {
      todayPnl += pnl
    } else if (timestamp.getTime() < now.getTime()) {
      pnlBeforeToday += pnl
    }
  }

  const dailyStartBalance = accountSize + pnlBeforeToday
  const currentEquity = dailyStartBalance + todayPnl
  const dailyDrawdownUsed = Math.max(0, dailyStartBalance - currentEquity)
  const dailyDrawdownRemaining = Math.max(0, dailyLimit - dailyDrawdownUsed)
  const dailyLossFloor = dailyStartBalance - dailyLimit

  return {
    dailyStartBalance,
    dailyDrawdownUsed,
    dailyDrawdownRemaining,
    dailyLossFloor,
    dailyLimit,
  }
}

export function formatPropFirmAxisMoney(value: number) {
  const amount = Math.round(Number(value) || 0)
  return `$${amount.toLocaleString('en-US')}`
}
