import { NextRequest, NextResponse } from 'next/server'
import { applyRateLimit, importLimiter } from '@/lib/rate-limiter'
import { getResolvedUserIdentitySafe } from '@/server/user-identity'
import { prisma } from '@/lib/prisma'
import { createTradeImportJob } from '@/server/trade-import-jobs'
import { createErrorResponse } from '@/lib/api-response'
import { z } from 'zod'

const MAX_TRADE_IMPORT_ROWS = 5000
const MAX_TRADE_IMPORT_BODY_BYTES = 2 * 1024 * 1024

const tradeImportSchema = z.object({
  accountId: z.string().trim().min(1).max(128),
  trades: z.array(z.record(z.string(), z.unknown())).min(1).max(MAX_TRADE_IMPORT_ROWS),
}).strict()

export async function GET(request: NextRequest) {
  const rateLimitResponse = await applyRateLimit(request, importLimiter)
  if (rateLimitResponse) return rateLimitResponse

  try {
    const identity = await getResolvedUserIdentitySafe()
    if (!identity) {
      return createErrorResponse('Unauthorized', 401)
    }

    const jobs = await prisma.importJob.findMany({
      where: { userId: identity.internalUserId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        stage: true,
        progress: true,
        totalItems: true,
        processedItems: true,
        importedCount: true,
        skippedCount: true,
        fileName: true,
        fileSize: true,
        error: true,
        cancelRequested: true,
        createdAt: true,
        completedAt: true,
      },
    })

    return NextResponse.json({ success: true, data: jobs })
  } catch (error) {
    return createErrorResponse('Failed to fetch import jobs', 500)
  }
}

export async function POST(request: NextRequest) {
  const rateLimitResponse = await applyRateLimit(request, importLimiter)
  if (rateLimitResponse) return rateLimitResponse

  try {
    const identity = await getResolvedUserIdentitySafe()
    if (!identity) {
      return createErrorResponse('Unauthorized', 401)
    }

    const contentLength = Number(request.headers.get('content-length') || 0)
    if (contentLength > MAX_TRADE_IMPORT_BODY_BYTES) {
      return createErrorResponse('Trade import payload is too large', 413)
    }

    const body = await request.json().catch(() => null)
    const parsed = tradeImportSchema.safeParse(body)

    if (!parsed.success) {
      return createErrorResponse('Validation failed', 400, parsed.error.flatten(), 'VALIDATION_ERROR')
    }

    const job = await createTradeImportJob({
      internalUserId: identity.internalUserId,
      accountId: parsed.data.accountId,
      trades: parsed.data.trades,
    })

    return NextResponse.json({ success: true, job }, { status: 201 })
  } catch (error) {
    return createErrorResponse('Failed to create trade import job', 500)
  }
}
