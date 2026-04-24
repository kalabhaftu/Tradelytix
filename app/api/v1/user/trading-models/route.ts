import { NextRequest, NextResponse } from 'next/server'
import { getResolvedUserIdentitySafe } from '@/server/user-identity'
import { applyRateLimit, apiLimiter } from '@/lib/rate-limiter'
import { logger } from '@/lib/logger'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { calculateWinRate, classifyOutcome, getBreakEvenThreshold } from '@/lib/metrics/outcome'
import { getRuntimeBreakEvenThreshold } from '@/server/user-settings'

const ruleSchema = z.object({
  text: z.string(),
  category: z.enum(['entry', 'exit', 'risk', 'general'])
})

const tradingModelSchema = z.object({
  name: z.string().min(1, 'Model name is required').max(100),
  rules: z.array(ruleSchema).default([]),
  notes: z.string().nullable().optional(),
})

// GET - List all trading models for user
export async function GET(request: NextRequest) {
  const rateLimitRes = await applyRateLimit(request, apiLimiter)
  if (rateLimitRes) return rateLimitRes

  try {
    const identity = await getResolvedUserIdentitySafe()
    if (!identity) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = identity.internalUserId

    const [models, breakEvenThreshold] = await Promise.all([
      prisma.tradingModel.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: {
          Trade: {
            select: {
              pnl: true,
              selectedRules: true
            }
          }
        }
      }),
      getRuntimeBreakEvenThreshold(userId)
    ])

    // Parse rules from JSON to array and calculate stats
    const formattedModels = models.map((model: (typeof models)[number]) => {
      const trades = model.Trade || []
      const tradeCount = trades.length

      const modelRules = typeof model.rules === 'string'
        ? JSON.parse(model.rules)
        : Array.isArray(model.rules)
          ? model.rules
          : []

      // Initialize rule adherence map
      const ruleAdherence: Record<string, { followed: number; total: number }> = {}
      modelRules.forEach((rule: any) => {
        const text = typeof rule === 'string' ? rule : rule.text
        ruleAdherence[text] = { followed: 0, total: 0 }
      })

      let totalPnL = 0
      let winCount = 0
      let lossCount = 0
      let breakEvenCount = 0

      trades.forEach((trade: (typeof trades)[number]) => {
        const netPnL = Number(trade.pnl || 0)
        totalPnL += netPnL

        const outcome = classifyOutcome(netPnL, breakEvenThreshold)
        if (outcome === 'win') {
          winCount++
        } else if (outcome === 'loss') {
          lossCount++
        } else {
          breakEvenCount++
        }

        // Track rule adherence
        const selectedRules = Array.isArray(trade.selectedRules) ? trade.selectedRules : []
        modelRules.forEach((rule: any) => {
          const text = typeof rule === 'string' ? rule : rule.text
          ruleAdherence[text].total++
          if (selectedRules.includes(text)) {
            ruleAdherence[text].followed++
          }
        })
      })

      // Calculate win rate (excluding break-even from denominator)
      const winRate = calculateWinRate(winCount, lossCount)

      // Overall adherence rate
      let totalMet = 0
      let totalPossible = 0
      Object.values(ruleAdherence).forEach(stat => {
        totalMet += stat.followed
        totalPossible += stat.total
      })
      const avgAdherence = totalPossible > 0 ? (totalMet / totalPossible) * 100 : 0

      // Remove Trade array from response to keep it light
      const { Trade, ...modelData } = model

      return {
        ...modelData,
        rules: modelRules,
        stats: {
          tradeCount,
          totalPnL,
          winRate,
          winCount,
          lossCount,
          breakEvenCount,
          avgAdherence,
          ruleAdherence
        }
      }
    })

    return NextResponse.json({ success: true, models: formattedModels })
  } catch (error) {
    console.error('Error fetching trading models:', error)
    return NextResponse.json(
      { error: 'Failed to fetch models' },
      { status: 500 }
    )
  }
}

// POST - Create new trading model
export async function POST(request: NextRequest) {
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

    // Check if model with same name already exists
    const existing = await prisma.tradingModel.findUnique({
      where: {
        userId_name: {
          userId,
          name: validated.name,
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'A model with this name already exists' },
        { status: 400 }
      )
    }

    const model = await prisma.tradingModel.create({
      data: {
        id: randomUUID(),
        userId,
        name: validated.name,
        rules: validated.rules,
        notes: validated.notes,
      },
    })

    return NextResponse.json({ success: true, model }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to create model' },
      { status: 500 }
    )
  }
}
