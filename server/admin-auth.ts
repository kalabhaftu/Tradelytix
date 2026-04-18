import { getResolvedUserIdentitySafe, type ResolvedUserIdentity } from '@/server/user-identity'
import { prisma } from '@/lib/prisma'

/**
 * Check if the currently authenticated user is an admin.
 *
 * Uses a two-layer approach:
 * 1. Database `role` column (preferred — persistent, supports multi-admin)
 * 2. ADMIN_EMAIL env var fallback (legacy — for bootstrapping the first admin)
 */
export async function isAdminUser(): Promise<boolean> {
  const identity = await getResolvedUserIdentitySafe()
  if (!identity) return false

  const user = await prisma.user.findUnique({
    where: { id: identity.internalUserId },
    select: { email: true, role: true },
  })

  if (!user) return false

  // Check database role first (preferred path)
  if (user.role === 'admin') return true

  // Fallback: check ADMIN_EMAIL env var (bootstrapping)
  const adminEmailStr = process.env.ADMIN_EMAIL
  if (adminEmailStr) {
    const adminEmails = adminEmailStr.split(',').map(e => e.trim().toLowerCase())
    if (user.email && adminEmails.includes(user.email.toLowerCase())) return true
  }

  return false
}

/**
 * Require admin access. Throws if not admin.
 * Returns the resolved user identity for further use.
 */
export async function requireAdmin(): Promise<ResolvedUserIdentity> {
  const identity = await getResolvedUserIdentitySafe()
  if (!identity) {
    throw new Error('Unauthorized')
  }

  const user = await prisma.user.findUnique({
    where: { id: identity.internalUserId },
    select: { email: true, role: true },
  })

  if (!user) {
    throw new Error('Unauthorized')
  }

  // Check database role first
  if (user.role === 'admin') return identity

  // Fallback: check ADMIN_EMAIL env var
  const adminEmailStr = process.env.ADMIN_EMAIL
  if (adminEmailStr) {
    const adminEmails = adminEmailStr.split(',').map(e => e.trim().toLowerCase())
    if (user.email && adminEmails.includes(user.email.toLowerCase())) {
      return identity
    }
  }

  throw new Error('Forbidden: Admin access required')
}
