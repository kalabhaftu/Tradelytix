// Structured logging utility with centralized reporting
import { ErrorLevel, ErrorSource } from '@prisma/client'

type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL'

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context?: string
  data?: unknown
  stack?: string
  url?: string
  env?: string
}

const isProduction = process.env.NODE_ENV === 'production'

/**
 * Forwards an error log to the centralized API endpoint.
 */
const IGNORED_ERRORS = [
  'user not authenticated',
  'unauthorized',
  'token expired',
  'invalid token',
  'auth-token',
  'lock:sb-'
]

/**
 * Checks if the error message or metadata represents a normal authentication
 * event that shouldn't pollute the persistent error log database table.
 */
export function shouldIgnoreError(message: string, metadata?: any): boolean {
  const msg = (message || '').toLowerCase()
  if (IGNORED_ERRORS.some(err => msg.includes(err))) {
    return true
  }

  if (metadata && typeof metadata === 'object') {
    try {
      const metaStr = JSON.stringify(metadata).toLowerCase()
      if (IGNORED_ERRORS.some(err => metaStr.includes(err))) {
        return true
      }
    } catch {}
  }

  return false
}

/**
 * Forwards an error log to the centralized API endpoint.
 */
async function reportToApi(entry: LogEntry) {
  try {
    if (shouldIgnoreError(entry.message, entry.data)) {
      return
    }

    const baseUrl = typeof window !== 'undefined' ? '' : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    
    // Map internal LogLevel to Prisma ErrorLevel
    let prismaLevel: ErrorLevel = 'ERROR'
    if (entry.level === 'WARN') prismaLevel = 'WARNING'
    if (entry.level === 'CRITICAL') prismaLevel = 'CRITICAL'

    // Safe serialization for metadata to handle circular references
    const safeData = entry.data ? (() => {
      try {
        const cache = new WeakSet();
        const stringified = JSON.stringify(entry.data, (key, value) => {
          if (typeof value === 'object' && value !== null) {
            if (cache.has(value)) return '[Circular]';
            cache.add(value);
            if (key === 'originalArgs') return undefined;
          }
          return value;
        });
        return JSON.parse(stringified);
      } catch (e) {
        return { error: 'Failed to serialize metadata', details: String(e) };
      }
    })() : undefined

    if (typeof window === 'undefined') {
      try {
        const { prisma } = await import('@/lib/prisma')
        const { getResolvedUserIdentitySafe } = await import('@/server/user-identity')
        const { extractIP } = await import('@/server/geolocation')
        const { headers } = await import('next/headers')

        const headersList = await headers()
        const ip = extractIP(headersList)
        const identity = await getResolvedUserIdentitySafe()

        await prisma.errorLog.create({
          data: {
            source: 'SERVER',
            level: prismaLevel,
            message: entry.message.slice(0, 2000),
            stack: entry.stack ? entry.stack.slice(0, 5000) : null,
            url: entry.url || headersList.get('referer')?.slice(0, 500) || null,
            userId: identity?.internalUserId || null,
            metadata: {
              ...safeData,
              context: entry.context,
              timestamp: entry.timestamp
            } as any,
            ipAddress: ip,
          },
        })
        return
      } catch (dbErr) {
        console.error('[Logger] Direct server database write failed:', dbErr)
      }
    }

    await fetch(`${baseUrl}/api/v1/errors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: entry.message,
        level: prismaLevel,
        source: typeof window !== 'undefined' ? 'CLIENT' : 'SERVER',
        stack: entry.stack,
        url: entry.url || (typeof window !== 'undefined' ? window.location.href : undefined),
        metadata: {
          ...safeData,
          context: entry.context,
          timestamp: entry.timestamp
        },
      }),
    })
  } catch (err) {
    // Fail silently in logger to avoid infinite loops or blocking
    // Use the original console to avoid being intercepted if we're in production
    const targetConsole = (typeof window !== 'undefined' && (window.console as any).__isIntercepted) 
      ? (window as any).__originalConsole || console 
      : console

    if (!isProduction) {
      targetConsole.warn('[Logger] Failed to report to API:', err)
    }
  }
}

function formatLog(level: LogLevel, message: string, data?: unknown, context?: string): LogEntry {
  let stack: string | undefined
  let finalMessage = message

  if (data instanceof Error) {
    stack = data.stack
    finalMessage = `${message}: ${data.message}`
  }

  return {
    level,
    message: finalMessage,
    timestamp: new Date().toISOString(),
    context,
    data: data instanceof Error ? undefined : data,
    stack,
    env: process.env.NODE_ENV || 'development',
  }
}

function outputLog(level: LogLevel, logEntry: LogEntry): void {
  const isServer = typeof window === 'undefined'
  
  if (isProduction) {
    // In production, we always report ERROR and CRITICAL to API
    if (level === 'ERROR' || level === 'CRITICAL' || level === 'WARN') {
      reportToApi(logEntry)
    }

    // Server-side production logs: JSON for log aggregators
    if (isServer) {
      console.log(JSON.stringify(logEntry))
    }
  } else {
    // Development: Human-readable format
    const prefix = `[${level}${logEntry.context ? ` ${logEntry.context}` : ''}]`
    const args = [prefix, logEntry.message, logEntry.data || '']
    
    switch (level) {
      case 'DEBUG': console.debug(...args); break
      case 'INFO': console.info(...args); break
      case 'WARN': console.warn(...args); break
      case 'ERROR': 
      case 'CRITICAL': console.error(...args); break
    }
    
    // Also report to API in dev if requested (via metadata or similar) to test integration
  }
}

export const logger = {
  debug: (message: string, data?: unknown, context?: string) => {
    if (!isProduction) {
      const logEntry = formatLog('DEBUG', message, data, context)
      outputLog('DEBUG', logEntry)
    }
  },

  info: (message: string, data?: unknown, context?: string) => {
    const logEntry = formatLog('INFO', message, data, context)
    outputLog('INFO', logEntry)
  },

  warn: (message: string, data?: unknown, context?: string) => {
    const logEntry = formatLog('WARN', message, data, context)
    outputLog('WARN', logEntry)
  },

  error: (message: string, data?: unknown, context?: string) => {
    const logEntry = formatLog('ERROR', message, data, context)
    outputLog('ERROR', logEntry)
  },

  critical: (message: string, data?: unknown, context?: string) => {
    const logEntry = formatLog('CRITICAL', message, data, context)
    outputLog('CRITICAL', logEntry)
  },
}
