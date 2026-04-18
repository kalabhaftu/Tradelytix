/**
 * Standardized Performance Metrics Utility
 * Single source of truth for all mathematical models.
 */

/**
 * Calculates the R-Multiple using the Pure Price Method.
 * Formula: (Exit - Entry) / (Entry - SL) for Longs
 */
export function calculateRMultiple(
  side: string | null | undefined,
  entryPrice: number | string,
  exitPrice: number | string,
  stopLoss: number | string | null | undefined
): number {
  const sideStr = (side || '').toUpperCase()
  const entry = typeof entryPrice === 'string' ? parseFloat(entryPrice) : entryPrice
  const exit = typeof exitPrice === 'string' ? parseFloat(exitPrice) : exitPrice
  const sl = typeof stopLoss === 'string' ? parseFloat(stopLoss) : (stopLoss || 0)

  if (!sl || sl === 0 || sl === entry || isNaN(entry) || isNaN(exit) || isNaN(sl)) {
    return 0
  }

  let riskPoints: number
  let pnlPoints: number

  if (sideStr === 'BUY' || sideStr === 'LONG') {
    riskPoints = entry - sl
    pnlPoints = exit - entry
  } else if (sideStr === 'SELL' || sideStr === 'SHORT') {
    riskPoints = sl - entry
    pnlPoints = entry - exit
  } else {
    return 0
  }

  if (riskPoints <= 0) return 0
  return pnlPoints / riskPoints
}

/**
 * Calculates R-Squared (Coefficient of Determination) for an equity curve.
 * Used for the Consistency Score.
 */
export function calculateRSquared(data: number[]): number {
  if (data.length < 2) return 0
  
  const n = data.length
  const x = Array.from({ length: n }, (_, i) => i)
  const y = data

  const sumX = x.reduce((a, b) => a + b, 0)
  const sumY = y.reduce((a, b) => a + b, 0)
  const sumXY = x.reduce((a, b, i) => a + b * y[i], 0)
  const sumX2 = x.reduce((a, b) => a + b * b, 0)
  const sumY2 = y.reduce((a, b) => a + b * b, 0)

  const numerator = n * sumXY - sumX * sumY
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY))

  if (denominator === 0) return 0
  const r = numerator / denominator
  return Math.max(0, Math.min(100, r * r * 100))
}

/**
 * Calculates peak-to-trough Drawdown.
 */
export function calculatePeakToTroughDrawdown(pnls: number[]): { maxDrawdown: number, peak: number } {
  let peak = 0
  let maxDrawdown = 0
  let runningPnL = 0

  pnls.forEach(pnl => {
    runningPnL += pnl
    if (runningPnL > peak) peak = runningPnL
    const drawdown = peak - runningPnL
    if (drawdown > maxDrawdown) maxDrawdown = drawdown
  })

  return { maxDrawdown, peak }
}

/**
 * Calculates Expectancy.
 * Formula: (WinRate * AvgWin) - (LossRate * Abs(AvgLoss))
 */
export function calculateExpectancy(
  winRate: number, 
  avgWin: number, 
  avgLoss: number
): number {
  const winProb = winRate / 100
  const lossProb = 1 - winProb
  return (winProb * avgWin) - (lossProb * Math.abs(avgLoss))
}

/**
 * Calculates Profit Factor.
 */
export function calculateProfitFactor(grossWin: number, grossLoss: number): number {
  const absLoss = Math.abs(grossLoss)
  if (absLoss === 0) return grossWin > 0 ? 5 : 0
  return grossWin / absLoss
}

/**
 * Calculates Recovery Factor.
 */
export function calculateRecoveryFactor(netProfit: number, maxDrawdown: number): number {
  if (maxDrawdown === 0) return netProfit > 0 ? 5 : 0
  return netProfit / maxDrawdown
}
