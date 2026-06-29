import type { TradeType } from '@/lib/db/schema/trades';


export type PnlDisplayMode = 'net' | 'gross'

type TradePnlLike = Partial<Pick<TradeType, 'pnl' | 'commission'>>

export function normalizePnlDisplayMode(value: unknown): PnlDisplayMode {
  return value === 'gross' ? 'gross' : 'net'
}

export function getTradeGrossPnl(trade: TradePnlLike | null | undefined): number {
  return Number(trade?.pnl || 0)
}

export function getTradeFees(trade: TradePnlLike | null | undefined): number {
  return Number(trade?.commission || 0)
}

export function getTradeNetPnl(trade: TradePnlLike | null | undefined): number {
  return getTradeGrossPnl(trade) + getTradeFees(trade)
}

export function getTradePnlByMode(
  trade: TradePnlLike | null | undefined,
  mode: PnlDisplayMode = 'net'
): number {
  return mode === 'gross' ? getTradeGrossPnl(trade) : getTradeNetPnl(trade)
}

export function getBalanceByMode(
  startingBalance: number,
  grossPnl: number,
  netPnl: number,
  mode: PnlDisplayMode = 'net'
): number {
  return Number(startingBalance || 0) + (mode === 'gross' ? grossPnl : netPnl)
}

export function getPnlDisplayLabel(mode: PnlDisplayMode = 'net'): string {
  return mode === 'gross' ? 'Gross P&L' : 'Net P&L'
}
