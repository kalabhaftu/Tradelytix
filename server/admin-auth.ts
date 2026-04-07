import { getResolvedUserIdentitySafe, type ResolvedUserIdentity } from '@/server/user-identity'
import { prisma } from '@/lib/prisma'

/**
 * Check if the currently authenticated user is the admin.
 * Uses ADMIN_EMAIL env var for identification.
 */
export async function isAdminUser(): Promise<boolean> {
  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail) return false

  const identity = await getResolvedUserIdentitySafe()
  if (!identity) return false

  const user = await prisma.user.findUnique({
    where: { id: identity.internalUserId },
    select: { email: true },
  })

  return user?.email === adminEmail
}

/**
 * Require admin access. Throws if not admin.
 * Returns the resolved user identity for further use.
 */
export async function requireAdmin(): Promise<ResolvedUserIdentity> {
  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail) {
    throw new Error('ADMIN_EMAIL not configured')
  }

  const identity = await getResolvedUserIdentitySafe()
  if (!identity) {
    throw new Error('Unauthorized')
  }

  const user = await prisma.user.findUnique({
    where: { id: identity.internalUserId },
    select: { email: true },
  })

  if (user?.email !== adminEmail) {
    throw new Error('Forbidden: Admin access required')
  }

  return identity
}
