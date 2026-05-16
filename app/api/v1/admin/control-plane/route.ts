import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/server/admin-auth'
import { applyRateLimit, adminLimiter } from '@/lib/rate-limiter'
import { ADMIN_FEATURE_DEFAULTS, DEFAULT_SHARING_POLICY } from '@/lib/admin-control-plane'
import { getErrorStatusCode, sanitizeErrorMessage } from '@/lib/api-error'

async function getFeatureFlags() {
  const records = await (prisma as any).adminFeatureFlag.findMany()
  const byKey = new Map(records.map((record: any) => [record.key, record]))
  return ADMIN_FEATURE_DEFAULTS.map((item) => ({ ...item, ...(byKey.get(item.key) || {}) }))
}

export async function GET(req: NextRequest) {
  const rl = await applyRateLimit(req, adminLimiter)
  if (rl) return rl
  try {
    await requireAdmin()
    const type = req.nextUrl.searchParams.get('type') || 'features'

    if (type === 'presets') {
      const presets = await (prisma as any).adminDashboardPreset.findMany({ orderBy: [{ recommended: 'desc' }, { updatedAt: 'desc' }] })
      return NextResponse.json({ success: true, data: presets })
    }

    if (type === 'sharing') {
      const policy = await (prisma as any).adminSharingPolicy.findUnique({ where: { key: 'default' } })
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
    const body = await req.json()
    const type = typeof body.type === 'string' ? body.type : 'feature'

    if (type === 'sharing') {
      const updated = await (prisma as any).adminSharingPolicy.upsert({
      where: { key: 'default' },
      update: {
        publicSharingEnabled: Boolean(body.publicSharingEnabled),
        defaultExpirationDays: body.defaultExpirationDays === null || body.defaultExpirationDays === '' ? null : Number(body.defaultExpirationDays),
        requireExpiration: Boolean(body.requireExpiration),
        updatedAt: new Date(),
      },
      create: {
        key: 'default',
        publicSharingEnabled: Boolean(body.publicSharingEnabled),
        defaultExpirationDays: body.defaultExpirationDays === null || body.defaultExpirationDays === '' ? null : Number(body.defaultExpirationDays),
        requireExpiration: Boolean(body.requireExpiration),
        updatedAt: new Date(),
      },
    })
      return NextResponse.json({ success: true, data: updated })
    }

    const key = typeof body.key === 'string' ? body.key : null
    if (!key) return NextResponse.json({ success: false, error: 'key is required' }, { status: 400 })

    const updated = await (prisma as any).adminFeatureFlag.upsert({
    where: { key },
    update: {
      label: body.label || key,
      description: body.description ?? null,
      enabled: Boolean(body.enabled),
      internalOnly: Boolean(body.internalOnly),
      roleGate: body.roleGate || null,
      cohort: body.cohort || null,
      updatedAt: new Date(),
    },
    create: {
      key,
      label: body.label || key,
      description: body.description ?? null,
      enabled: Boolean(body.enabled),
      internalOnly: Boolean(body.internalOnly),
      roleGate: body.roleGate || null,
      cohort: body.cohort || null,
      updatedAt: new Date(),
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
    const body = await req.json()
    const preset = await (prisma as any).adminDashboardPreset.create({
    data: {
      name: body.name || `Preset ${new Date().toISOString().slice(0, 10)}`,
      segment: body.segment || 'all',
      description: body.description || null,
      layout: Array.isArray(body.layout) ? body.layout : [],
      active: body.active ?? true,
      recommended: body.recommended ?? false,
      updatedAt: new Date(),
    },
  })
    return NextResponse.json({ success: true, data: preset })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: sanitizeErrorMessage(error) }, { status: getErrorStatusCode(error) })
  }
}
