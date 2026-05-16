import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/server/admin-auth'
import { applyRateLimit, adminLimiter } from '@/lib/rate-limiter'
import { getErrorStatusCode, sanitizeErrorMessage } from '@/lib/api-error'

export async function GET(req: NextRequest) {
  const rl = await applyRateLimit(req, adminLimiter)
  if (rl) return rl
  try {
    await requireAdmin()

    const [totalTrades, stopLossTrades, excursionTrades, taggedTrades, modelTrades, brokenRules, malformedTrades, staleImports] = await Promise.all([
    prisma.trade.count(),
    prisma.trade.count({ where: { OR: [{ stopLoss: { not: null } }, { stopLossValue: { not: null } }] } }),
    prisma.trade.count({ where: { OR: [{ mae: { not: null } }, { mfe: { not: null } }] } }),
    prisma.trade.count({ where: { tags: { isEmpty: false } } }),
    prisma.trade.count({ where: { modelId: { not: null } } }),
    prisma.trade.count({ where: { ruleBroken: true } }),
    prisma.trade.count({ where: { OR: [{ instrument: '' }, { entryDate: '' }, { closeDate: '' }] } }),
    prisma.importJob.count({ where: { status: { in: ['failed', 'cancelled'] } } }).catch(() => 0),
  ])

    const pct = (value: number) => totalTrades > 0 ? Math.round((value / totalTrades) * 100) : 0

    return NextResponse.json({
      success: true,
      data: {
        totalTrades,
        stopLossCoverage: { count: stopLossTrades, percentage: pct(stopLossTrades) },
        excursionCoverage: { count: excursionTrades, percentage: pct(excursionTrades) },
        tagCoverage: { count: taggedTrades, percentage: pct(taggedTrades) },
        playbookCoverage: { count: modelTrades, percentage: pct(modelTrades) },
        brokenRules,
        malformedTrades,
        staleImports,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: sanitizeErrorMessage(error) }, { status: getErrorStatusCode(error) })
  }
}
