import { toast } from 'sonner'

const CHUNK_RETRY_KEY = 'chunk_load_retry_once'
const CHUNK_RETRY_CLEAR_DELAY_MS = 30000

let globalErrorHandlersAttached = false
let chunkRecoveryInProgress = false
let chunkFailureToastShown = false

/**
 * Detects if an error is a Server Action mismatch error
 * This happens when the client has old action IDs after a new deployment
 */
export function isServerActionMismatchError(error: unknown): boolean {
  if (!error) return false

  const errorMessage = error instanceof Error ? error.message : String(error)

  return (
    errorMessage.includes('Failed to find Server Action') ||
    errorMessage.includes('This request might be from an older or newer deployment') ||
    (errorMessage.includes('Cannot read properties of undefined') && errorMessage.includes('workers'))
  )
}

/**
 * Detects chunk loading/runtime asset failures.
 */
export function isChunkLoadError(error: unknown): boolean {
  if (!error) return false

  const errorMessage = error instanceof Error ? error.message : String(error)

  return (
    errorMessage.includes('ChunkLoadError') ||
    errorMessage.includes('Loading chunk') ||
    errorMessage.includes('Failed to fetch dynamically imported module') ||
    errorMessage.includes('ERR_HTTP2_PING_FAILED') ||
    errorMessage.includes('timeout') && errorMessage.includes('/_next/static/chunks/')
  )
}

function reloadPage() {
  if (typeof window === 'undefined') return
  window.location.reload()
}

function handleChunkRecovery(showToast: boolean): boolean {
  if (typeof window === 'undefined') return true

  if (chunkRecoveryInProgress) return true
  chunkRecoveryInProgress = true

  const alreadyRetried = window.sessionStorage.getItem(CHUNK_RETRY_KEY) === '1'

  if (!alreadyRetried) {
    window.sessionStorage.setItem(CHUNK_RETRY_KEY, '1')

    if (showToast) {
      toast.info('Connection interrupted. Reloading app…', {
        duration: 1200,
        description: 'Retrying failed asset load',
      })
    }

    window.setTimeout(() => {
      reloadPage()
    }, 800)

    return true
  }

  // Second failure: stop auto-looping and show explicit action.
  chunkRecoveryInProgress = false

  if (showToast && !chunkFailureToastShown) {
    chunkFailureToastShown = true
    toast.error('Failed to load application assets', {
      duration: Infinity,
      description: 'Your network interrupted static chunk loading. Please refresh to retry.',
      action: {
        label: 'Refresh',
        onClick: () => {
          window.sessionStorage.removeItem(CHUNK_RETRY_KEY)
          reloadPage()
        },
      },
    })
  }

  return true
}

/**
 * Detects if an error is a deployment-related error
 */
export function isDeploymentError(error: unknown): boolean {
  if (!error) return false

  return isServerActionMismatchError(error) || isChunkLoadError(error)
}

/**
 * Handles Server Action errors gracefully
 * Shows user-friendly message and auto-refreshes if needed
 */
export function handleServerActionError(error: unknown, options?: {
  autoRefresh?: boolean
  refreshDelay?: number
  showToast?: boolean
  context?: string
}): boolean {
  const {
    autoRefresh = true,
    refreshDelay = 2000,
    showToast = true,
  } = options || {}

  if (isChunkLoadError(error)) {
    return handleChunkRecovery(showToast)
  }

  if (isServerActionMismatchError(error)) {
    if (showToast) {
      if (autoRefresh) {
        toast.info('App updated. Refreshing page...', {
          duration: refreshDelay,
          description: 'A new version was deployed',
        })

        setTimeout(() => {
          reloadPage()
        }, refreshDelay)
      } else {
        toast.info('App version mismatch detected', {
          duration: Infinity,
          description: 'Please refresh the page to continue',
          action: {
            label: 'Refresh',
            onClick: () => reloadPage(),
          },
        })
      }
    } else if (autoRefresh) {
      // Silent refresh without toast
      setTimeout(() => {
        reloadPage()
      }, refreshDelay)
    }

    return true // Error was handled
  }

  return false // Error was not a deployment error
}

/**
 * Wraps an async function with Server Action error handling
 * Usage: const safeAction = withServerActionErrorHandling(myAction)
 */
export function withServerActionErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options?: {
    autoRefresh?: boolean
    refreshDelay?: number
    showToast?: boolean
    context?: string
    onError?: (error: unknown) => void
  }
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    try {
      return await fn(...args)
    } catch (error) {
      const wasHandled = handleServerActionError(error, options)

      if (!wasHandled) {
        // If it wasn't a deployment error, call the custom error handler
        options?.onError?.(error)
        throw error // Re-throw for normal error handling
      }

      // Return a rejected promise for deployment errors
      return Promise.reject(error)
    }
  }) as T
}

/**
 * Global error handler for Server Actions
 * Can be attached to window.addEventListener('error') or 'unhandledrejection'
 */
export function setupGlobalServerActionErrorHandler() {
  if (typeof window === 'undefined') return
  if (globalErrorHandlersAttached) return

  globalErrorHandlersAttached = true

  // Clear one-time retry guard after stable runtime window.
  window.setTimeout(() => {
    window.sessionStorage.removeItem(CHUNK_RETRY_KEY)
    chunkRecoveryInProgress = false
    chunkFailureToastShown = false
  }, CHUNK_RETRY_CLEAR_DELAY_MS)

  // Handle unhandled promise rejections (Server Actions often throw these)
  window.addEventListener('unhandledrejection', (event) => {
    if (isDeploymentError(event.reason)) {
      event.preventDefault() // Prevent console error
      handleServerActionError(event.reason, {
        autoRefresh: true,
        refreshDelay: 2000,
        showToast: true,
        context: 'Unhandled Promise Rejection'
      })
    }
  })

  // Handle regular errors
  window.addEventListener('error', (event) => {
    if (isDeploymentError(event.error)) {
      event.preventDefault() // Prevent console error
      handleServerActionError(event.error, {
        autoRefresh: true,
        refreshDelay: 2000,
        showToast: true,
        context: 'Global Error'
      })
    }
  })
}
