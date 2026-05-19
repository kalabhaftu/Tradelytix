'use client'

import { useEffect, useRef } from 'react'
import { logger } from '@/lib/logger'

function isNextRedirectError(error: unknown): boolean {
  if (!error) return false

  const message = error instanceof Error ? error.message : String(error)
  const digest = typeof error === 'object' && error !== null && 'digest' in error
    ? String(error.digest)
    : ''

  return message.includes('NEXT_REDIRECT') || digest.startsWith('NEXT_REDIRECT')
}

/**
 * Client-side error reporter.
 * Captures unhandled errors and promise rejections, sends to centralized logger.
 * Uses a Set to deduplicate identical errors within the same session.
 */
export function ClientErrorReporter() {
  const sentErrors = useRef(new Set<string>())

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (isNextRedirectError(event.error || event.message)) return

      const key = `${event.message}:${event.filename}:${event.lineno}`
      if (sentErrors.current.has(key)) return
      sentErrors.current.add(key)

      logger.error(event.message || 'Unhandled Client Error', {
        stack: event.error?.stack,
        metadata: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          userAgent: navigator.userAgent,
        },
      }, 'CLIENT_BOUNDARY')
    }

    const handleRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason
      if (isNextRedirectError(error)) return

      const message = error?.message || String(error) || 'Unhandled Promise Rejection'
      const key = `rejection:${message}`

      if (sentErrors.current.has(key)) return
      sentErrors.current.add(key)

      logger.error(message, {
        stack: error?.stack,
        metadata: {
          type: 'unhandledrejection',
          userAgent: navigator.userAgent,
        },
      }, 'CLIENT_PROMISE')
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleRejection)
    }
  }, [])

  return null
}
