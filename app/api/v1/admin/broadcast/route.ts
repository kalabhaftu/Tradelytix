import { NextRequest } from 'next/server'
import { z } from 'zod'
import { NotificationPriority, NotificationType } from '@prisma/client'
import { requireAdmin } from '@/server/admin-auth'
import { prisma } from '@/lib/prisma'
import { formatNoteContent } from '@/lib/utils'
import { applyRateLimit, adminLimiter } from '@/lib/rate-limiter'
import { createErrorResponse, createSuccessResponse } from '@/lib/api-response'
import { logger } from '@/lib/logger'

const BATCH_SIZE = 200

const broadcastSchema = z.object({
  title: z.string().trim().min(1).max(200),
  content: z.string().trim().min(1).max(10000),
  priority: z.nativeEnum(NotificationPriority).optional().default(NotificationPriority.MEDIUM),
}).strict()

export async function POST(request: NextRequest) {
  const rl = await applyRateLimit(request, adminLimiter)
  if (rl) return rl

  try {
    await requireAdmin()
    const body = await request.json().catch(() => null)
    const parsed = broadcastSchema.safeParse(body)

    if (!parsed.success) {
      return createErrorResponse('Validation failed', 400, parsed.error.flatten(), 'VALIDATION_ERROR')
    }

    const { title, content, priority } = parsed.data
    const preview = formatNoteContent(content).slice(0, 280)
    const users = await prisma.user.findMany({
      select: { id: true },
    })

    for (let index = 0; index < users.length; index += BATCH_SIZE) {
      const batch = users.slice(index, index + BATCH_SIZE)
      await prisma.notification.createMany({
        data: batch.map((user) => ({
          userId: user.id,
          type: NotificationType.SYSTEM_ANNOUNCEMENT,
          title,
          message: preview,
          priority,
          data: {
            body: content,
            bodyFormat: 'lexical',
            sentAt: new Date().toISOString(),
          },
        })),
      })
    }

    return createSuccessResponse({ recipients: users.length })
  } catch (error) {
    logger.error('Admin broadcast failed', {}, 'api')
    return createErrorResponse('Failed to send broadcast', 500)
  }
}
