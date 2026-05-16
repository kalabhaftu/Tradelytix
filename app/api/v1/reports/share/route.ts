import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getResolvedUserIdentity } from '@/server/user-identity'
import { nanoid } from 'nanoid'
import { applyRateLimit, apiLimiter } from '@/lib/rate-limiter'
import { calculateReportStatistics } from '@/lib/statistics/report-statistics'

export const dynamic = 'force-dynamic'

function generateSlug(): string {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyz'
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export async function POST(req: NextRequest) {
  const rl = await applyRateLimit(req, apiLimiter)
  if (rl) return rl

  try {
    const { internalUserId } = await getResolvedUserIdentity()
    const body = await req.json()
    const { title, dateFrom, dateTo, accountId, accountNumbers, snapshot, expiresInDays } = body
    const sharingPolicy = await (prisma as any).adminSharingPolicy.findUnique({ where: { key: 'default' } }).catch(() => null)

    if (sharingPolicy?.publicSharingEnabled === false) {
      return NextResponse.json({ error: 'Public report sharing is currently disabled' }, { status: 403 })
    }

    const serverSnapshot = await calculateReportStatistics({
      userId: internalUserId,
      accountId: accountId || undefined,
      accountNumbers: Array.isArray(accountNumbers) ? accountNumbers : undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      symbol: body.symbol || undefined,
      session: body.session || undefined,
      outcome: body.outcome || undefined,
      strategy: body.strategy || undefined,
      ruleBroken: body.ruleBroken || undefined,
    })

    const snapshotPayload = JSON.parse(JSON.stringify({
      version: 2,
      generatedAt: new Date().toISOString(),
      filters: {
        accountId: accountId || null,
        accountNumbers: Array.isArray(accountNumbers) ? accountNumbers : [],
        dateFrom: dateFrom || null,
        dateTo: dateTo || null,
        symbol: body.symbol || null,
        session: body.session || null,
        outcome: body.outcome || null,
        strategy: body.strategy || null,
        ruleBroken: body.ruleBroken || null,
      },
      reportData: serverSnapshot,
      legacySnapshot: snapshot && typeof snapshot === 'object' ? snapshot : null,
    }))

    const slug = generateSlug()
    const policyDays = sharingPolicy?.defaultExpirationDays || null
    const resolvedExpirationDays = expiresInDays || policyDays
    const expiresAt = resolvedExpirationDays
      ? new Date(Date.now() + resolvedExpirationDays * 24 * 60 * 60 * 1000)
      : null

    if (sharingPolicy?.requireExpiration && !expiresAt) {
      return NextResponse.json({ error: 'Shared reports require an expiration date' }, { status: 400 })
    }

    const shared = await prisma.sharedReport.create({
      data: {
        id: nanoid(),
        userId: internalUserId,
        slug,
        title: title || 'Trading Report',
        dateFrom: dateFrom || null,
        dateTo: dateTo || null,
        accountId: accountId || null,
        snapshot: snapshotPayload,
        isPublic: true,
        expiresAt,
      },
    })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
    const url = `${appUrl}/reports/shared/${slug}`
    return NextResponse.json({ slug, url, id: shared.id })
  } catch (err) {
    console.error('[Reports Share POST]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
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
    return NextResponse.json({ reports })
  } catch (err) {
    console.error('[Reports Share GET]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
