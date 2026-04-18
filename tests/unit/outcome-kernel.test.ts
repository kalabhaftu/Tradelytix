import { describe, expect, it } from 'vitest'
import {
  calculateWinRate,
  classifyOutcome,
  formatBreakevenBand,
  getBreakEvenThreshold,
} from '@/lib/metrics/outcome'

describe('Outcome Kernel', () => {
  it('normalizes threshold safely', () => {
    expect(getBreakEvenThreshold(undefined)).toBe(10)
    expect(getBreakEvenThreshold(-15)).toBe(15)
    expect(getBreakEvenThreshold('12.5')).toBe(12.5)
  })

  it('classifies outcomes at threshold boundaries', () => {
    expect(classifyOutcome(11, 10)).toBe('win')
    expect(classifyOutcome(-11, 10)).toBe('loss')
    expect(classifyOutcome(10, 10)).toBe('breakeven')
    expect(classifyOutcome(-10, 10)).toBe('breakeven')
  })

  it('calculates win rate excluding break-even by denominator shape', () => {
    expect(calculateWinRate(3, 1)).toBe(75)
    expect(calculateWinRate(0, 0)).toBe(0)
  })

  it('formats break-even money band', () => {
    expect(formatBreakevenBand(10)).toBe('-$10 to +$10')
    expect(formatBreakevenBand(12.5)).toBe('-$12.50 to +$12.50')
  })
})

describe('MatchTrader Regression Fixture', () => {
  it('keeps totals and outcome counts aligned with canonical realized pnl', () => {
    const fixturePnls = [
      99.2, 45.13, 31.08, 26.57, 56.91,
      -11.56, -69.94, 18.15, 22.78, 69.9,
      -35.94, -10.56, -57.6, -24.34, -44.0,
      -47.26, 58.74, -41.92, -8.35,
    ]

    const threshold = 10
    const counts = fixturePnls.reduce(
      (acc, pnl) => {
        const outcome = classifyOutcome(pnl, threshold)
        if (outcome === 'win') acc.wins += 1
        else if (outcome === 'loss') acc.losses += 1
        else acc.breakeven += 1
        return acc
      },
      { wins: 0, losses: 0, breakeven: 0 }
    )

    const totalPnl = fixturePnls.reduce((sum, pnl) => sum + pnl, 0)

    expect(Math.round(totalPnl * 100) / 100).toBe(76.99)
    expect(counts).toEqual({
      wins: 9,
      losses: 9,
      breakeven: 1,
    })
    expect(calculateWinRate(counts.wins, counts.losses)).toBe(50)
  })
})
