import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getResolvedUserIdentity } from '@/server/user-identity'
import { nanoid } from 'nanoid'
import { z } from 'zod'
import { applyRateLimit, apiLimiter } from '@/lib/rate-limiter'
import { calculateReportStatistics } from '@/lib/statistics/report-statistics'
import { createErrorResponse, createSuccessResponse } from '@/lib/api-response'
import { logger } from '@/lib/logger'
import { getWebsiteURL } from '@/server/auth'

export const dynamic = 'force-dynamic'

function generateSlug(): string {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyz'
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

const boundedString = (max: number) => z.string().trim().max(max).optional().nullable()
const dateString = z.string().date().optional().nullable()

const shareReportSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  dateFrom: dateString,
  dateTo: dateString,
  accountId: boundedString(128),
  accountNumbers: z.array(z.string().trim().min(1).max(128)).max(50).optional(),
  symbol: boundedString(32),
  session: boundedString(64),
  outcome: boundedString(32),
  strategy: boundedString(128),
  ruleBroken: z.boolean().optional().nullable(),
  snapshot: z.record(z.string(), z.unknown()).optional(),
  expiresInDays: z.coerce.number().int().min(1).max(365).optional().nullable(),
}).strict()

export async function POST(req: NextRequest) {
  const rl = await applyRateLimit(req, apiLimiter)
  if (rl) return rl

  try {
    const { internalUserId } = await getResolvedUserIdentity()
    const body = await req.json().catch(() => null)
    const parsed = shareReportSchema.safeParse(body)

    if (!parsed.success) {
      return createErrorResponse('Validation failed', 400, parsed.error.flatten(), 'VALIDATION_ERROR')
    }

    const payload = parsed.data
    const sharingPolicy = await (prisma as any).adminSharingPolicy.findUnique({ where: { key: 'default' } }).catch(() => null)

    if (sharingPolicy?.publicSharingEnabled === false) {
      return createErrorResponse('Public report sharing is currently disabled', 403)
    }

    if (payload.dateFrom && payload.dateTo && payload.dateFrom > payload.dateTo) {
      return createErrorResponse('dateFrom must be before dateTo', 400, undefined, 'INVALID_DATE_RANGE')
    }

    const serverSnapshot = await calculateReportStatistics({
      userId: internalUserId,
      accountId: payload.accountId || undefined,
      accountNumbers: payload.accountNumbers,
      dateFrom: payload.dateFrom || undefined,
      dateTo: payload.dateTo || undefined,
      symbol: payload.symbol || undefined,
      session: payload.session || undefined,
      outcome: payload.outcome || undefined,
      strategy: payload.strategy || undefined,
      ruleBroken: typeof payload.ruleBroken === 'boolean' ? (payload.ruleBroken ? 'broken' : 'not-broken') : undefined,
    })

    const snapshotPayload = JSON.parse(JSON.stringify({
      version: 2,
      generatedAt: new Date().toISOString(),
      filters: {
        accountId: payload.accountId || null,
        accountNumbers: payload.accountNumbers || [],
        dateFrom: payload.dateFrom || null,
        dateTo: payload.dateTo || null,
        symbol: payload.symbol || null,
        session: payload.session || null,
        outcome: payload.outcome || null,
        strategy: payload.strategy || null,
        ruleBroken: payload.ruleBroken ?? null,
      },
      reportData: serverSnapshot,
      legacySnapshot: payload.snapshot || null,
    }))

    const slug = generateSlug()
    const policyDays = sharingPolicy?.defaultExpirationDays || null
    const resolvedExpirationDays = payload.expiresInDays || policyDays
    const expiresAt = resolvedExpirationDays
      ? new Date(Date.now() + resolvedExpirationDays * 24 * 60 * 60 * 1000)
      : null

    if (sharingPolicy?.requireExpiration && !expiresAt) {
      return createErrorResponse('Shared reports require an expiration date', 400)
    }

    const shared = await prisma.sharedReport.create({
      data: {
        id: nanoid(),
        userId: internalUserId,
        slug,
        title: payload.title || 'Trading Report',
        dateFrom: payload.dateFrom || null,
        dateTo: payload.dateTo || null,
        accountId: payload.accountId || null,
        snapshot: snapshotPayload,
        isPublic: true,
        expiresAt,
      },
    })

    const appUrl = await getWebsiteURL()
    return createSuccessResponse({ slug, url: new URL(`/reports/shared/${slug}`, appUrl).toString(), id: shared.id })
  } catch (err) {
    logger.error('Reports share creation failed', {}, 'api')
    return createErrorResponse('Internal server error', 500)
  }
}

export async function GET(req: NextRequest) {
  const rl = await applyRateLimit(req, apiLimiter)
  if (rl) return rl

  try {
    const { internalUserId } = await getResolvedUserIdentity()
    const reports = await prisma.sharedReport.findMany({
      where: { userId: internalUserId },
      select: {
        id: true,
        slug: true,
        title: true,
        dateFrom: true,
        dateTo: true,
        viewCount: true,
        isPublic: true,
        expiresAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })
    return createSuccessResponse({ reports })
  } catch (err) {
    logger.error('Reports share list failed', {}, 'api')
    return createErrorResponse('Internal server error', 500)
  }
}
