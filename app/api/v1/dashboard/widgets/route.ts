import { NextRequest, NextResponse } from 'next/server'
import { GET as getTrades } from '@/app/api/v1/trades/route'
import {
  calculateDayOfWeekPerformance,
  calculateOutcomeDistribution,
  calculateEquityCurve,
  calculateNetDailyPnl,
  calculateDailyCumulativePnl,
  calculateAccountBalanceChart,
  calculateCalendarData,
  calculateSessionAnalysis
} from '@/lib/dashboard-math'
import { prisma } from '@/lib/prisma'
import { getResolvedUserIdentitySafe } from '@/server/user-identity'
import { applyRateLimit, apiLimiter } from '@/lib/rate-limiter'
import { logger } from '@/lib/logger'
import { calculateBalanceInfo } from '@/lib/utils/balance-calculator'

export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get('type')
  
  if (!type) {
    return NextResponse.json({ error: 'Missing widget type' }, { status: 400 })
  }

  // Optimize upstream trades query to skip stats and calendar math
  request.nextUrl.searchParams.set('includeStats', 'false')
  request.nextUrl.searchParams.set('includeCalendar', 'false')

  // Fetch filtered trades using the existing robust trades API
  const tradesResponse = await getTrades(request)
  if (tradesResponse.status !== 200) {
    return tradesResponse
  }

  const data = await tradesResponse.json()
  const trades = data.trades || []
  let cachedInternalUserId: string | null | undefined

  const getInternalUserId = async () => {
    if (cachedInternalUserId !== undefined) {
      return cachedInternalUserId
    }

    const identity = await getResolvedUserIdentitySafe()
    cachedInternalUserId = identity?.internalUserId ?? null
    return cachedInternalUserId
  }

  // Route to the appropriate math function
  let result
  switch (type) {
    case 'dayOfWeekPerformance':
      result = calculateDayOfWeekPerformance(trades)
      break
    case 'outcomeDistribution':
      result = calculateOutcomeDistribution(trades)
      break
    case 'equityCurve':
      result = calculateEquityCurve(trades)
      break
    case 'netDailyPnl':
      result = calculateNetDailyPnl(trades)
      break
    case 'dailyCumulativePnl':
      result = calculateDailyCumulativePnl(trades)
      break
    case 'accountBalanceChart':
      // Fetch user's active accounts to calculate absolute balance
      let activeAccounts = []
      const internalUserId = await getInternalUserId()
      if (internalUserId) {
        activeAccounts = await prisma.account.findMany({
          where: { userId: internalUserId, isArchived: false },
          select: { startingBalance: true }
        }) as any[]
      }
      result = calculateAccountBalanceChart(trades, activeAccounts)
      break
    case 'calendarData':
      result = calculateCalendarData(trades)
      break
    case 'sessionAnalysis':
      result = calculateSessionAnalysis(trades)
      break
    case 'accountBalancePnl':
      let userAccounts = []
      const accountOwnerId = await getInternalUserId()
      if (accountOwnerId) {
        userAccounts = await prisma.account.findMany({
          where: { userId: accountOwnerId }
        }) as any[]
      }
      
      const accountNumbers = request.nextUrl.searchParams.get('accounts')?.split(',').filter(Boolean) || []
      let filteredDbAccounts = userAccounts
      if (accountNumbers.length > 0) {
        filteredDbAccounts = userAccounts.filter(acc => accountNumbers.includes(acc.number))
      }
      result = calculateBalanceInfo(filteredDbAccounts, trades)
      break
    default:
      return NextResponse.json({ error: 'Unknown widget type' }, { status: 400 })
  }

  return NextResponse.json(result)
}
