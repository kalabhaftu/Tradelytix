import { prisma } from '@/lib/prisma'

/**
 * Anchor Service
 * Handles creation of daily equity snapshots (anchors) for drawdown tracking.
 */

/**
 * Create daily anchor for a specific phase account
 */
export async function createDailyAnchor(phaseAccountId: string, timezone: string, forceDate?: Date) {
  const today = forceDate || new Date()
  
  // Get the date at midnight in the user's timezone
  const dateString = today.toLocaleDateString('en-CA', { timeZone: timezone }) // YYYY-MM-DD format
  const anchorDate = new Date(dateString + 'T00:00:00.000Z')

  // Check if anchor already exists for today
  const existingAnchor = await prisma.dailyAnchor.findUnique({
    where: {
      phaseAccountId_date: {
        phaseAccountId,
        date: anchorDate
      }
    }
  })

  if (existingAnchor) {
    return { created: false, reason: 'already_exists', anchor: existingAnchor }
  }

  // Get phase account with trades
  const phaseAccount = await prisma.phaseAccount.findFirst({
    where: { id: phaseAccountId },
    include: {
      MasterAccount: true,
      Trade: {
        where: { phaseAccountId },
        select: { pnl: true, commission: true }
      }
    }
  })

  if (!phaseAccount) {
    return { created: false, reason: 'phase_not_found' }
  }

  // Calculate current equity for anchor
  const totalPnL = phaseAccount.Trade.reduce(
    (sum: number, trade: { pnl: number }) =>
      sum + Number(trade.pnl || 0),
    0
  )
  const anchorEquity = (phaseAccount.accountSize || phaseAccount.MasterAccount.accountSize) + totalPnL

  // Create the anchor
  const anchor = await prisma.dailyAnchor.create({
    data: {
      id: crypto.randomUUID(),
      phaseAccountId,
      date: anchorDate,
      anchorEquity
    }
  })

  return { created: true, anchor }
}

/**
 * Bulk create daily anchors for all active phase accounts
 */
export async function createAllDailyAnchors() {
  const results = {
    totalPhases: 0,
    anchorsCreated: 0,
    anchorsSkipped: 0,
    errors: [] as string[]
  }

  try {
    // Get all active phase accounts
    const activePhases = await prisma.phaseAccount.findMany({
      where: {
        status: 'active'
      },
      include: {
        MasterAccount: {
          include: {
            User: {
              select: {
                id: true,
                timezone: true
              }
            }
          }
        }
      }
    })

    results.totalPhases = activePhases.length

    // Create anchors for each active phase
    for (const phase of activePhases) {
      try {
        const timezone = phase.MasterAccount.User.timezone || 'UTC'
        const result = await createDailyAnchor(phase.id, timezone)
        
        if (result.created) {
          results.anchorsCreated++
        } else {
          results.anchorsSkipped++
        }
      } catch (error) {
        const errorMsg = `Phase ${phase.id}: anchor creation failed`
        results.errors.push(errorMsg)
      }
    }
  } catch (err) {
    results.errors.push(`General Anchor Error: ${err instanceof Error ? err.message : 'unknown error'}`)
  }

  return results
}
