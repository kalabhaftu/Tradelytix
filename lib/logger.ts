import pino from 'pino'

const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  ...(process.env.NODE_ENV === 'development'
    ? { transport: { target: 'pino-pretty', options: { colorize: true } } }
    : {}),
})

// Named re-exports so both `import logger from '@/lib/logger'`
// and `import { logger } from '@/lib/logger'` work seamlessly.
export { logger }
export default logger

// Known benign error patterns that can safely be dropped
const IGNORE_PATTERNS = [
  'ResizeObserver loop',
  'The play() request was interrupted',
  'AbortError',
  'NetworkError when attempting to fetch resource',
  'Load failed',
  'Failed to fetch',
  'ChunkLoadError',
  'Loading chunk',
  'Minified React error',
]

export function shouldIgnoreError(message?: string, metadata?: unknown): boolean {
  if (!message) return false
  return IGNORE_PATTERNS.some((p) => message.includes(p))
}

