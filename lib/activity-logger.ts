import { db } from '@/lib/db/client'
import { ActivityLog } from '@/lib/db/schema'

interface LogActivityParams {
  userId: string
  action: string
  entity: string
  entityId?: string | null
  metadata?: Record<string, any> | null
  ipAddress?: string | null
}

/**
 * Fire-and-forget activity logger.
 * Creates a record in the ActivityLog table without blocking the caller.
 * Silently catches errors to never break the primary operation.
 */
export function logActivity(params: LogActivityParams): void {
  db.insert(ActivityLog)
    .values({
      userId: params.userId,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId ?? null,
      metadata: params.metadata ?? undefined,
      ipAddress: params.ipAddress ?? null,
    })
    .execute()
    .catch(() => {
      // Silently swallow — logging must never break the primary operation
    })
}

/**
 * Extract client IP from request headers (works behind Vercel/Cloudflare proxies).
 */
export function getClientIp(request: Request): string | null {
  const headers = new Headers(request.headers)
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    null
  )
}
