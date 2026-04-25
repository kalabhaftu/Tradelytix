import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getResolvedUserIdentitySafe } from '@/server/user-identity'
import { applyRateLimit, apiLimiter } from '@/lib/rate-limiter'

const createTemplateSchema = z.object({
  name: z.string().trim().min(1).max(60),
  content: z.object({
    root: z.object({
      children: z.array(z.any()),
      direction: z.string(),
      format: z.string(),
      indent: z.number(),
      type: z.string(),
      version: z.number(),
    }),
  }),
})

const MAX_CUSTOM_TEMPLATES = 3

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

export async function GET(request: NextRequest) {
  const rateLimitRes = await applyRateLimit(request, apiLimiter)
  if (rateLimitRes) return rateLimitRes

  const identity = await getResolvedUserIdentitySafe()
  if (!identity) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const templates = await prisma.journalTemplate.findMany({
      where: { userId: identity.internalUserId },
      orderBy: [{ createdAt: 'asc' }],
      select: {
        id: true,
        name: true,
        content: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({ templates })
  } catch (error) {
    if (isMissingJournalTemplateTableError(error)) {
      return NextResponse.json({
        templates: [],
        migrationRequired: true,
      })
    }
    throw error
  }
}

export async function POST(request: NextRequest) {
  const rateLimitRes = await applyRateLimit(request, apiLimiter)
  if (rateLimitRes) return rateLimitRes

  const identity = await getResolvedUserIdentitySafe()
  if (!identity) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const json = await request.json().catch(() => null)
  const parsed = createTemplateSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid template payload' }, { status: 400 })
  }

  const { name, content } = parsed.data
  const userId = identity.internalUserId

  try {
    const existingByName = await prisma.journalTemplate.findUnique({
      where: { userId_name: { userId, name } },
      select: { id: true },
    })

    if (existingByName) {
      const updated = await prisma.journalTemplate.update({
        where: { id: existingByName.id },
        data: { content },
        select: {
          id: true,
          name: true,
          content: true,
          createdAt: true,
          updatedAt: true,
        },
      })
      return NextResponse.json({ template: updated, updated: true })
    }

    const count = await prisma.journalTemplate.count({
      where: { userId },
    })

    if (count >= MAX_CUSTOM_TEMPLATES) {
      return NextResponse.json(
        { error: `Maximum ${MAX_CUSTOM_TEMPLATES} custom templates allowed` },
        { status: 409 }
      )
    }

    const created = await prisma.journalTemplate.create({
      data: {
        userId,
        name,
        content,
      },
      select: {
        id: true,
        name: true,
        content: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({ template: created, created: true }, { status: 201 })
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
