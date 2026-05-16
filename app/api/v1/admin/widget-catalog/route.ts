import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/server/admin-auth'
import { applyRateLimit, adminLimiter } from '@/lib/rate-limiter'
import { ADMIN_WIDGET_DEFAULTS } from '@/lib/admin-control-plane'
import { getErrorStatusCode, sanitizeErrorMessage } from '@/lib/api-error'
import { createErrorResponse } from '@/lib/api-response'

const widgetStatusSchema = z.enum(['stable', 'review', 'legacy', 'replaced'])
const widgetTypes = new Set<string>(ADMIN_WIDGET_DEFAULTS.map((widget) => widget.widgetType))

const widgetSettingsSchema = z.object({
  widgetType: z.string().trim().min(1).max(80),
  label: z.string().trim().min(1).max(120).optional().nullable(),
  description: z.string().trim().max(500).optional().nullable(),
  visible: z.boolean().optional(),
  recommended: z.boolean().optional(),
  deprecated: z.boolean().optional(),
  status: widgetStatusSchema.optional(),
  premiumOnly: z.boolean().optional(),
  roleGate: z.string().trim().max(64).optional().nullable(),
}).strict()

async function getCatalog() {
  const records = await prisma.adminWidgetSetting.findMany()
  const byType = new Map(records.map((record) => [record.widgetType, record]))
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

    const body = await req.json().catch(() => null)
    const parsed = widgetSettingsSchema.safeParse(body)

    if (!parsed.success) {
      return createErrorResponse('Validation failed', 400, parsed.error.flatten(), 'VALIDATION_ERROR')
    }

    if (!widgetTypes.has(parsed.data.widgetType)) {
      return createErrorResponse('Unknown widgetType', 400)
    }

    const { widgetType, ...data } = parsed.data
    const updated = await prisma.adminWidgetSetting.upsert({
      where: { widgetType },
      update: data,
      create: {
        widgetType,
        label: data.label ?? null,
        description: data.description ?? null,
        visible: data.visible ?? true,
        recommended: data.recommended ?? false,
        deprecated: data.deprecated ?? false,
        status: data.status ?? 'stable',
        premiumOnly: data.premiumOnly ?? false,
        roleGate: data.roleGate ?? null,
      },
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: sanitizeErrorMessage(error) }, { status: getErrorStatusCode(error) })
  }
}
