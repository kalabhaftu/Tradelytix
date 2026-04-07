import { NextResponse, NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/server/admin-auth'
import { applyRateLimit, adminLimiter } from '@/lib/rate-limiter'
import { logServerError } from '@/lib/error-logger'

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

    await prisma.feedback.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    await logServerError(error, { url: req.url, source: 'API' })
    const status = error.message?.includes('Forbidden') ? 403 : 500
    return NextResponse.json({ success: false, error: error.message }, { status })
  }
}
