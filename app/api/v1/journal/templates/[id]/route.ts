import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getResolvedUserIdentitySafe } from '@/server/user-identity'
import { applyRateLimit, apiLimiter } from '@/lib/rate-limiter'

interface RouteParams {
  params: Promise<{ id: string }>
}

function isMissingJournalTemplateTableError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const maybePrismaError = error as {
    code?: string
    meta?: { modelName?: string; table?: string }
  }

  if (maybePrismaError.code !== 'P2021') return false

  return (
    maybePrismaError.meta?.modelName === 'JournalTemplate' ||
    maybePrismaError.meta?.table === 'public.JournalTemplate'
  )
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const rateLimitRes = await applyRateLimit(request, apiLimiter)
  if (rateLimitRes) return rateLimitRes

  const identity = await getResolvedUserIdentitySafe()
  if (!identity) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const existing = await prisma.journalTemplate.findFirst({
      where: {
        id,
        userId: identity.internalUserId,
      },
      select: { id: true },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    await prisma.journalTemplate.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (isMissingJournalTemplateTableError(error)) {
      return NextResponse.json(
        {
          error: 'Custom templates are temporarily unavailable until the latest database migration is applied.',
          migrationRequired: true,
        },
        { status: 503 }
      )
    }
    throw error
  }
}
