import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getResolvedUserIdentitySafe } from '@/server/user-identity'
import { applyRateLimit, apiLimiter } from '@/lib/rate-limiter'

function getPhaseLabel(evaluationType: string, phaseNumber: number) {
  switch (evaluationType) {
    case 'Two Step':
      return phaseNumber >= 3 ? 'Funded' : `Phase ${phaseNumber}`
    case 'One Step':
      return phaseNumber >= 2 ? 'Funded' : `Phase ${phaseNumber}`
    case 'Instant':
      return phaseNumber >= 1 ? 'Funded' : `Phase ${phaseNumber}`
    default:
      return `Phase ${phaseNumber}`
  }
}

export async function GET(request: NextRequest) {
  const rateLimitResponse = await applyRateLimit(request, apiLimiter)
  if (rateLimitResponse) return rateLimitResponse

  try {
    const identity = await getResolvedUserIdentitySafe()
    if (!identity) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const internalUserId = identity.internalUserId

    const [liveAccounts, masterAccounts, instrumentRows] = await Promise.all([
      prisma.account.findMany({
        where: { userId: internalUserId },
        select: {
          id: true,
          number: true,
          name: true,
          isArchived: true,
        },
      }),
      prisma.masterAccount.findMany({
        where: { userId: internalUserId },
        select: {
          id: true,
          accountName: true,
          propFirmName: true,
          evaluationType: true,
          isArchived: true,
          PhaseAccount: {
            select: {
              id: true,
              phaseNumber: true,
              phaseId: true,
              status: true,
            },
            orderBy: { phaseNumber: 'asc' },
          },
        },
      }),
      prisma.trade.findMany({
        where: { userId: internalUserId },
        select: { instrument: true },
        distinct: ['instrument'],
      }),
    ])

    const live = liveAccounts.map((account) => ({
      id: account.id,
      number: account.number,
      name: account.name || account.number,
      displayName: account.name || account.number,
      accountType: 'live' as const,
      status: 'active',
      isArchived: !!account.isArchived,
    }))

    const propPhases = masterAccounts.flatMap((master) =>
      master.PhaseAccount.map((phase) => ({
        id: phase.id,
        number: phase.phaseId || `PHASE-${phase.phaseNumber}`,
        name: master.accountName,
        displayName: `${master.accountName} (${getPhaseLabel(master.evaluationType, phase.phaseNumber)})`,
        accountType: 'prop-firm' as const,
        status: phase.status,
        isArchived: !!master.isArchived,
        masterAccountId: master.id,
        propFirmName: master.propFirmName,
      }))
    )

    const accounts = [...live, ...propPhases].sort((a, b) =>
      a.displayName.localeCompare(b.displayName)
    )

    const instruments = instrumentRows
      .map((row) => row.instrument)
      .filter((instrument): instrument is string => !!instrument && instrument.trim().length > 0)
      .sort((a, b) => a.localeCompare(b))

    return NextResponse.json({
      success: true,
      data: {
        accounts,
        instruments,
      },
    })
  } catch (error) {
    console.error('[API] /api/v1/data/export/options error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to load export options' },
      { status: 500 }
    )
  }
}
