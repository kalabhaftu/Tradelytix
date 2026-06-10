import { Suspense } from 'react'
import { BacktestingClient } from '@/app/dashboard/backtesting/components/backtesting-client'
import { BacktestingPageSkeleton } from '@/app/dashboard/backtesting/components/backtesting-page-skeleton'
import { BacktestTrade } from '@/types/backtesting-types'

export default function DemoBacktestingPage() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()

  const mockBacktests: BacktestTrade[] = [
    {
      id: 'mock-bt-1',
      pair: 'NQ100',
      direction: 'BUY',
      outcome: 'WIN',
      session: 'New York',
      model: 'ICT_2022',
      riskRewardRatio: 3.0,
      riskPoints: 15,
      rewardPoints: 45,
      entryPrice: 18500,
      stopLoss: 18485,
      takeProfit: 18545,
      exitPrice: 18545,
      pnl: 450,
      images: [],
      notes: 'Clean Fair Value Gap entry during NY morning run. Displacement was strong.',
      tags: ['fvg', 'killzone'],
      dateExecuted: new Date(year, month, 5),
      createdAt: new Date(year, month, 5),
      updatedAt: new Date(year, month, 5),
    },
    {
      id: 'mock-bt-2',
      pair: 'EURUSD',
      direction: 'SELL',
      outcome: 'LOSS',
      session: 'London',
      model: 'PRICE_ACTION',
      riskRewardRatio: 2.0,
      riskPoints: 10,
      rewardPoints: 20,
      entryPrice: 1.0850,
      stopLoss: 1.0860,
      takeProfit: 1.0830,
      exitPrice: 1.0860,
      pnl: -100,
      images: [],
      notes: 'Double top rejection failed. Stopped out rapidly by news spike.',
      tags: ['double-top', 'news'],
      dateExecuted: new Date(year, month, 8),
      createdAt: new Date(year, month, 8),
      updatedAt: new Date(year, month, 8),
    },
    {
      id: 'mock-bt-3',
      pair: 'GBPUSD',
      direction: 'BUY',
      outcome: 'WIN',
      session: 'London',
      model: 'SUPPLY_DEMAND',
      riskRewardRatio: 2.5,
      riskPoints: 12,
      rewardPoints: 30,
      entryPrice: 1.2720,
      stopLoss: 1.2708,
      takeProfit: 1.2750,
      exitPrice: 1.2750,
      pnl: 300,
      images: [],
      notes: 'Support demand zone hold. Clean rejection and structure shift on 5m.',
      tags: ['demand', 'structure-shift'],
      dateExecuted: new Date(year, month, 12),
      createdAt: new Date(year, month, 12),
      updatedAt: new Date(year, month, 12),
    },
    {
      id: 'mock-bt-4',
      pair: 'XAUUSD',
      direction: 'SELL',
      outcome: 'WIN',
      session: 'New York',
      model: 'SMART_MONEY',
      riskRewardRatio: 4.0,
      riskPoints: 20,
      rewardPoints: 80,
      entryPrice: 2350,
      stopLoss: 2352,
      takeProfit: 2342,
      exitPrice: 2342,
      pnl: 800,
      images: [],
      notes: 'Premium sweep of previous session high. Order block entry was precise.',
      tags: ['liquidity-sweep', 'order-block'],
      dateExecuted: new Date(year, month, 15),
      createdAt: new Date(year, month, 15),
      updatedAt: new Date(year, month, 15),
    },
    {
      id: 'mock-bt-5',
      pair: 'EURUSD',
      direction: 'BUY',
      outcome: 'BREAKEVEN',
      session: 'Asia',
      model: 'PRICE_ACTION',
      riskRewardRatio: 1.5,
      riskPoints: 8,
      rewardPoints: 12,
      entryPrice: 1.0820,
      stopLoss: 1.0812,
      takeProfit: 1.0832,
      exitPrice: 1.0820,
      pnl: 0,
      images: [],
      notes: 'Moved stop loss to breakeven after 1R. Price reversed and took me out.',
      tags: ['breakeven', 'range'],
      dateExecuted: new Date(year, month, 18),
      createdAt: new Date(year, month, 18),
      updatedAt: new Date(year, month, 18),
    }
  ]

  return (
    <Suspense fallback={<BacktestingPageSkeleton />}>
      <BacktestingClient initialBacktests={mockBacktests} />
    </Suspense>
  )
}
