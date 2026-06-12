import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/server/admin-auth'
import { applyRateLimit, adminLimiter } from '@/lib/rate-limiter'
import { createErrorResponse, createSuccessResponse } from '@/lib/api-response'

const aiSettingsSchema = z.object({
  enabled: z.boolean().optional(),
  demoModeEnabled: z.boolean().optional(),
  freePlanAccess: z.boolean().optional(),
  paidPlanAccess: z.boolean().optional(),
  adminAccess: z.boolean().optional(),
  maxContextSize: z.number().int().positive().optional(),
  maxMessagesPerDay: z.number().int().positive().optional(),
  maxTokensPerResponse: z.number().int().positive().optional(),
  conversationRetentionDays: z.number().int().positive().optional(),
}).strict()

export async function GET(request: NextRequest) {
  const rl = await applyRateLimit(request, adminLimiter)
  if (rl) return rl

  try {
    await requireAdmin()

    // 1. Fetch or create global AI settings
    let settings = await prisma.adminAISetting.findUnique({
      where: { id: 'global' },
    })

    if (!settings) {
      settings = await prisma.adminAISetting.create({
        data: {
          id: 'global',
        },
      })
    }

    // 2. Fetch Usage Logs & Analytics
    const usageLogs = await prisma.aIChatUsageLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 1000, // retrieve last 1000 logs for analytics
    })

    const totalRequests = usageLogs.length
    const totalPromptTokens = usageLogs.reduce((acc, log) => acc + log.promptTokens, 0)
    const totalCompletionTokens = usageLogs.reduce((acc, log) => acc + log.completionTokens, 0)
    const totalTokens = usageLogs.reduce((acc, log) => acc + log.totalTokens, 0)
    const totalCost = usageLogs.reduce((acc, log) => acc + log.estimatedCost, 0)
    const avgResponseTime = totalRequests > 0 
      ? usageLogs.reduce((acc, log) => acc + log.responseTimeMs, 0) / totalRequests 
      : 0

    // Distinct users
    const uniqueUsersSet = new Set(usageLogs.map(log => log.userId))
    const uniqueUsersCount = uniqueUsersSet.size

    // Group logs by day for charting (last 30 days)
    const dailyStatsMap = new Map<string, { count: number; cost: number; tokens: number }>()
    const now = new Date()
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(now.getDate() - i)
      const dayKey = date.toISOString().split('T')[0]
      dailyStatsMap.set(dayKey, { count: 0, cost: 0, tokens: 0 })
    }

    usageLogs.forEach(log => {
      const dayKey = log.createdAt.toISOString().split('T')[0]
      if (dailyStatsMap.has(dayKey)) {
        const current = dailyStatsMap.get(dayKey)!
        current.count++
        current.cost += log.estimatedCost
        current.tokens += log.totalTokens
        dailyStatsMap.set(dayKey, current)
      }
    })

    const dailyStats = Array.from(dailyStatsMap.entries()).map(([date, data]) => ({
      date,
      count: data.count,
      cost: data.cost,
      tokens: data.tokens,
    }))

    return createSuccessResponse({
      settings,
      analytics: {
        totalRequests,
        totalPromptTokens,
        totalCompletionTokens,
        totalTokens,
        totalCost,
        avgResponseTime,
        uniqueUsersCount,
        dailyStats,
      }
    })
  } catch (error) {
    return createErrorResponse('Unauthorized', 401)
  }
}

export async function PATCH(request: NextRequest) {
  const rl = await applyRateLimit(request, adminLimiter)
  if (rl) return rl

  try {
    await requireAdmin()
    const body = await request.json().catch(() => null)
    const parsed = aiSettingsSchema.safeParse(body)

    if (!parsed.success) {
      return createErrorResponse('Validation failed', 400, parsed.error.flatten(), 'VALIDATION_ERROR')
    }

    const settings = await prisma.adminAISetting.upsert({
      where: { id: 'global' },
      update: parsed.data,
      create: {
        id: 'global',
        ...parsed.data,
      },
    })

    return createSuccessResponse(settings)
  } catch (error) {
    return createErrorResponse('Unauthorized', 401)
  }
}
