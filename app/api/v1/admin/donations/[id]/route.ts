import { NextResponse, NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/server/admin-auth'
import { applyRateLimit, adminLimiter } from '@/lib/rate-limiter'
import { sanitizeErrorMessage, getErrorStatusCode } from '@/lib/api-error'
import { createErrorResponse } from '@/lib/api-response'

const donationAddressUpdateSchema = z.object({
  token: z.string().trim().min(1).max(32).optional(),
  network: z.string().trim().min(1).max(64).optional(),
  address: z.string().trim().min(8).max(256).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.coerce.number().int().min(0).max(10000).optional(),
}).strict()

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rl = await applyRateLimit(req, adminLimiter)
  if (rl) return rl

  try {
    await requireAdmin()
    const { id } = await params
    const body = await req.json().catch(() => null)
    const parsed = donationAddressUpdateSchema.safeParse(body)

    if (!parsed.success) {
      return createErrorResponse('Validation failed', 400, parsed.error.flatten(), 'VALIDATION_ERROR')
    }

    const updated = await prisma.donationAddress.update({
      where: { id },
      data: parsed.data,
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error: any) {
    const status = getErrorStatusCode(error)
    return NextResponse.json({ success: false, error: sanitizeErrorMessage(error) }, { status })
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
    const status = getErrorStatusCode(error)
    return NextResponse.json({ success: false, error: sanitizeErrorMessage(error) }, { status })
  }
}
