import { NextRequest, NextResponse } from 'next/server'
import { FreeAccessType } from '@prisma/client'
import { z } from 'zod'
import { requireAdmin } from '@/server/admin-auth'
import { prisma } from '@/lib/prisma'
import { grantFreeAccess, revokeFreeAccess } from '@/lib/services/subscription-service'
import { applyRateLimit, adminLimiter } from '@/lib/rate-limiter'
import { createErrorResponse } from '@/lib/api-response'
import { getErrorStatusCode, sanitizeErrorMessage } from '@/lib/api-error'

const freeAccessSchema = z.object({
  email: z.string().trim().email().max(254),
  type: z.nativeEnum(FreeAccessType),
  expiresAt: z.string().date().optional().nullable(),
  note: z.string().trim().max(500).optional().nullable(),
}).strict()

const revokeSchema = z.object({
  email: z.string().trim().email().max(254),
  action: z.literal('revoke'),
}).strict()

export async function GET(request: NextRequest) {
  const rl = await applyRateLimit(request, adminLimiter)
  if (rl) return rl

  try {
    await requireAdmin()

    const invites = await prisma.freeAccessInvite.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: invites })
  } catch (error) {
    const msg = sanitizeErrorMessage(error)
    return NextResponse.json({ success: false, error: msg }, { status: getErrorStatusCode(error) })
  }
}

export async function POST(request: NextRequest) {
  const rl = await applyRateLimit(request, adminLimiter)
  if (rl) return rl

  try {
    const identity = await requireAdmin()
    const body = await request.json().catch(() => null)
    const parsed = freeAccessSchema.safeParse(body)

    if (!parsed.success) {
      return createErrorResponse('Validation failed', 400, parsed.error.flatten(), 'VALIDATION_ERROR')
    }

    if (parsed.data.type === FreeAccessType.until_date && !parsed.data.expiresAt) {
      return createErrorResponse('expiresAt is required for until_date type', 400)
    }

    const expiresAt = parsed.data.expiresAt ? new Date(`${parsed.data.expiresAt}T00:00:00.000Z`) : undefined
    if (expiresAt && expiresAt <= new Date()) {
      return createErrorResponse('expiresAt must be in the future', 400)
    }

    const invite = await grantFreeAccess({
      email: parsed.data.email.toLowerCase(),
      type: parsed.data.type,
      expiresAt,
      note: parsed.data.note || undefined,
      grantedBy: identity.internalUserId,
    })

    return NextResponse.json({ success: true, data: invite })
  } catch (error) {
    const msg = sanitizeErrorMessage(error)
    return NextResponse.json({ success: false, error: msg }, { status: getErrorStatusCode(error) })
  }
}

export async function PATCH(request: NextRequest) {
  const rl = await applyRateLimit(request, adminLimiter)
  if (rl) return rl

  try {
    await requireAdmin()
    const body = await request.json().catch(() => null)
    const parsed = revokeSchema.safeParse(body)

    if (!parsed.success) {
      return createErrorResponse('Validation failed', 400, parsed.error.flatten(), 'VALIDATION_ERROR')
    }

    const result = await revokeFreeAccess(parsed.data.email.toLowerCase())
    if (!result) {
      return NextResponse.json({ success: false, error: 'Invite not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    const msg = sanitizeErrorMessage(error)
    return NextResponse.json({ success: false, error: msg }, { status: getErrorStatusCode(error) })
  }
}
