import { NextResponse, NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/server/admin-auth'
import { applyRateLimit, adminLimiter } from '@/lib/rate-limiter'
import { sanitizeErrorMessage, getErrorStatusCode } from '@/lib/api-error'
import { logServerError } from '@/lib/error-logger'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rl = await applyRateLimit(req, adminLimiter)
  if (rl) return rl

  try {
    await requireAdmin()
    const { id } = await params
    const body = await req.json()

    if (!body.message || typeof body.message !== 'string' || body.message.trim().length === 0) {
      return NextResponse.json({ success: false, error: 'Reply message is required' }, { status: 400 })
    }

    const feedback = await prisma.feedback.findUnique({
      where: { id },
      select: { userId: true, subject: true },
    })

    if (!feedback) {
      return NextResponse.json({ success: false, error: 'Feedback not found' }, { status: 404 })
    }

    // Create reply
    const reply = await prisma.feedbackReply.create({
      data: {
        feedbackId: id,
        message: body.message.trim(),
      },
    })

    // Send notification to user (if they still exist)
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
              message: `Your feedback "${feedback.subject}" has received a reply: ${body.message.trim().slice(0, 200)}`,
              data: { feedbackId: id, replyId: reply.id },
              actionRequired: false,
            },
          })
        }
        // If user deleted their account, silently skip notification
      } catch (notifError) {
        // Graceful failure — reply was saved, notification failed
        console.warn('[AdminFeedback] Notification send failed (user may be deleted):', notifError)
      }
    }

    // Update feedback status to IN_PROGRESS if it was OPEN
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
