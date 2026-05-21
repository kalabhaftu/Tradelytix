import { NextRequest, NextResponse } from 'next/server'
import { getResolvedUserIdentitySafe } from '@/server/user-identity'
import { applyRateLimit, apiLimiter } from '@/lib/rate-limiter'
import { logger } from '@/lib/logger'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const ruleCategorySchema = z.enum(['entry', 'target', 'confirmation', 'confluence', 'exit', 'risk', 'general'])

const ruleSchema = z.object({
  text: z.string(),
  category: ruleCategorySchema
})

const tradingModelSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  rules: z.array(ruleSchema).optional(),
  setups: z.array(z.string()).optional(),
  notes: z.string().nullable().optional(),
})

type TradingModelRouteContext = {
  params: { id?: string } | Promise<{ id?: string }>
}

async function getTradingModelId(context: TradingModelRouteContext) {
  const params = await context.params
  return typeof params?.id === 'string' && params.id.trim() ? params.id : null
}

// PATCH - Update trading model
export async function PATCH(
  request: NextRequest,
  context: TradingModelRouteContext
) {
  const rateLimitRes = await applyRateLimit(request, apiLimiter)
  if (rateLimitRes) return rateLimitRes

  try {
    const id = await getTradingModelId(context)
    if (!id) {
      logger.warn('Missing trading model id for PATCH')
      return NextResponse.json({ error: 'Missing trading model id' }, { status: 400 })
    }

    const identity = await getResolvedUserIdentitySafe()
    if (!identity) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = identity.internalUserId

    const body = await request.json()
    const validated = tradingModelSchema.parse(body)

    // Verify model belongs to user
    const existing = await prisma.tradingModel.findUnique({
      where: { id },
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
      where: { id },
      data: {
        ...(validated.name && { name: validated.name }),
        ...(validated.rules !== undefined && { rules: validated.rules }),
        ...(validated.setups !== undefined && { setups: validated.setups }),
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
  context: TradingModelRouteContext
) {
  const rateLimitRes = await applyRateLimit(request, apiLimiter)
  if (rateLimitRes) return rateLimitRes

  try {
    const id = await getTradingModelId(context)
    if (!id) {
      logger.warn('Missing trading model id for DELETE')
      return NextResponse.json({ error: 'Missing trading model id' }, { status: 400 })
    }

    const identity = await getResolvedUserIdentitySafe()
    if (!identity) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = identity.internalUserId

    // Verify model belongs to user
    const existing = await prisma.tradingModel.findUnique({
      where: { id },
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
      where: { id },
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
