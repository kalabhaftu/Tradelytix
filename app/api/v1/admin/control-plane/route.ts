import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/server/admin-auth'
import { applyRateLimit, adminLimiter } from '@/lib/rate-limiter'
import { ADMIN_FEATURE_DEFAULTS, DEFAULT_SHARING_POLICY } from '@/lib/admin-control-plane'
import { getErrorStatusCode, sanitizeErrorMessage } from '@/lib/api-error'
import { createErrorResponse } from '@/lib/api-response'

const controlPlaneTypeSchema = z.enum(['features', 'feature', 'presets', 'sharing'])
const featureKeys = new Set<string>(ADMIN_FEATURE_DEFAULTS.map((feature) => feature.key))

const sharingPolicySchema = z.object({
  type: z.literal('sharing'),
  publicSharingEnabled: z.boolean(),
  defaultExpirationDays: z.coerce.number().int().min(1).max(365).optional().nullable(),
  requireExpiration: z.boolean(),
}).strict()

const featureFlagSchema = z.object({
  type: z.enum(['feature', 'features']).optional().default('feature'),
  key: z.string().trim().min(1).max(80),
  label: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().max(500).optional().nullable(),
  enabled: z.boolean(),
  internalOnly: z.boolean().optional().default(false),
  roleGate: z.string().trim().max(64).optional().nullable(),
  cohort: z.string().trim().max(64).optional().nullable(),
}).strict()

const dashboardPresetSchema = z.object({
  name: z.string().trim().min(1).max(120),
  segment: z.string().trim().min(1).max(64).optional().default('all'),
  description: z.string().trim().max(500).optional().nullable(),
  layout: z.array(z.unknown()).max(200).optional().default([]),
  active: z.boolean().optional().default(true),
  recommended: z.boolean().optional().default(false),
}).strict()

async function getFeatureFlags() {
  const records = await prisma.adminFeatureFlag.findMany()
  const byKey = new Map(records.map((record) => [record.key, record]))
  return ADMIN_FEATURE_DEFAULTS.map((item) => ({ ...item, ...(byKey.get(item.key) || {}) }))
}

export async function GET(req: NextRequest) {
  const rl = await applyRateLimit(req, adminLimiter)
  if (rl) return rl
  try {
    await requireAdmin()
    const type = controlPlaneTypeSchema.safeParse(req.nextUrl.searchParams.get('type') || 'features')

    if (!type.success) {
      return createErrorResponse('Invalid control-plane type', 400)
    }

    if (type.data === 'presets') {
      const presets = await prisma.adminDashboardPreset.findMany({ orderBy: [{ recommended: 'desc' }, { updatedAt: 'desc' }] })
      return NextResponse.json({ success: true, data: presets })
    }

    if (type.data === 'sharing') {
      const policy = await prisma.adminSharingPolicy.findUnique({ where: { key: 'default' } })
      return NextResponse.json({ success: true, data: policy || DEFAULT_SHARING_POLICY })
    }

    return NextResponse.json({ success: true, data: await getFeatureFlags() })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: sanitizeErrorMessage(error) }, { status: getErrorStatusCode(error) })
  }
}

export async function PATCH(req: NextRequest) {
  const rl = await applyRateLimit(req, adminLimiter)
  if (rl) return rl
  try {
    await requireAdmin()
    const body = await req.json().catch(() => null)

    if (body?.type === 'sharing') {
      const parsed = sharingPolicySchema.safeParse(body)

      if (!parsed.success) {
        return createErrorResponse('Validation failed', 400, parsed.error.flatten(), 'VALIDATION_ERROR')
      }

      const { publicSharingEnabled, defaultExpirationDays, requireExpiration } = parsed.data
      const updated = await prisma.adminSharingPolicy.upsert({
        where: { key: 'default' },
        update: { publicSharingEnabled, defaultExpirationDays: defaultExpirationDays ?? null, requireExpiration },
        create: { key: 'default', publicSharingEnabled, defaultExpirationDays: defaultExpirationDays ?? null, requireExpiration },
      })
      return NextResponse.json({ success: true, data: updated })
    }

    const parsed = featureFlagSchema.safeParse(body)

    if (!parsed.success) {
      return createErrorResponse('Validation failed', 400, parsed.error.flatten(), 'VALIDATION_ERROR')
    }

    if (!featureKeys.has(parsed.data.key)) {
      return createErrorResponse('Unknown feature key', 400)
    }

    const updated = await prisma.adminFeatureFlag.upsert({
      where: { key: parsed.data.key },
      update: {
        label: parsed.data.label || parsed.data.key,
        description: parsed.data.description ?? null,
        enabled: parsed.data.enabled,
        internalOnly: parsed.data.internalOnly,
        roleGate: parsed.data.roleGate || null,
        cohort: parsed.data.cohort || null,
      },
      create: {
        key: parsed.data.key,
        label: parsed.data.label || parsed.data.key,
        description: parsed.data.description ?? null,
        enabled: parsed.data.enabled,
        internalOnly: parsed.data.internalOnly,
        roleGate: parsed.data.roleGate || null,
        cohort: parsed.data.cohort || null,
      },
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: sanitizeErrorMessage(error) }, { status: getErrorStatusCode(error) })
  }
}

export async function POST(req: NextRequest) {
  const rl = await applyRateLimit(req, adminLimiter)
  if (rl) return rl
  try {
    await requireAdmin()
    const body = await req.json().catch(() => null)
    const parsed = dashboardPresetSchema.safeParse(body)

    if (!parsed.success) {
      return createErrorResponse('Validation failed', 400, parsed.error.flatten(), 'VALIDATION_ERROR')
    }

    const preset = await prisma.adminDashboardPreset.create({
      data: {
        ...parsed.data,
        layout: parsed.data.layout as Prisma.InputJsonValue,
      },
    })
    return NextResponse.json({ success: true, data: preset })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: sanitizeErrorMessage(error) }, { status: getErrorStatusCode(error) })
  }
}
