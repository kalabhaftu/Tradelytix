'use client'

import { useEffect, useRef } from 'react'
import { logger } from '@/lib/logger'

/**
 * Client-side error reporter.
 * Captures unhandled errors and promise rejections, sends to centralized logger.
 * Uses a Set to deduplicate identical errors within the same session.
 */
export function ClientErrorReporter() {
  const sentErrors = useRef(new Set<string>())

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
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
