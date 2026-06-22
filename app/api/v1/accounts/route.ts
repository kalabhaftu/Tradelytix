import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getResolvedUserIdentitySafe } from '@/server/user-identity'
import { calculateAccountBalance } from '@/lib/utils/balance-calculator'
import { buildGroupedTradeCountSummary } from '@/lib/trade-counts'
import { applyRateLimit, apiLimiter } from '@/lib/rate-limiter'
import { isFundedPhaseForEvaluation } from '@/lib/prop-firm/reporting'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  const rateLimitResponse = await applyRateLimit(request, apiLimiter)
  if (rateLimitResponse) return rateLimitResponse

  try {
    const identity = await getResolvedUserIdentitySafe()
    if (!identity) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const internalUserId = identity.internalUserId

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    let statusFilter = searchParams.get('status') || 'all'
    const archivedParam = searchParams.get('archived')
    if (archivedParam === 'true') {
      statusFilter = 'archived'
    } else if (archivedParam === 'false' && statusFilter === 'all') {
      statusFilter = 'all'
    }
    const typeFilter = searchParams.get('type') || 'all'
    const search = searchParams.get('search')?.toLowerCase() || ''

    // 1. Fetch live accounts
    const liveAccounts = await prisma.account.findMany({
      where: { userId: internalUserId },
      orderBy: { createdAt: 'desc' },
    })

    // 2. Fetch prop firm accounts
    const propFirmAccounts = await prisma.masterAccount.findMany({
      where: { userId: internalUserId },
      include: { PhaseAccount: { orderBy: { phaseNumber: 'asc' } } }
    })

    const isFundedPhase = (evaluationType: string, phaseNumber: number): boolean => {
      return isFundedPhaseForEvaluation(evaluationType, phaseNumber)
    }

    // 3. Normalize to UnifiedAccount schema
    const unified: any[] = []

    liveAccounts.forEach(acc => {
      unified.push({
        id: acc.id,
        number: acc.number,
        name: acc.name,
        propfirm: '',
        broker: acc.broker,
        startingBalance: acc.startingBalance,
        accountType: 'live',
        displayName: acc.name || acc.number,
        tradeCount: 0,
        status: 'active', // Live accounts don't inherently have failed/passed
        currentPhase: null,
        createdAt: acc.createdAt,
        isArchived: acc.isArchived || false,
        currentPhaseDetails: null,
      })
    })

    propFirmAccounts.forEach(master => {
      if (master.PhaseAccount && master.PhaseAccount.length > 0) {
        master.PhaseAccount.forEach((phase: any) => {
          if (phase.status === 'pending' || phase.status === 'pending_approval') return
          if (!phase.phaseId || phase.phaseId.trim() === '') return
          
          unified.push({
            id: phase.id,
            number: phase.phaseId,
            name: master.accountName,
            propfirm: master.propFirmName,
            broker: undefined,
            startingBalance: phase.accountSize || master.accountSize,
            accountType: 'prop-firm',
            displayName: `${master.accountName} (${isFundedPhase(master.evaluationType, phase.phaseNumber) ? 'Funded' : 'Phase '+phase.phaseNumber})`,
            tradeCount: 0,
            status: phase.status,
            currentPhase: phase.phaseNumber,
            createdAt: phase.createdAt || master.createdAt,
            isArchived: master.isArchived || false,
            currentPhaseDetails: {
               phaseNumber: phase.phaseNumber,
               status: phase.status,
               phaseId: phase.phaseId,
               masterAccountId: master.id,
               evaluationType: master.evaluationType
            }
          })
        })
      }
    })

    // 4. Apply Filters (Server-side simulation)
    const filtered = unified.filter(acc => {
      if (statusFilter === 'all_inclusive') {
         // Type filter
         if (typeFilter !== 'all' && acc.accountType !== typeFilter) return false
         
         // Search
         if (search) {
            if (
              !acc.displayName?.toLowerCase().includes(search) &&
              !acc.number?.toLowerCase().includes(search) &&
              !acc.broker?.toLowerCase().includes(search)
            ) {
              return false
            }
         }
         return true
      }

      // Archival filter: The 'archived' tab shows ONLY archived. Other tabs EXCLUDE archived.
      if (statusFilter === 'archived') {
         if (!acc.isArchived) return false
      } else {
         if (acc.isArchived) return false
         
         const isPassed = acc.status === 'passed'
         if (isPassed) return false // Implicit global hide for passed phases

         const shouldHideByDefault = acc.status === 'failed' || acc.status === 'pending'
         if (statusFilter !== 'all') {
            if (acc.status !== statusFilter) return false
         } else {
            if (shouldHideByDefault) return false
         }
      }

      // Type filter
      if (typeFilter !== 'all' && acc.accountType !== typeFilter) return false
      
      // Search
      if (search) {
         if (
           !acc.displayName?.toLowerCase().includes(search) &&
           !acc.number?.toLowerCase().includes(search) &&
           !acc.broker?.toLowerCase().includes(search)
         ) {
           return false
         }
      }

      return true
    })

    // 5. Paginate
    const total = filtered.length
    
    // Sort logic (Active funded -> active phase -> live -> failed) can be added here if needed
    // Usually sorted by creation descending, already mostly sorted.
    
    const offset = (page - 1) * limit
    const paginated = filtered.slice(offset, offset + limit)

    // 6. Fetch detailed math data ONLY for the paginated slice
    const liveNumbersToFetch = paginated.filter(a => a.accountType === 'live').map(a => a.number)
    const propPhaseIdsToFetch = paginated.filter(a => a.accountType === 'prop-firm').map(a => a.id)
    const propNumbersToFetch = paginated.filter(a => a.accountType === 'prop-firm').map(a => a.number)
    
    const relevantTrades = await prisma.trade.findMany({
      where: {
         userId: internalUserId,
         OR: [
           { accountNumber: { in: [...liveNumbersToFetch, ...propNumbersToFetch] } },
           { phaseAccountId: { in: propPhaseIdsToFetch } }
         ]
      }
    })

    const relevantIds = paginated.map(p => p.id)
    
    // Check if Transaction exists in Prisma
    let relevantTransactions: any[] = []
    try {
      // Use dynamic access to avoid ts error if it doesn't exist
      if ('transaction' in prisma) {
         relevantTransactions = await (prisma as any).transaction.findMany({
            where: { accountId: { in: relevantIds } }
         })
      }
    } catch {
       // Ignore if not present
    }
    
    // 7. Calculate true equity & grouped counts
    const finalAccounts = paginated.map(acc => {
      let calcTrades = []
      if (acc.accountType === 'prop-firm') {
         calcTrades = relevantTrades.filter(t => {
           if (t.phaseAccountId) {
             return t.phaseAccountId === acc.id
           }
           return t.accountNumber === acc.number
         })
      } else {
         calcTrades = relevantTrades.filter(t => t.accountNumber === acc.number)
      }

      const calculatedEquity = calculateAccountBalance(acc, calcTrades, relevantTransactions, {
         excludeFailedAccounts: false,
         includePayouts: true
      })
      
      const pnl = calculatedEquity - (acc.startingBalance || 0)
      
      // Grouping logic for clean grouped trade counts
      const groupedCount = calcTrades.length > 0 ? buildGroupedTradeCountSummary(calcTrades as any).groupedTradeCount : 0
      
      return {
         ...acc,
         calculatedEquity,
         pnl,
         tradeCount: groupedCount
      }
    })

    return NextResponse.json({ 
       success: true, 
       data: finalAccounts,
       pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
       }
    })

  } catch (error: any) {
    logger.error('/api/v1/accounts failed', error, 'Accounts API')
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const rateLimitResponse = await applyRateLimit(request, apiLimiter)
  if (rateLimitResponse) return rateLimitResponse

  try {
    const identity = await getResolvedUserIdentitySafe()
    if (!identity) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const internalUserId = identity.internalUserId
    const body = await request.json()
    const { name, number, startingBalance, broker } = body

    if (!name || !number || startingBalance === undefined || startingBalance === null || !broker) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: name, number, startingBalance, broker' },
        { status: 400 }
      )
    }

    const numericStartingBalance = Number(startingBalance)
    if (!Number.isFinite(numericStartingBalance)) {
      return NextResponse.json(
        { success: false, error: 'Starting balance must be a valid number' },
        { status: 400 }
      )
    }

    const existingAccount = await prisma.account.findFirst({
      where: {
        number,
        userId: internalUserId,
      }
    })

    if (existingAccount) {
      return NextResponse.json(
        { success: false, error: 'Account number already exists' },
        { status: 409 }
      )
    }

    const account = await prisma.account.create({
      data: {
        id: crypto.randomUUID(),
        number,
        name,
        startingBalance: numericStartingBalance,
        broker,
        userId: internalUserId
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        ...account,
        accountType: 'live',
        displayName: account.name || account.number
      }
    })
  } catch (error: any) {
    console.error('[API] /api/v1/accounts POST error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
