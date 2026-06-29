import { db } from '@/lib/db/client'
import { AdminAISetting, User, AIChatUsageLog } from '@/lib/db/schema'
import { eq, and, gte, count } from 'drizzle-orm'
import { checkSubscriptionAccess } from './subscription-guard-service'

export interface AIGuardResult {
  hasAccess: boolean
  reason?: string
  settings?: any
}

/**
 * Checks if a user has access to the AI features, based on their subscription
 * role, global admin controls, and daily usage limits.
 */
export async function checkAIAccess(userId: string): Promise<AIGuardResult> {
  let settings = await db.query.AdminAISetting.findFirst({
    where: eq(AdminAISetting.id, 'global'),
  })

  if (!settings) {
    const [inserted] = await db.insert(AdminAISetting)
      .values({ id: 'global', updatedAt: new Date() })
      .returning()
    settings = inserted
  }

  if (!settings) {
    return { hasAccess: false, reason: 'Failed to initialize AI settings' }
  }

  // If AI is globally disabled
  if (!settings?.enabled) {
    return { hasAccess: false, reason: 'AI assistant is currently disabled by administrator.', settings }
  }

  // 2. Fetch User Role
  const user = await db.query.User.findFirst({
    where: eq(User.id, userId),
    columns: { role: true },
  })

  if (!user) {
    return { hasAccess: false, reason: 'User not found.', settings }
  }

  const isAdmin = user.role === 'admin'

  // Admin access check
  if (isAdmin) {
    if (settings?.adminAccess) {
      return { hasAccess: true, settings }
    }
    return { hasAccess: false, reason: 'AI access is disabled for administrators.', settings }
  }

  // 3. Fetch Subscription Access Status
  const subStatus = await checkSubscriptionAccess(userId)
  const isPaid = subStatus.hasAccess && subStatus.status !== 'past_due' // active, free_access, invited_free, promo_active

  if (isPaid) {
    if (settings?.paidPlanAccess) {
      // 4. Rate Limiting Check: Max Messages Per Day
      const startOfDay = new Date()
      startOfDay.setHours(0, 0, 0, 0)
      
      const [result] = await db.select({ count: count() })
        .from(AIChatUsageLog)
        .where(
          and(
            eq(AIChatUsageLog.userId, userId),
            gte(AIChatUsageLog.createdAt, startOfDay)
          )
        )
      const messageCount = result?.count || 0
      
      if (messageCount >= (settings?.maxMessagesPerDay ?? 0)) {
        return { 
          hasAccess: false, 
          reason: `You have reached your daily limit of ${settings?.maxMessagesPerDay || 'default'} AI messages. Try again tomorrow.`, 
          settings 
        }
      }

      return { hasAccess: true, settings }
    }
    return { hasAccess: false, reason: 'AI access is disabled for paid members.', settings }
  }

  // User is on a Free Plan
  if (settings?.freePlanAccess) {
    // Check daily limits
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)
    
    const [result] = await db.select({ count: count() })
      .from(AIChatUsageLog)
      .where(
        and(
          eq(AIChatUsageLog.userId, userId),
          gte(AIChatUsageLog.createdAt, startOfDay)
        )
      )
    const messageCount = result?.count || 0

    if (messageCount >= (settings?.maxMessagesPerDay ?? 0)) {
      return { 
        hasAccess: false, 
        reason: `You have reached your daily limit of ${settings?.maxMessagesPerDay || 'default'} AI messages. Try again tomorrow.`, 
        settings 
      }
    }

    return { hasAccess: true, settings }
  }

  return { 
    hasAccess: false, 
    reason: 'AI Assistant requires a paid subscription. Please upgrade your plan to gain access.', 
    settings 
  }
}
