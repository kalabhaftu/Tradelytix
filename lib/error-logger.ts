import { prisma } from '@/lib/prisma'
import { ErrorSource, ErrorLevel } from '@prisma/client'
import { shouldIgnoreError } from '@/lib/logger'

interface ErrorLogInput {
  source: ErrorSource
  level?: ErrorLevel
  message: string
  stack?: string
  url?: string
  userId?: string
  metadata?: Record<string, unknown>
  ipAddress?: string
}

/**
 * Log an error to the ErrorLog table.
 * Fire-and-forget — never throws, never blocks the caller.
 */
export async function logError(input: ErrorLogInput): Promise<void> {
  try {
    const messageStr = String(input.message || '')
    if (shouldIgnoreError(messageStr, input.metadata)) {
      return
    }

    await prisma.errorLog.create({
      data: {
        source: input.source,
        level: input.level ?? 'ERROR',
        message: messageStr.slice(0, 2000),
        stack: input.stack?.slice(0, 5000),
        url: input.url?.slice(0, 500),
        userId: input.userId,
        metadata: input.metadata as any,
        ipAddress: input.ipAddress,
      },
    })
  } catch (err) {
    // Last resort — log to console if DB write fails
    console.error('[ErrorLogger] Failed to persist error log:', err)
  }
}

/**
 * Log a server/API error with request context.
 */
export async function logServerError(
  error: unknown,
  context: {
    url?: string
    userId?: string
    ipAddress?: string
    source?: ErrorSource
    metadata?: Record<string, unknown>
  } = {}
): Promise<void> {
  const err = error instanceof Error ? error : new Error(String(error))

  await logError({
    source: context.source ?? 'SERVER',
    level: 'ERROR',
    message: err.message,
    stack: err.stack,
    url: context.url,
    userId: context.userId,
    ipAddress: context.ipAddress,
    metadata: context.metadata,
  })
}

/**
 * Cleanup old error logs (older than given days).
 */
export async function cleanupOldErrorLogs(olderThanDays: number = 30): Promise<number> {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - olderThanDays)

  const result = await prisma.errorLog.deleteMany({
    where: { createdAt: { lt: cutoff } },
  })

  return result.count
}
