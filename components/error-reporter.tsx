'use client'

import { useEffect, useCallback, useRef } from 'react'

/**
 * Client-side error reporter.
 * Captures unhandled errors and promise rejections, sends to server.
 * Debounced to prevent flood.
 */
export function ClientErrorReporter() {
  const sentErrors = useRef(new Set<string>())
  const queueRef = useRef<Array<Record<string, unknown>>>([])
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const flushQueue = useCallback(() => {
    const batch = queueRef.current.splice(0, 5) // max 5 per flush
    batch.forEach(payload => {
      const key = `${payload.message}:${payload.url}`
      if (sentErrors.current.has(key as string)) return
      sentErrors.current.add(key as string)

      fetch('/api/v1/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => {})
    })
  }, [])

  const enqueueError = useCallback((payload: Record<string, unknown>) => {
    queueRef.current.push(payload)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(flushQueue, 1000) // debounce 1s
  }, [flushQueue])

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      enqueueError({
        message: event.message || 'Unknown error',
        stack: event.error?.stack,
        url: window.location.href,
        level: 'ERROR',
        metadata: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          userAgent: navigator.userAgent,
        },
      })
    }

    const handleRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason
      enqueueError({
        message: error?.message || String(error) || 'Unhandled Promise Rejection',
        stack: error?.stack,
        url: window.location.href,
        level: 'ERROR',
        metadata: {
          type: 'unhandledrejection',
          userAgent: navigator.userAgent,
        },
      })
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleRejection)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [enqueueError])

  return null // No UI, just side-effect
}
