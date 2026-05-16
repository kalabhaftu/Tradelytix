/**
 * Notifications API (v1)
 * GET    /api/v1/notifications - Get all notifications
 * POST   /api/v1/notifications - Create notification (internal use)
 * PATCH  /api/v1/notifications - Mark all as read
 * DELETE /api/v1/notifications - Clear all notifications
 */

import { NextRequest, NextResponse } from 'next/server'
import { getResolvedUserIdentity } from '@/server/user-identity'
import { prisma } from '@/lib/prisma'
import { applyRateLimit, apiLimiter } from '@/lib/rate-limiter'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  const rateLimitRes = await applyRateLimit(request, apiLimiter)
  if (rateLimitRes) return rateLimitRes

  try {
    const { internalUserId } = await getResolvedUserIdentity()
    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)

    const notifications = await prisma.notification.findMany({
      where: {
        userId: internalUserId,
        ...(unreadOnly ? { isRead: false } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    const unreadCount = unreadOnly
      ? notifications.length
      : await prisma.notification.count({
          where: { userId: internalUserId, isRead: false },
        })

    return NextResponse.json({ success: true, data: { notifications, unreadCount } })
  } catch (error: any) {
    logger.error('GET /api/v1/notifications', { error: error?.message }, 'api')
    if (error.message?.includes('not authenticated') || error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const rateLimitRes = await applyRateLimit(request, apiLimiter)
  if (rateLimitRes) return rateLimitRes

  try {
    const { internalUserId } = await getResolvedUserIdentity()
    const body = await request.json()
    const { type, title, message, priority, data } = body

    if (!type || !title || !message) {
      return NextResponse.json({ error: 'Missing required fields: type, title, message' }, { status: 400 })
    }

    const notification = await prisma.notification.create({
      data: {
        userId: internalUserId,
        type,
        title: String(title).slice(0, 200),
        message: String(message).slice(0, 1000),
        priority: priority || 'MEDIUM',
        ...(data ? { data } : {}),
      },
    })

    return NextResponse.json({ success: true, data: notification })
  } catch (error: any) {
    logger.error('POST /api/v1/notifications', { error: error?.message }, 'api')
    if (error.message?.includes('not authenticated') || error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const rateLimitRes = await applyRateLimit(request, apiLimiter)
  if (rateLimitRes) return rateLimitRes

  try {
    const { internalUserId } = await getResolvedUserIdentity()

    await prisma.notification.updateMany({
      where: { userId: internalUserId, isRead: false },
      data: { isRead: true },
    })

    return NextResponse.json({ success: true, message: 'All notifications marked as read' })
  } catch (error: any) {
    logger.error('PATCH /api/v1/notifications', { error: error?.message }, 'api')
    if (error.message?.includes('not authenticated') || error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to mark notifications as read' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const rateLimitRes = await applyRateLimit(request, apiLimiter)
  if (rateLimitRes) return rateLimitRes

  try {
    const { internalUserId } = await getResolvedUserIdentity()

    await prisma.notification.deleteMany({
      where: { userId: internalUserId },
    })

    return NextResponse.json({ success: true, message: 'All notifications cleared' })
  } catch (error: any) {
    logger.error('DELETE /api/v1/notifications', { error: error?.message }, 'api')
    if (error.message?.includes('not authenticated') || error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to clear notifications' }, { status: 500 })
  }
}
