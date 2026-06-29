import type { TradeType } from '@/lib/db/schema/trades';
;

export interface CalendarEntry {
  pnl: number;
  tradeNumber: number;
  longNumber: number;
  shortNumber: number;
  trades: TradeType[];
  isProfit?: boolean;
  isLoss?: boolean;
  isBreakEven?: boolean;
  dailyRMultiple?: number;
}

export interface CalendarData {
  [date: string]: CalendarEntry;
}
