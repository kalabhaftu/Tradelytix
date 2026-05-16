/**
 * Admin Promo Codes API
 * GET  - List promo codes
 * POST - Create promo code
 * PATCH - Update/disable promo code
 */

import { NextRequest, NextResponse } from 'next/server'
import { PromoApplicability, PromoType } from '@prisma/client'
import { z } from 'zod'
import { requireAdmin } from '@/server/admin-auth'
import { prisma } from '@/lib/prisma'
import { applyRateLimit, adminLimiter } from '@/lib/rate-limiter'
import { createErrorResponse } from '@/lib/api-response'

const promoCodeSchema = z.object({
  code: z.string().trim().min(3).max(40).regex(/^[A-Za-z0-9_-]+$/),
  type: z.nativeEnum(PromoType),
  value: z.coerce.number().finite().min(0).max(100000),
  maxUses: z.coerce.number().int().min(1).max(100000).optional().nullable(),
  validFrom: z.string().datetime({ offset: true }).optional().nullable(),
  validUntil: z.string().datetime({ offset: true }).optional().nullable(),
  applicability: z.nativeEnum(PromoApplicability).optional().default(PromoApplicability.signup_only),
}).strict()

const promoCodeUpdateSchema = z.object({
  id: z.string().trim().min(1),
  isActive: z.boolean().optional(),
  maxUses: z.coerce.number().int().min(1).max(100000).optional().nullable(),
  validUntil: z.string().datetime({ offset: true }).optional().nullable(),
  applicability: z.nativeEnum(PromoApplicability).optional(),
}).strict()

export async function GET(request: NextRequest) {
  const rl = await applyRateLimit(request, adminLimiter)
  if (rl) return rl

  try {
    await requireAdmin()

    const codes = await prisma.promoCode.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { PromoRedemption: true } },
      },
    })

    return NextResponse.json({ success: true, data: codes })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unauthorized'
    return NextResponse.json({ success: false, error: msg }, { status: 403 })
  }
}

export async function POST(request: NextRequest) {
  const rl = await applyRateLimit(request, adminLimiter)
  if (rl) return rl

  try {
    const identity = await requireAdmin()
    const body = await request.json().catch(() => null)
    const parsed = promoCodeSchema.safeParse(body)

    if (!parsed.success) {
      return createErrorResponse('Validation failed', 400, parsed.error.flatten(), 'VALIDATION_ERROR')
    }

    const data = parsed.data
    const code = data.code.toUpperCase()
    const validFrom = data.validFrom ? new Date(data.validFrom) : new Date()
    const validUntil = data.validUntil ? new Date(data.validUntil) : null

    if (validUntil && validUntil <= validFrom) {
      return createErrorResponse('validUntil must be after validFrom', 400)
    }

    const existing = await prisma.promoCode.findUnique({ where: { code } })
    if (existing) {
      return NextResponse.json({ success: false, error: 'Promo code already exists' }, { status: 409 })
    }

    const promo = await prisma.promoCode.create({
      data: {
        code,
        type: data.type,
        applicability: data.applicability,
        value: data.value,
        maxUses: data.maxUses ?? null,
        validFrom,
        validUntil,
        createdBy: identity.internalUserId,
      },
    })

    return NextResponse.json({ success: true, data: promo })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed'
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const rl = await applyRateLimit(request, adminLimiter)
  if (rl) return rl

  try {
    await requireAdmin()
    const body = await request.json().catch(() => null)
    const parsed = promoCodeUpdateSchema.safeParse(body)

    if (!parsed.success) {
      return createErrorResponse('Validation failed', 400, parsed.error.flatten(), 'VALIDATION_ERROR')
    }

    const { id, validUntil, ...rest } = parsed.data
    const updateData = {
      ...rest,
      ...(validUntil !== undefined ? { validUntil: validUntil ? new Date(validUntil) : null } : {}),
    }

    const promo = await prisma.promoCode.update({ where: { id }, data: updateData })
    return NextResponse.json({ success: true, data: promo })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed'
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
