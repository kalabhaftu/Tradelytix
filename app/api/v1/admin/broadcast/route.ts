import { NextRequest, NextResponse } from 'next/server'
import { NotificationPriority, NotificationType } from '@prisma/client'
import { requireAdmin } from '@/server/admin-auth'
import { prisma } from '@/lib/prisma'
import { formatNoteContent } from '@/lib/utils'

const BATCH_SIZE = 200

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
    const body = await request.json()
    const title = String(body.title || '').trim()
    const content = String(body.content || '').trim()
    const priority =
      body.priority && Object.values(NotificationPriority).includes(body.priority)
        ? body.priority
        : NotificationPriority.MEDIUM

    if (!title || !content) {
      return NextResponse.json(
        { success: false, error: 'Title and content are required' },
        { status: 400 }
      )
    }

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
          title: title.slice(0, 200),
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

    return NextResponse.json({
      success: true,
      data: { recipients: users.length },
    })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to send broadcast' },
      { status: 500 }
    )
  }
}
