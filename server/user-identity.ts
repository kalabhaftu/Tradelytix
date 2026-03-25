import { prisma } from '@/lib/prisma'
import { getUserId, getUserIdSafe } from '@/server/auth'

export interface ResolvedUserIdentity {
  authUserId: string
  internalUserId: string
}

async function resolveInternalUserIdFromAuth(authUserId: string): Promise<string | null> {
  const byAuthId = await prisma.user.findUnique({
    where: { auth_user_id: authUserId },
    select: { id: true }
  })

  if (byAuthId?.id) {
    return byAuthId.id
  }

  // Backward-compatibility fallback for legacy datasets where id may equal auth id.
  const byId = await prisma.user.findUnique({
    where: { id: authUserId },
    select: { id: true }
  })

  return byId?.id ?? null
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

  const internalUserId = await resolveInternalUserIdFromAuth(authUserId)
  if (!internalUserId) {
    return null
  }

  return { authUserId, internalUserId }
}
