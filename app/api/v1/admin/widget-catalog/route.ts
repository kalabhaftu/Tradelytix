import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/server/admin-auth'
import { applyRateLimit, adminLimiter } from '@/lib/rate-limiter'
import { ADMIN_WIDGET_DEFAULTS } from '@/lib/admin-control-plane'
import { getErrorStatusCode, sanitizeErrorMessage } from '@/lib/api-error'

async function getCatalog() {
  const records = await (prisma as any).adminWidgetSetting.findMany()
  const byType = new Map(records.map((record: any) => [record.widgetType, record]))
  return ADMIN_WIDGET_DEFAULTS.map((item) => ({ ...item, ...(byType.get(item.widgetType) || {}) }))
}

export async function GET(req: NextRequest) {
  const rl = await applyRateLimit(req, adminLimiter)
  if (rl) return rl
  try {
    await requireAdmin()
    return NextResponse.json({ success: true, data: await getCatalog() })
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
    const widgetType = typeof body.widgetType === 'string' ? body.widgetType : null
    if (!widgetType) {
      return NextResponse.json({ success: false, error: 'widgetType is required' }, { status: 400 })
    }

    const allowed = ['label', 'description', 'visible', 'recommended', 'deprecated', 'status', 'premiumOnly', 'roleGate']
    const data: Record<string, unknown> = { updatedAt: new Date() }
    for (const key of allowed) {
      if (key in body) data[key] = body[key]
    }

    const updated = await (prisma as any).adminWidgetSetting.upsert({
      where: { widgetType },
      update: data,
      create: {
        widgetType,
        label: body.label ?? null,
        description: body.description ?? null,
        visible: body.visible ?? true,
        recommended: body.recommended ?? false,
        deprecated: body.deprecated ?? false,
        status: body.status ?? 'stable',
        premiumOnly: body.premiumOnly ?? false,
        roleGate: body.roleGate ?? null,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: sanitizeErrorMessage(error) }, { status: getErrorStatusCode(error) })
  }
}
