import { getResolvedUserIdentitySafe, type ResolvedUserIdentity } from '@/server/user-identity'
import { prisma } from '@/lib/prisma'

function adminEmailFallbackEnabled() {
  return process.env.NODE_ENV !== 'production' || process.env.ENABLE_ADMIN_EMAIL_FALLBACK === 'true'
}

function isConfiguredAdminEmail(email: string | null | undefined) {
  if (!email || !adminEmailFallbackEnabled()) return false

  const adminEmailStr = process.env.ADMIN_EMAIL
  if (!adminEmailStr) return false

  const adminEmails = adminEmailStr.split(',').map((entry) => entry.trim().toLowerCase())
  return adminEmails.includes(email.toLowerCase())
}

export async function isAdminUser(): Promise<boolean> {
  const identity = await getResolvedUserIdentitySafe()
  if (!identity) return false

  const user = await prisma.user.findUnique({
    where: { id: identity.internalUserId },
    select: { email: true, role: true },
  })

  if (!user) return false
  if (user.role === 'admin') return true

  return isConfiguredAdminEmail(user.email)
}

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

  if (user.role === 'admin') return identity
  if (isConfiguredAdminEmail(user.email)) return identity

  throw new Error('Forbidden: Admin access required')
}
