import { NextResponse, NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/server/admin-auth'
import { applyRateLimit, adminLimiter } from '@/lib/rate-limiter'
import { logServerError } from '@/lib/error-logger'
import { deletePublicStorageUrls } from '@/server/storage-admin'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rl = await applyRateLimit(req, adminLimiter)
  if (rl) return rl

  try {
    await requireAdmin()
    const { id } = await params
    const body = await req.json()

    const updated = await prisma.feedback.update({
      where: { id },
      data: { status: body.status },
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error: any) {
    await logServerError(error, { url: req.url, source: 'API' })
    const status = error.message?.includes('Forbidden') ? 403 : 500
    return NextResponse.json({ success: false, error: error.message }, { status })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rl = await applyRateLimit(req, adminLimiter)
  if (rl) return rl

  try {
    await requireAdmin()
    const { id } = await params

    const feedback = await prisma.feedback.findUnique({
      where: { id },
      select: { id: true, attachments: true },
    })

    if (!feedback) {
      return NextResponse.json({ success: false, error: 'Feedback not found' }, { status: 404 })
    }

    const attachmentUrls = Array.isArray(feedback.attachments)
      ? feedback.attachments
          .map((attachment) => {
            if (!attachment || typeof attachment !== 'object') return null
            const url = (attachment as Record<string, unknown>).url
            return typeof url === 'string' ? url : null
          })
          .filter((url): url is string => Boolean(url))
      : []

    await prisma.feedback.delete({ where: { id } })

    if (attachmentUrls.length > 0) {
      deletePublicStorageUrls(attachmentUrls).catch(() => {
        // Attachment cleanup is best-effort; DB deletion must still succeed.
      })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    await logServerError(error, { url: req.url, source: 'API' })
    const status = error.message?.includes('Forbidden') ? 403 : 500
    return NextResponse.json({ success: false, error: error.message }, { status })
  }
}
