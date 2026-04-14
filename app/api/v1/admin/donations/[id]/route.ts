import { NextResponse, NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/server/admin-auth'
import { applyRateLimit, adminLimiter } from '@/lib/rate-limiter'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rl = await applyRateLimit(req, adminLimiter)
  if (rl) return rl

  try {
    await requireAdmin()
    const { id } = await params
    const body = await req.json()

    const updated = await prisma.donationAddress.update({
      where: { id },
      data: {
        ...(body.token && { token: body.token.trim() }),
        ...(body.network && { network: body.network.trim() }),
        ...(body.address && { address: body.address.trim() }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder }),
      },
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error: any) {
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

    await prisma.donationAddress.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    const status = error.message?.includes('Forbidden') ? 403 : 500
    return NextResponse.json({ success: false, error: error.message }, { status })
  }
}
