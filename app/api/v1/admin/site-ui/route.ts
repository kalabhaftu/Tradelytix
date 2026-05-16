import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/server/admin-auth'
import { getSiteUiSettings, updateSiteUiSettings } from '@/server/site-ui-settings'
import { applyRateLimit, adminLimiter } from '@/lib/rate-limiter'
import { createErrorResponse, createSuccessResponse } from '@/lib/api-response'

const siteUiSettingsSchema = z.object({
  showDonateButton: z.boolean().optional(),
  showFeedbackButton: z.boolean().optional(),
}).strict()

export async function GET(request: NextRequest) {
  const rl = await applyRateLimit(request, adminLimiter)
  if (rl) return rl

  try {
    await requireAdmin()
    const settings = await getSiteUiSettings()
    return createSuccessResponse(settings)
  } catch {
    return createErrorResponse('Unauthorized', 401)
  }
}

export async function PATCH(request: NextRequest) {
  const rl = await applyRateLimit(request, adminLimiter)
  if (rl) return rl

  try {
    await requireAdmin()
    const body = await request.json().catch(() => null)
    const parsed = siteUiSettingsSchema.safeParse(body)

    if (!parsed.success) {
      return createErrorResponse('Validation failed', 400, parsed.error.flatten(), 'VALIDATION_ERROR')
    }

    const settings = await updateSiteUiSettings(parsed.data)
    return createSuccessResponse(settings)
  } catch {
    return createErrorResponse('Unauthorized', 401)
  }
}
