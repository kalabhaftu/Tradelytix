
import type { TradeType } from '@/lib/db/schema/trades';

import { calculateWinRate, classifyOutcome, DEFAULT_BREAK_EVEN_THRESHOLD, getBreakEvenThreshold } from "@/lib/metrics/outcome"
import { getTradeNetPnl } from "@/lib/metrics/pnl"
import { calculateTradeRMultiple } from "@/lib/math/performance-metrics"

export interface DailyStats {
    pnl: number
    tradeCount: number
    winRate: number
    rMultiple: number
    isProfit: boolean
    isLoss: boolean
    isBreakEven: boolean
}

export function calculateRMultiple(trade: Trade): number {
    return calculateTradeRMultiple(trade as any)
}

export function calculateDailyStats(
    trades: Trade[],
    thresholdInput: number = DEFAULT_BREAK_EVEN_THRESHOLD
): DailyStats {
    const threshold = getBreakEvenThreshold(thresholdInput)
    let pnl = 0
    let tradeCount = 0
    let wins = 0
    let losses = 0
    let rMultiple = 0

    trades.forEach(t => {
        const netPnL = getTradeNetPnl(t)
        pnl += netPnL
        tradeCount++

        const outcome = classifyOutcome(netPnL, threshold)
        if (outcome === 'win') wins++
        else if (outcome === 'loss') losses++

        rMultiple += calculateRMultiple(t)
    })

    const winRate = calculateWinRate(wins, losses)
    const avgRMultiple = tradeCount > 0 ? rMultiple / tradeCount : 0

    return {
        pnl,
        tradeCount,
        winRate,
        rMultiple: avgRMultiple,
        isProfit: classifyOutcome(pnl, threshold) === 'win',
        isLoss: classifyOutcome(pnl, threshold) === 'loss',
        isBreakEven: classifyOutcome(pnl, threshold) === 'breakeven'
    }
}
