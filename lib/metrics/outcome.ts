export const DEFAULT_BREAK_EVEN_THRESHOLD = 10

export type TradeOutcome = 'win' | 'loss' | 'breakeven'

const MAX_REASONABLE_THRESHOLD = 1_000_000

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }

  return null
}

export function getBreakEvenThreshold(userValue: unknown): number {
  const parsed = toFiniteNumber(userValue)
  if (parsed === null) return DEFAULT_BREAK_EVEN_THRESHOLD

  const normalized = Math.abs(parsed)
  if (!Number.isFinite(normalized)) return DEFAULT_BREAK_EVEN_THRESHOLD

  return Math.min(normalized, MAX_REASONABLE_THRESHOLD)
}

export function classifyOutcome(netPnl: number, threshold: number): TradeOutcome {
  if (netPnl > threshold) return 'win'
  if (netPnl < -threshold) return 'loss'
  return 'breakeven'
}

export function calculateWinRate(wins: number, losses: number): number {
  const tradableCount = wins + losses
  if (tradableCount <= 0) return 0
  return (wins / tradableCount) * 100
}

export function formatBreakevenBand(threshold: number): string {
  const abs = Math.abs(threshold)
  const formatted = Number.isInteger(abs) ? abs.toString() : abs.toFixed(2)
  return `-$${formatted} to +$${formatted}`
}
