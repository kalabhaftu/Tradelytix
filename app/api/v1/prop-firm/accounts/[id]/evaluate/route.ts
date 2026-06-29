import { NextRequest, NextResponse } from 'next/server'
import { getResolvedUserIdentitySafe } from '@/server/user-identity'
import { PhaseEvaluationEngine } from '@/lib/prop-firm/phase-evaluation-engine'
import { applyRateLimit, apiLimiter } from '@/lib/rate-limiter'
import { logger } from '@/lib/logger'
import { revalidateTag } from 'next/cache'
import { db } from '@/lib/db/client'
import * as schema from '@/lib/db/schema'
import { eq, and, ne, asc } from 'drizzle-orm'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const rateLimitRes = await applyRateLimit(request, apiLimiter)
  if (rateLimitRes) return rateLimitRes

  try {
    const identity = await getResolvedUserIdentitySafe()
    if (!identity) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }
    const internalUserId = identity.internalUserId

    const { id: masterAccountId } = await params
    // ID is pure masterAccountId (UUID), not composite

    // Verify the master account belongs to the user
    const masterAccount = await db.query.MasterAccount.findFirst({
      where: (table, { eq, ne }) => and(
        eq(table.id, masterAccountId),
        eq(table.userId, internalUserId),
        ne(table.status, 'failed')
      ),
      with: {
        PhaseAccount: {
          where: (table, { eq }) => eq(table.status, 'active'),
          orderBy: (table, { asc }) => [asc(table.phaseNumber)],
          limit: 1
        }
      }
    })

    if (!masterAccount) {
      return NextResponse.json(
        { success: false, error: 'Master account not found or unauthorized' },
        { status: 404 }
      )
    }

    const activePhase = masterAccount.PhaseAccount[0]
    if (!activePhase) {
      return NextResponse.json(
        { success: false, error: 'No active phase found' },
        { status: 400 }
      )
    }

    // Evaluate the current phase using the new engine
    const evaluation = await PhaseEvaluationEngine.evaluatePhase(
      masterAccountId,
      activePhase.id
    )

    // If the phase failed, update the account status
    if (evaluation.isFailed) {
      await db.transaction(async (tx) => {
        // Mark phase as failed
        await tx.update(schema.PhaseAccount)
          .set({ status: 'failed', endDate: new Date() })
          .where(eq(schema.PhaseAccount.id, activePhase.id))

        // Mark master account as failed
        await tx.update(schema.MasterAccount)
          .set({ status: 'failed' })
          .where(eq(schema.MasterAccount.id, masterAccountId))
      })
      
      // Invalidate cache when account status changes
      revalidateTag(`accounts-${internalUserId}`, 'max')
    }

    return NextResponse.json({
      success: true,
      data: {
        masterAccountId,
        phaseAccountId: activePhase.id,
        phaseNumber: activePhase.phaseNumber,
        evaluation
      }
    })

  } catch (error: any) {
    logger.error('POST /api/v1/prop-firm/accounts/[id]/evaluate', { error: error?.message }, 'api')
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to evaluate phase'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const rateLimitRes = await applyRateLimit(request, apiLimiter)
  if (rateLimitRes) return rateLimitRes

  try {
    const identity = await getResolvedUserIdentitySafe()
    if (!identity) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }
    const internalUserId = identity.internalUserId

    const { id: masterAccountId } = await params
    // ID is pure masterAccountId (UUID), not composite

    // Get the current evaluation status without triggering updates
    const masterAccount = await db.query.MasterAccount.findFirst({
      where: (table, { eq }) => and(
        eq(table.id, masterAccountId),
        eq(table.userId, internalUserId)
      ),
      with: {
        PhaseAccount: {
          where: (table, { eq }) => eq(table.status, 'active'),
          orderBy: (table, { asc }) => [asc(table.phaseNumber)],
          limit: 1
        }
      }
    })

    if (!masterAccount) {
      return NextResponse.json(
        { success: false, error: 'Master account not found' },
        { status: 404 }
      )
    }

    const activePhase = masterAccount.PhaseAccount[0]
    if (!activePhase) {
      return NextResponse.json(
        { success: false, error: 'No active phase found' },
        { status: 400 }
      )
    }

    // Evaluate the current phase using the new engine
    const evaluation = await PhaseEvaluationEngine.evaluatePhase(
      masterAccountId,
      activePhase.id
    )

    return NextResponse.json({
      success: true,
      data: {
        masterAccountId,
        phaseAccountId: activePhase.id,
        phaseNumber: activePhase.phaseNumber,
        evaluation
      }
    })

  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get evaluation status'
      },
      { status: 500 }
    )
  }
}