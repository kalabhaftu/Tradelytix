import { getResolvedUserIdentitySafe, type ResolvedUserIdentity } from '@/server/user-identity'
import { prisma } from '@/lib/prisma'

/**
 * Check if the currently authenticated user is the admin.
 * Uses ADMIN_EMAIL env var for identification.
 */
export async function isAdminUser(): Promise<boolean> {
  const adminEmailStr = process.env.ADMIN_EMAIL
  if (!adminEmailStr) return false

  const adminEmails = adminEmailStr.split(',').map(e => e.trim().toLowerCase())

  const identity = await getResolvedUserIdentitySafe()
  if (!identity) return false

  const user = await prisma.user.findUnique({
    where: { id: identity.internalUserId },
    select: { email: true },
  })

  return Boolean(user?.email && adminEmails.includes(user.email.toLowerCase()))
}

/**
 * Require admin access. Throws if not admin.
 * Returns the resolved user identity for further use.
 */
export async function requireAdmin(): Promise<ResolvedUserIdentity> {
  const adminEmailStr = process.env.ADMIN_EMAIL
  if (!adminEmailStr) {
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

  const adminEmails = adminEmailStr.split(',').map(e => e.trim().toLowerCase())
  if (!user?.email || !adminEmails.includes(user.email.toLowerCase())) {
    throw new Error('Forbidden: Admin access required')
  }

  return identity
}
