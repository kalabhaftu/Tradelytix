import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getResolvedUserIdentitySafe } from '@/server/user-identity'
import { applyRateLimit, apiLimiter } from '@/lib/rate-limiter'
import { checkAIAccess } from '@/lib/services/ai-guard'

export async function GET(request: NextRequest) {
  const rl = await applyRateLimit(request, apiLimiter)
  if (rl) return rl

  const identity = await getResolvedUserIdentitySafe()
  if (!identity) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = identity.internalUserId

  try {
    // Check general AI access
    const aiGuard = await checkAIAccess(userId)
    if (!aiGuard.hasAccess) {
      return NextResponse.json({ error: aiGuard.reason, code: 'PAYWALL' }, { status: 403 })
    }

    const chats = await prisma.aIChat.findMany({
      where: {
        userId,
        isDeleted: false,
      },
      orderBy: [
        { isPinned: 'desc' },
        { updatedAt: 'desc' },
      ],
      select: {
        id: true,
        title: true,
        isPinned: true,
        isArchived: true,
        accounts: true,
        dateRange: true,
        customFrom: true,
        customTo: true,
        dataSources: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({ success: true, data: chats })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch chats' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const rl = await applyRateLimit(request, apiLimiter)
  if (rl) return rl

  const identity = await getResolvedUserIdentitySafe()
  if (!identity) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = identity.internalUserId

  try {
    // Check AI access
    const aiGuard = await checkAIAccess(userId)
    if (!aiGuard.hasAccess) {
      return NextResponse.json({ error: aiGuard.reason, code: 'PAYWALL' }, { status: 403 })
    }

    const body = await request.json()
    const { title, accounts, dateRange, customFrom, customTo, dataSources } = body

    const chat = await prisma.aIChat.create({
      data: {
        userId,
        title: title || 'New Conversation',
        accounts: accounts || [],
        dateRange: dateRange || 'last-30-days',
        customFrom: customFrom ? new Date(customFrom) : null,
        customTo: customTo ? new Date(customTo) : null,
        dataSources: dataSources || [],
      },
      select: {
        id: true,
        title: true,
        isPinned: true,
        isArchived: true,
        accounts: true,
        dateRange: true,
        customFrom: true,
        customTo: true,
        dataSources: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({ success: true, data: chat })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create chat' }, { status: 500 })
  }
}
