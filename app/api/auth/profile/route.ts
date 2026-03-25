import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserId } from '@/server/auth'
import { logActivity, getClientIp } from '@/lib/activity-logger'

const DEFAULT_AI_SETTINGS = {
  weeklyReviewAutomationEnabled: false,
  autoGenerateInsights: false,
  includeAiInsightsInNotifications: true,
}

function normalizeAiSettings(value: unknown) {
  const raw = (value && typeof value === 'object') ? value as Record<string, unknown> : {}
  return {
    weeklyReviewAutomationEnabled: !!raw.weeklyReviewAutomationEnabled,
    autoGenerateInsights: !!raw.autoGenerateInsights,
    includeAiInsightsInNotifications: raw.includeAiInsightsInNotifications !== false,
  }
}

// GET /api/auth/profile - Get user profile information
export async function GET() {
  try {
    // Get user ID using the proper auth function
    let userId: string
    try {
      userId = await getUserId()
    } catch (authError) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { auth_user_id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        accentPack: true,
        theme: true,
        autoAdjustAccountDate: true,
        calendarDisplayStats: true,
        showWeeklySummary: true,
        aiSettings: true,
      } as any
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        ...user,
        aiSettings: normalizeAiSettings((user as any).aiSettings ?? DEFAULT_AI_SETTINGS)
      }
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

// PATCH /api/auth/profile - Update user profile information
export async function PATCH(request: NextRequest) {
  try {
    // Get user ID using the proper auth function
    let userId: string
    try {
      userId = await getUserId()
    } catch (authError) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()

    const { firstName, lastName, accentPack, theme, autoAdjustAccountDate, calendarDisplayStats, showWeeklySummary, aiSettings } = body

    // Validate input — only check fields that are actually provided
    if (firstName !== undefined && typeof firstName !== 'string' && firstName !== null) {
      return NextResponse.json(
        { error: 'Invalid firstName format' },
        { status: 400 }
      )
    }

    if (lastName !== undefined && typeof lastName !== 'string' && lastName !== null) {
      return NextResponse.json(
        { error: 'Invalid lastName format' },
        { status: 400 }
      )
    }

    // Build update data — only include fields that were sent
    const updateData: Record<string, any> = {}
    if (firstName !== undefined) updateData.firstName = firstName?.trim() || null
    if (lastName !== undefined) updateData.lastName = lastName?.trim() || null
    if (accentPack && typeof accentPack === 'string') updateData.accentPack = accentPack
    if (theme && typeof theme === 'string') updateData.theme = theme
    if (autoAdjustAccountDate !== undefined) updateData.autoAdjustAccountDate = !!autoAdjustAccountDate
    if (calendarDisplayStats !== undefined && Array.isArray(calendarDisplayStats)) {
      const allowed = ['pnl', 'trades', 'winRate', 'rMultiple']
      updateData.calendarDisplayStats = calendarDisplayStats.filter((s: string) => allowed.includes(s))
    }
    if (showWeeklySummary !== undefined) updateData.showWeeklySummary = !!showWeeklySummary

    if (aiSettings !== undefined) {
      const existing = await prisma.user.findUnique({
        where: { auth_user_id: userId },
        select: { aiSettings: true } as any
      })

      updateData.aiSettings = normalizeAiSettings({
        ...((existing as any)?.aiSettings && typeof (existing as any).aiSettings === 'object' ? (existing as any).aiSettings as Record<string, unknown> : {}),
        ...(typeof aiSettings === 'object' && aiSettings ? aiSettings : {})
      })
    }

    // Update user profile in database
    const updatedUser = await prisma.user.update({
      where: { auth_user_id: userId },
      data: updateData as any,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        accentPack: true,
        theme: true,
        autoAdjustAccountDate: true,
        calendarDisplayStats: true,
        showWeeklySummary: true,
        aiSettings: true,
      } as any
    })

    const activityUserId =
      typeof (updatedUser as any)?.id === 'string' && (updatedUser as any).id.length > 0
        ? (updatedUser as any).id
        : userId

    logActivity({
      userId: activityUserId,
      action: 'PROFILE_UPDATED',
      entity: 'Profile',
      metadata: { updatedFields: Object.keys(updateData) },
      ipAddress: getClientIp(request),
    })

    return NextResponse.json({
      success: true,
      data: {
        ...updatedUser,
        aiSettings: normalizeAiSettings((updatedUser as any).aiSettings ?? DEFAULT_AI_SETTINGS)
      },
      message: 'Profile updated successfully'
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}
