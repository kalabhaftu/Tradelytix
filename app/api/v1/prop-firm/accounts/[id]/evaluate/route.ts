/**
 * Phase Evaluation API
 * POST /api/prop-firm/accounts/[id]/evaluate - Evaluate current phase status
 */

import { NextRequest, NextResponse } from 'next/server'
import { getResolvedUserIdentitySafe } from '@/server/user-identity'
import { PhaseEvaluationEngine } from '@/lib/prop-firm/phase-evaluation-engine'
import { applyRateLimit, apiLimiter } from '@/lib/rate-limiter'
import { logger } from '@/lib/logger'
import { revalidateTag } from 'next/cache'
import { prisma } from '@/lib/prisma'

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
    const masterAccount = await prisma.masterAccount.findFirst({
      where: {
        id: masterAccountId,
        userId: internalUserId,
        status: { not: 'failed' }
      },
      include: {
        PhaseAccount: {
          where: { status: 'active' },
          orderBy: { phaseNumber: 'asc' },
          take: 1
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
      await prisma.$transaction(async (tx) => {
        // Mark phase as failed
        await tx.phaseAccount.update({
          where: { id: activePhase.id },
          data: {
            status: 'failed',
            endDate: new Date()
          }
        })

        // Mark master account as failed
        await tx.masterAccount.update({
          where: { id: masterAccountId },
          data: {
            status: 'failed'
          }
        })
      })
      
      // Invalidate cache when account status changes
      revalidateTag(`accounts-${internalUserId}`)
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
    const masterAccount = await prisma.masterAccount.findFirst({
      where: {
        id: masterAccountId,
        userId: internalUserId
      },
      include: {
        PhaseAccount: {
          where: { status: 'active' },
          orderBy: { phaseNumber: 'asc' },
          take: 1
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