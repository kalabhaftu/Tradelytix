import { db } from '@/lib/db/client'
import * as schema from '@/lib/db/schema'
import { lt } from 'drizzle-orm'

import logger from '@/lib/logger';
import { ErrorSourceEnum, ErrorLevelEnum } from '@/lib/db/schema';

type ErrorSource = (typeof ErrorSourceEnum.enumValues)[number];
type ErrorLevel = (typeof ErrorLevelEnum.enumValues)[number];

export function shouldIgnoreError(message: string, metadata?: Record<string, unknown>) {
  return false;
}

interface ErrorLogInput {
  source: ErrorSource
  level?: ErrorLevel | undefined
  message: string
  stack?: string | undefined
  url?: string | undefined
  userId?: string | undefined
  metadata?: Record<string, unknown> | undefined
  ipAddress?: string | undefined
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

    await db.insert(schema.ErrorLog).values({
      source: input.source,
      level: input.level ?? 'ERROR',
      message: messageStr.slice(0, 2000),
      stack: input.stack?.slice(0, 5000),
      url: input.url?.slice(0, 500),
      userId: input.userId,
      metadata: input.metadata as any,
      ipAddress: input.ipAddress,
    })
  } catch (err) {
    // Last resort — log to console if DB write fails
    logger.error({ err }, '[ErrorLogger] Failed to persist error log:')
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
async function cleanupOldErrorLogs(olderThanDays: number = 30): Promise<number> {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - olderThanDays)

  const result = await db.delete(schema.ErrorLog)
    .where(lt(schema.ErrorLog.createdAt, cutoff))
    .returning({ id: schema.ErrorLog.id })

  return result.length
}
