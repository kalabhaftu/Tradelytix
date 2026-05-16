import { NextResponse, NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/server/admin-auth'
import { applyRateLimit, adminLimiter } from '@/lib/rate-limiter'
import { sanitizeErrorMessage, getErrorStatusCode } from '@/lib/api-error'
import { logServerError } from '@/lib/error-logger'
import { logger } from '@/lib/logger'
import { createErrorResponse } from '@/lib/api-response'

const feedbackReplySchema = z.object({
  message: z.string().trim().min(1).max(5000),
}).strict()

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rl = await applyRateLimit(req, adminLimiter)
  if (rl) return rl

  try {
    await requireAdmin()
    const { id } = await params
    const body = await req.json().catch(() => null)
    const parsed = feedbackReplySchema.safeParse(body)

    if (!parsed.success) {
      return createErrorResponse('Validation failed', 400, parsed.error.flatten(), 'VALIDATION_ERROR')
    }

    const feedback = await prisma.feedback.findUnique({
      where: { id },
      select: { userId: true, subject: true },
    })

    if (!feedback) {
      return NextResponse.json({ success: false, error: 'Feedback not found' }, { status: 404 })
    }

    const reply = await prisma.feedbackReply.create({
      data: {
        feedbackId: id,
        message: parsed.data.message,
      },
    })

    if (feedback.userId) {
      try {
        const userExists = await prisma.user.findUnique({
          where: { id: feedback.userId },
          select: { id: true },
        })

        if (userExists) {
          await prisma.notification.create({
            data: {
              userId: feedback.userId,
              type: 'FEEDBACK_REPLY',
              title: 'Feedback Reply',
              message: `Your feedback "${feedback.subject}" has received a reply: ${parsed.data.message.slice(0, 200)}`,
              data: { feedbackId: id, replyId: reply.id },
              actionRequired: false,
            },
          })
        }
      } catch (notifError) {
        logger.warn('Admin feedback reply notification failed', {}, 'api')
      }
    }

    await prisma.feedback.update({
      where: { id },
      data: { status: 'IN_PROGRESS' },
    }).catch(() => {})

    return NextResponse.json({ success: true, data: reply })
  } catch (error: any) {
    await logServerError(error, { url: req.url, source: 'API' })
    const status = getErrorStatusCode(error)
    return NextResponse.json({ success: false, error: sanitizeErrorMessage(error) }, { status })
  }
}
