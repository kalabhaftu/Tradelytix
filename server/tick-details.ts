export interface TickDetails {
  id: string
  ticker: string
  tickValue: number
  tickSize: number
}

const DEFAULT_TICK_DETAILS: TickDetails[] = [
  { id: '1', ticker: 'ES', tickSize: 0.25, tickValue: 12.50 },
  { id: '2', ticker: 'MES', tickSize: 0.25, tickValue: 1.25 },
  { id: '3', ticker: 'NQ', tickSize: 0.25, tickValue: 5.00 },
  { id: '4', ticker: 'MNQ', tickSize: 0.25, tickValue: 0.50 },
  { id: '5', ticker: 'RTY', tickSize: 0.10, tickValue: 5.00 },
  { id: '6', ticker: 'M2K', tickSize: 0.10, tickValue: 0.50 },
  { id: '7', ticker: 'YM', tickSize: 1.00, tickValue: 5.00 },
  { id: '8', ticker: 'MYM', tickSize: 1.00, tickValue: 0.50 },
  { id: '9', ticker: 'GC', tickSize: 0.10, tickValue: 10.00 },
  { id: '10', ticker: 'MGC', tickSize: 0.10, tickValue: 1.00 },
  { id: '11', ticker: 'CL', tickSize: 0.01, tickValue: 10.00 },
  { id: '12', ticker: 'MCL', tickSize: 0.01, tickValue: 1.00 },
];

export async function getTickDetails(): Promise<TickDetails[]> {
  return DEFAULT_TICK_DETAILS
}
