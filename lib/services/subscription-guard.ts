/**
 * Subscription Guard
 * Server-side access check for protected routes (dashboard, etc.)
 * Used in server components / layouts to gate access.
 */

import { getUserAccessStatus } from './subscription'
import { prisma } from '@/lib/prisma'

export interface SubscriptionGuardResult {
  hasAccess: boolean
  status: string
  redirectTo?: string
  message?: string
}

/**
 * Check if a user has active subscription access.
 * Returns access status and redirect info for unauthorized users.
 */
export async function checkSubscriptionAccess(
  userId: string
): Promise<SubscriptionGuardResult> {
  // Get user role
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  })

  if (!user) {
    return {
      hasAccess: false,
      status: 'no_user',
      redirectTo: '/login',
      message: 'User not found',
    }
  }

  const access = await getUserAccessStatus(userId, user.role)

  if (access.hasAccess) {
    return { hasAccess: true, status: access.status }
  }

  // Determine redirect based on status
  let redirectTo = '/subscribe'
  let message = 'Please subscribe to access the dashboard.'

  switch (access.status) {
    case 'expired':
      message = 'Your subscription has expired. Please renew to continue.'
      break
    case 'past_due':
      message = 'Your payment is overdue. Please pay to maintain access.'
      break
    case 'cancelled':
      message = 'Your subscription was cancelled. Please resubscribe.'
      break
    case 'unpaid':
      message = 'Please subscribe to access the trading journal.'
      break
    default:
      break
  }

  return { hasAccess: false, status: access.status as string, redirectTo, message }
}
