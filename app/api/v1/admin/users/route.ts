import { NextResponse, NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/server/admin-auth'
import { applyRateLimit, adminLimiter } from '@/lib/rate-limiter'
import { sanitizeErrorMessage, getErrorStatusCode } from '@/lib/api-error'
import { formatGeoLocation, normalizeGeoRecord } from '@/lib/geo'
import { getAuthBackedUserDirectory } from '@/server/admin-user-directory'

function getDisplayName(params: {
  firstName?: string | null
  lastName?: string | null
  userMetadata?: Record<string, any> | null
}) {
  const fullName = [params.firstName, params.lastName].filter(Boolean).join(' ').trim()
  if (fullName) return fullName

  const metadata = params.userMetadata ?? {}
  return [
    metadata.first_name,
    metadata.last_name,
  ].filter(Boolean).join(' ').trim() || metadata.full_name || metadata.name || null
}

export async function GET(req: NextRequest) {
  const rl = await applyRateLimit(req, adminLimiter)
  if (rl) return rl

  try {
    await requireAdmin()

    const url = new URL(req.url)
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '50')))
    const search = (url.searchParams.get('search') || '').trim().toLowerCase()

    const directory = await getAuthBackedUserDirectory()
    const authUserIds = directory.authUsers.map((user) => user.id)

    const dbUsers = authUserIds.length
      ? await prisma.user.findMany({
          where: { auth_user_id: { in: authUserIds } },
          select: {
            id: true,
            email: true,
            auth_user_id: true,
            firstName: true,
            lastName: true,
            _count: { select: { Account: true, MasterAccount: true, Notification: true } },
          },
        })
      : []

    const dbUsersByAuthId = new Map(dbUsers.map((user) => [user.auth_user_id, user]))
    const dbUserIds = dbUsers.map((user) => user.id)

    const geoLogs = dbUserIds.length
      ? await prisma.userGeoLog.findMany({
          where: { userId: { in: dbUserIds } },
          orderBy: { createdAt: 'desc' },
          select: {
            userId: true,
            country: true,
            countryCode: true,
            city: true,
            createdAt: true,
          },
        })
      : []

    const latestGeoByUserId = new Map<string, (typeof geoLogs)[number]>()
    for (const log of geoLogs) {
      if (!latestGeoByUserId.has(log.userId)) {
        latestGeoByUserId.set(log.userId, log)
      }
    }

    const liveUsers = directory.authUsers.map((authUser) => {
      const dbUser = dbUsersByAuthId.get(authUser.id)
      const geo = dbUser ? normalizeGeoRecord(latestGeoByUserId.get(dbUser.id) ?? null) : null
      const displayName = getDisplayName({
        firstName: dbUser?.firstName,
        lastName: dbUser?.lastName,
        userMetadata: authUser.user_metadata ?? null,
      })

      return {
        id: authUser.id,
        dbUserId: dbUser?.id ?? null,
        authUserId: authUser.id,
        email: authUser.email ?? dbUser?.email ?? '',
        firstName: dbUser?.firstName ?? authUser.user_metadata?.first_name ?? null,
        lastName: dbUser?.lastName ?? authUser.user_metadata?.last_name ?? null,
        displayName,
        hasDbProfile: Boolean(dbUser),
        geo,
        locationLabel: formatGeoLocation(geo),
        accountCount: dbUser ? dbUser._count.Account + dbUser._count.MasterAccount : 0,
        notificationCount: dbUser?._count.Notification ?? 0,
        createdAt: authUser.created_at ?? null,
        lastSignInAt: authUser.last_sign_in_at ?? null,
      }
    })

    const filteredUsers = liveUsers.filter((user) => {
      if (!search) return true

      const haystack = [
        user.email,
        user.displayName,
        user.firstName,
        user.lastName,
        user.locationLabel,
      ].filter(Boolean).join(' ').toLowerCase()

      return haystack.includes(search)
    })

    const paginatedUsers = filteredUsers.slice((page - 1) * limit, page * limit)

    const orphanedDbUsers = directory.orphanedDbUsers.map((user) => ({
      id: user.id,
      authUserId: user.auth_user_id,
      email: user.email,
      displayName: [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || null,
    }))

    return NextResponse.json({
      success: true,
      data: {
        users: paginatedUsers,
        total: filteredUsers.length,
        page,
        limit,
        totalPages: Math.ceil(filteredUsers.length / limit),
        summary: {
          liveUsers: liveUsers.length,
          orphanedDbUsers: orphanedDbUsers.length,
          authUsersMissingDbRows: directory.authUsersMissingDbRows.length,
          orphanedDbUserSamples: orphanedDbUsers.slice(0, 5),
        },
      },
    })
  } catch (error: any) {
    const status = getErrorStatusCode(error)
    return NextResponse.json({ success: false, error: sanitizeErrorMessage(error) }, { status })
  }
}
