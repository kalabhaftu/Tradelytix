/**
 * Notifications API
 * GET /api/notifications - Get all notifications
 * POST /api/notifications - Create notification (internal use)
 * PATCH /api/notifications - Mark all as read
 */

import { NextRequest, NextResponse } from 'next/server'
import { getResolvedUserIdentitySafe } from '@/server/user-identity'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const identity = await getResolvedUserIdentitySafe()
    if (!identity) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const limit = parseInt(searchParams.get('limit') || '50')

    const notifications = await prisma.notification.findMany({
      where: {
        userId: identity.internalUserId,
        ...(unreadOnly ? { isRead: false } : {})
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    })

    const unreadCount = await prisma.notification.count({
      where: {
        userId: identity.internalUserId,
        isRead: false
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        notifications,
        unreadCount
      }
    })

  } catch (error) {
    console.error('Get notifications error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const identity = await getResolvedUserIdentitySafe()
    if (!identity) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Mark all as read
    await prisma.notification.updateMany({
      where: {
        userId: identity.internalUserId,
        isRead: false
      },
      data: { isRead: true }
    })

    return NextResponse.json({
      success: true,
      message: 'All notifications marked as read'
    })

  } catch (error) {
    console.error('Mark all read error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to mark notifications as read' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const identity = await getResolvedUserIdentitySafe()
    if (!identity) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Delete all notifications for the user
    await prisma.notification.deleteMany({
      where: {
        userId: identity.internalUserId
      }
    })

    return NextResponse.json({
      success: true,
      message: 'All notifications cleared'
    })

  } catch (error) {
    console.error('Clear all notifications error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to clear notifications' },
      { status: 500 }
    )
  }
}


