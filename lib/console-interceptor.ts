/**
 * Console interceptor for production environment
 * Redirects logger.warn and logger.error to the centralized logger
 */
import logger from './logger'

const originalConsole = {
  log: typeof window !== 'undefined' ? window.console.log : logger.info,
  warn: typeof window !== 'undefined' ? window.console.warn : logger.warn,
  error: typeof window !== 'undefined' ? window.console.error : logger.error,
  info: typeof window !== 'undefined' ? window.console.info : console.info,
  debug: typeof window !== 'undefined' ? window.console.debug : console.debug
}

let isIntercepting = false

/**
 * Safe stringify that handles circular references
 */
function safeStringify(obj: any): string {
  const cache = new Set()
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (cache.has(value)) {
        return '[Circular]'
      }
      cache.add(value)
    }
    return value
  })
}

/**
 * Apply console interception for production
 */
export function applyConsoleInterceptor() {
  if (typeof window === 'undefined') return // Server-side interception handled differently if needed
  
  // Only apply in production
  if (process.env.NODE_ENV !== 'production') return
  
  // Prevent double application
  if ((window.console as any).__isIntercepted) return

  // Store original console for the logger to bypass interception if needed
  ;(window as any).__originalConsole = originalConsole

  const intercept = (level: 'warn' | 'error' | 'info', originalMethod: Function) => {
    return (...args: any[]) => {
      // Recursion guard
      if (isIntercepting) {
        return originalMethod.apply(window.console, args)
      }

      isIntercepting = true
      try {
        const message = args
          .map(arg => typeof arg === 'string' ? arg : safeStringify(arg))
          .join(' ')

    if (level === 'error') {
          logger.error({ originalArgs: args as any }, message)
        } else if (level === 'warn') {
          logger.warn({ originalArgs: args as any }, message)
        } else {
          logger.info({ originalArgs: args as any }, message)
        }
      } catch (err) {
        // If everything fails, use the original console to avoid losing the message entirely
        originalConsole.error('[ConsoleInterceptor] Failed to intercept:', err)
        originalMethod.apply(window.console, args)
      } finally {
        isIntercepting = false
      }

      // Also call original method so logs still appear in browser console for developers
      return originalMethod.apply(window.console, args)
    }
  }

  window.console.warn = intercept('warn', originalConsole.warn)
  window.console.error = intercept('error', originalConsole.error)
  window.console.info = intercept('info', originalConsole.info)
  
  ;(window.console as any).__isIntercepted = true
}

/**
 * Restore original console methods
 */
export function restoreConsole() {
  if (typeof window === 'undefined') return
  
  window.console.log = originalConsole.log
  window.console.warn = originalConsole.warn
  window.console.error = originalConsole.error
  window.console.info = originalConsole.info
  window.console.debug = originalConsole.debug
  
  ;(window.console as any).__isIntercepted = false
}
