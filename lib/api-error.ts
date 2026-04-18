/**
 * API Error Response Sanitization
 *
 * Prevents leaking internal error details (stack traces, SQL errors, file paths)
 * to API consumers. Only known safe error messages are forwarded.
 */

const SAFE_ERROR_MESSAGES = new Set([
  'Unauthorized',
  'Forbidden: Admin access required',
  'ADMIN_EMAIL not configured',
  'User not authenticated',
  'User not found',
  'Account not found',
  'Not found',
  'Bad request',
  'Invalid request',
  'Validation failed',
])

const SAFE_PREFIXES = [
  'Forbidden',
  'Unauthorized',
  'Account ',
  'Trade ',
  'File ',
  'Invalid ',
  'Missing ',
  'Maximum ',
]

/**
 * Extracts a safe error message for API responses.
 * Returns the original message only if it's a known/safe pattern.
 * Returns a generic message for unexpected or internal errors.
 */
export function sanitizeErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return 'Internal Server Error'
  }

  const msg = error.message

  // Allow known safe messages through
  if (SAFE_ERROR_MESSAGES.has(msg)) {
    return msg
  }

  // Allow messages with safe prefixes (auth/validation errors)
  if (SAFE_PREFIXES.some(prefix => msg.startsWith(prefix))) {
    return msg
  }

  // Block everything else (SQL errors, file paths, stack info)
  return 'Internal Server Error'
}

/**
 * Determines HTTP status code from error message.
 */
export function getErrorStatusCode(error: unknown): number {
  if (!(error instanceof Error)) return 500

  const msg = error.message
  if (msg.includes('not authenticated') || msg === 'Unauthorized') return 401
  if (msg.includes('Forbidden') || msg === 'ADMIN_EMAIL not configured') return 403
  if (msg.includes('not found') || msg === 'Not found') return 404
  if (msg.includes('Invalid') || msg.includes('Validation') || msg.includes('required')) return 400

  return 500
}
