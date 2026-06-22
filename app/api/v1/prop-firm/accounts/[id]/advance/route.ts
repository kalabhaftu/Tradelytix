import { NextRequest, NextResponse } from 'next/server'
import { getResolvedUserIdentitySafe } from '@/server/user-identity'
import { applyRateLimit, apiLimiter } from '@/lib/rate-limiter'
import { logger } from '@/lib/logger'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { revalidateTag } from 'next/cache'
import { isFundedPhaseForEvaluation } from '@/lib/prop-firm/reporting'

interface RouteParams {
  params: Promise<{ id: string }>
}

const AdvanceSchema = z.object({
  nextPhaseId: z.string().min(1, 'Next phase ID is required'),
})

function isFundedPhase(evaluationType: string, phaseNumber: number): boolean {
  return isFundedPhaseForEvaluation(evaluationType, phaseNumber)
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
    const body = await request.json()
    const { nextPhaseId } = AdvanceSchema.parse(body)

    const masterAccount = await prisma.masterAccount.findFirst({
      where: {
        id: masterAccountId,
        userId: internalUserId,
        status: { not: 'failed' },
      },
      include: {
        PhaseAccount: { orderBy: { phaseNumber: 'asc' } },
      },
    })

    if (!masterAccount) {
      return NextResponse.json(
        { success: false, error: 'Master account not found or unauthorized' },
        { status: 404 }
      )
    }

    const currentPhase = masterAccount.PhaseAccount.find(
      (phase: any) =>
        phase.phaseNumber === masterAccount.currentPhase &&
        (phase.status === 'active' || phase.status === 'pending_approval')
    )

    if (!currentPhase) {
      return NextResponse.json(
        { success: false, error: 'No active or pending approval phase found to advance from' },
        { status: 400 }
      )
    }

    const nextPhaseNumber = masterAccount.currentPhase + 1

    const nextPhase = masterAccount.PhaseAccount.find(
      (phase: any) => phase.phaseNumber === nextPhaseNumber
    )

    if (!nextPhase) {
      return NextResponse.json(
        { success: false, error: 'Next phase not found' },
        { status: 400 }
      )
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.phaseAccount.update({
        where: { id: currentPhase.id },
        data: {
          status: 'passed',
          endDate: new Date(),
        },
      })

      const updatedNextPhase = await tx.phaseAccount.update({
        where: { id: nextPhase.id },
        data: {
          status: 'active',
          phaseId: nextPhaseId,
          startDate: new Date(),
        },
      })

      const isTransitioningToFunded = isFundedPhase(masterAccount.evaluationType, nextPhaseNumber)

      const updatedMasterAccount = await tx.masterAccount.update({
        where: { id: masterAccountId },
        data: {
          currentPhase: nextPhaseNumber,
          ...(isTransitioningToFunded && { status: 'funded' }),
        },
      })

      return {
        masterAccount: updatedMasterAccount,
        previousPhase: currentPhase,
        currentPhase: updatedNextPhase,
      }
    })

    const nextPhaseName = isFundedPhase(masterAccount.evaluationType, nextPhaseNumber)
      ? 'Funded'
      : `Phase ${nextPhaseNumber}`

    revalidateTag(`accounts-${internalUserId}`, 'max')

    return NextResponse.json({
      success: true,
      data: result,
      message: `Successfully advanced to ${nextPhaseName}`,
    })
  } catch (error) {
    logger.error('Phase advance error', error, 'Prop-firm Advance')

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: error.errors,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to advance phase',
      },
      { status: 500 }
    )
  }
}
