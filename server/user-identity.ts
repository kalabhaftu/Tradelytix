import { cache } from 'react'
import { db } from '@/lib/db/client'
import { getUserId, getUserIdSafe } from '@/server/auth'

export interface ResolvedUserIdentity {
  authUserId: string
  internalUserId: string
}

function isTransientDatabaseError(error: unknown) {
  if (!(error instanceof Error)) return false

  return [
    "Can't reach database server",
    'P1001',
    'Connection timeout',
    'ECONNREFUSED',
    'ENOTFOUND',
  ].some((message) => error.message.includes(message))
}

const resolveInternalUserIdFromAuthCached = cache(
  async (authUserId: string): Promise<string | null> => {
    const byAuthId = await db.query.User.findFirst({
      where: (table, { eq }) => eq(table.auth_user_id, authUserId),
      columns: { id: true }
    })

    if (byAuthId?.id) {
      return byAuthId.id
    }

    // Backward-compatibility fallback for legacy datasets where id may equal auth id.
    const byId = await db.query.User.findFirst({
      where: (table, { eq }) => eq(table.id, authUserId),
      columns: { id: true }
    })

    return byId?.id ?? null
  }
)

async function resolveInternalUserIdFromAuth(authUserId: string): Promise<string | null> {
  return resolveInternalUserIdFromAuthCached(authUserId)
}

export async function resolveInternalUserId(authUserId: string): Promise<string | null> {
  return resolveInternalUserIdFromAuth(authUserId)
}

export async function getResolvedUserIdentity(): Promise<ResolvedUserIdentity> {
  const authUserId = await getUserId()
  const internalUserId = await resolveInternalUserIdFromAuth(authUserId)

  if (!internalUserId) {
    throw new Error('User not found')
  }

  return { authUserId, internalUserId }
}

export async function getResolvedUserIdentitySafe(): Promise<ResolvedUserIdentity | null> {
  const authUserId = await getUserIdSafe()
  if (!authUserId) {
    return null
  }

  try {
    const internalUserId = await resolveInternalUserIdFromAuth(authUserId)
    if (!internalUserId) {
      return null
    }

    return { authUserId, internalUserId }
  } catch (error) {
    if (isTransientDatabaseError(error)) {
      return null
    }

    throw error
  }
}