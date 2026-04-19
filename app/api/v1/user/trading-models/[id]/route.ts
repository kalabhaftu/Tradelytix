import { NextRequest, NextResponse } from 'next/server'
import { getResolvedUserIdentitySafe } from '@/server/user-identity'
import { applyRateLimit, apiLimiter } from '@/lib/rate-limiter'
import { logger } from '@/lib/logger'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const ruleSchema = z.object({
  text: z.string(),
  category: z.enum(['entry', 'exit', 'risk', 'general'])
})

const tradingModelSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  rules: z.array(ruleSchema).optional(),
  notes: z.string().nullable().optional(),
})

// PATCH - Update trading model
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const rateLimitRes = await applyRateLimit(request, apiLimiter)
  if (rateLimitRes) return rateLimitRes

  try {
    const identity = await getResolvedUserIdentitySafe()
    if (!identity) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = identity.internalUserId

    const body = await request.json()
    const validated = tradingModelSchema.parse(body)

    // Verify model belongs to user
    const existing = await prisma.tradingModel.findUnique({
      where: { id: params.id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Model not found' }, { status: 404 })
    }

    if (existing.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // If name is being changed, check for duplicates
    if (validated.name && validated.name !== existing.name) {
      const duplicate = await prisma.tradingModel.findUnique({
        where: {
          userId_name: {
            userId,
            name: validated.name,
          },
        },
      })

      if (duplicate) {
        return NextResponse.json(
          { error: 'A model with this name already exists' },
          { status: 400 }
        )
      }
    }

    const model = await prisma.tradingModel.update({
      where: { id: params.id },
      data: {
        ...(validated.name && { name: validated.name }),
        ...(validated.rules !== undefined && { rules: validated.rules }),
        ...(validated.notes !== undefined && { notes: validated.notes }),
      },
    })

    return NextResponse.json({ success: true, model })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to update model' },
      { status: 500 }
    )
  }
}

// DELETE - Delete trading model
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const rateLimitRes = await applyRateLimit(request, apiLimiter)
  if (rateLimitRes) return rateLimitRes

  try {
    const identity = await getResolvedUserIdentitySafe()
    if (!identity) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = identity.internalUserId

    // Verify model belongs to user
    const existing = await prisma.tradingModel.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { Trade: true },
        },
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Model not found' }, { status: 404 })
    }

    if (existing.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if model is used in trades
    const tradesCount = existing._count.Trade

    // Delete the model (trades will have modelId set to null due to onDelete: SetNull)
    await prisma.tradingModel.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      success: true,
      message: tradesCount > 0 
        ? `Model deleted. ${tradesCount} trade(s) no longer reference this model.`
        : 'Model deleted successfully',
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete model' },
      { status: 500 }
    )
  }
}
