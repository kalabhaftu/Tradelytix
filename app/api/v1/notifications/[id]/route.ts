/**
 * Individual Notification API (v1)
 * PATCH  /api/v1/notifications/[id] - Mark as read/update
 * DELETE /api/v1/notifications/[id] - Delete notification
 */

import { NextRequest, NextResponse } from 'next/server'
import { getResolvedUserIdentity } from '@/server/user-identity'
import { prisma } from '@/lib/prisma'
import { applyRateLimit, apiLimiter } from '@/lib/rate-limiter'
import { logger } from '@/lib/logger'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitRes = await applyRateLimit(request, apiLimiter)
  if (rateLimitRes) return rateLimitRes

  try {
    const { internalUserId } = await getResolvedUserIdentity()
    const { id } = await params
    const body = await request.json()

    const notification = await prisma.notification.findFirst({
      where: { id, userId: internalUserId },
    })

    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: {
        isRead: body.isRead ?? notification.isRead,
        actionRequired: body.actionRequired ?? notification.actionRequired,
      },
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error: any) {
    logger.error('PATCH /api/v1/notifications/[id]', { error: error?.message }, 'api')
    if (error.message?.includes('not authenticated') || error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitRes = await applyRateLimit(request, apiLimiter)
  if (rateLimitRes) return rateLimitRes

  try {
    const { internalUserId } = await getResolvedUserIdentity()
    const { id } = await params

    const notification = await prisma.notification.findFirst({
      where: { id, userId: internalUserId },
    })

    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
    }

    await prisma.notification.delete({ where: { id } })

    return NextResponse.json({ success: true, message: 'Notification deleted' })
  } catch (error: any) {
    logger.error('DELETE /api/v1/notifications/[id]', { error: error?.message }, 'api')
    if (error.message?.includes('not authenticated') || error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 })
  }
}
