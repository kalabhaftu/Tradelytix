import { NextResponse, NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/server/admin-auth'
import { applyRateLimit, adminLimiter } from '@/lib/rate-limiter'
import { sanitizeErrorMessage, getErrorStatusCode } from '@/lib/api-error'

interface RouteParams {
  params: Promise<{ flagId: string }>
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const rl = await applyRateLimit(req, adminLimiter)
  if (rl) return rl

  try {
    await requireAdmin()

    const { flagId } = await params
    const body = await req.json()

    const existing = await prisma.adminFeatureFlag.findUnique({
      where: { id: flagId },
    })
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Feature flag not found' }, { status: 404 })
    }

    const updateData: any = {}
    if (body.enabled !== undefined) updateData.enabled = Boolean(body.enabled)
    if (body.label !== undefined) updateData.label = String(body.label)
    if (body.description !== undefined) updateData.description = String(body.description)
    if (body.internalOnly !== undefined) updateData.internalOnly = Boolean(body.internalOnly)
    if (body.roleGate !== undefined) updateData.roleGate = body.roleGate
    if (body.cohort !== undefined) updateData.cohort = body.cohort

    const updated = await prisma.adminFeatureFlag.update({
      where: { id: flagId },
      data: updateData,
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error: any) {
    const status = getErrorStatusCode(error)
    return NextResponse.json({ success: false, error: sanitizeErrorMessage(error) }, { status })
  }
}
