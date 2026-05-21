import { createHash } from 'crypto'
import { RateLimiterMemory } from 'rate-limiter-flexible'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Rate limiter with @vercel/kv persistence when available,
 * falling back to in-memory when KV is not configured.
 *
 * In serverless (Vercel), memory-based limiters reset per cold start.
 * KV-backed limiters persist across all instances.
 */

// ─── KV availability check ───
function isKvAvailable(): boolean {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)
}

// ─── KV-backed rate limiter (atomic increment with TTL) ───
async function kvConsume(key: string, points: number, duration: number): Promise<{ success: boolean; remaining: number }> {
  try {
    const { kv } = await import('@vercel/kv')
    const now = Math.floor(Date.now() / 1000)
    const windowKey = `rl:${key}:${Math.floor(now / duration)}`

    const current = await kv.incr(windowKey)

    // Set expiry on first hit of this window
    if (current === 1) {
      await kv.expire(windowKey, duration)
    }

    if (current > points) {
      return { success: false, remaining: 0 }
    }

    return { success: true, remaining: points - current }
  } catch {
    // KV error — allow request through (fail-open)
    return { success: true, remaining: points }
  }
}

// ─── Limiter config type ───
interface LimiterConfig {
  points: number
  duration: number
}

// ─── In-memory fallback instances (used when KV is unavailable) ───
const memoryLimiters = new Map<string, RateLimiterMemory>()

function getMemoryLimiter(config: LimiterConfig): RateLimiterMemory {
  const cacheKey = `${config.points}:${config.duration}`
  let limiter = memoryLimiters.get(cacheKey)
  if (!limiter) {
    limiter = new RateLimiterMemory({ points: config.points, duration: config.duration })
    memoryLimiters.set(cacheKey, limiter)
  }
  return limiter
}

// ─── Exported limiter configs (drop-in compatible with existing imports) ───
export const apiLimiter: LimiterConfig = { points: 100, duration: 60 }
export const authLimiter: LimiterConfig = { points: 10, duration: 60 }
export const aiLimiter: LimiterConfig = { points: 20, duration: 60 }
export const importLimiter: LimiterConfig = { points: 10, duration: 60 }
export const uploadLimiter: LimiterConfig = { points: 30, duration: 60 }
export const webhookLimiter: LimiterConfig = { points: 20, duration: 60 }
export const paymentLimiter: LimiterConfig = { points: 30, duration: 60 }
export const feedbackLimiter: LimiterConfig = { points: 5, duration: 60 }
export const adminLimiter: LimiterConfig = { points: 200, duration: 60 }
export const publicLimiter: LimiterConfig = { points: 30, duration: 60 }
export const errorReportLimiter: LimiterConfig = { points: 10, duration: 60 }
export const emailOtpLimiter: LimiterConfig = { points: 3, duration: 3600 }

/**
 * Get identifier for rate limiting.
 * Uses user ID if available, falls back to IP.
 */
export function getRateLimitIdentifier(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : req.headers.get('x-real-ip') || 'unknown'
  return `ip:${ip}`
}

export function getEmailRateLimitKey(email: string) {
  const normalized = email.trim().toLowerCase()
  const hash = createHash('sha256').update(normalized).digest('hex')
  return `email-otp:${hash}`
}

export async function consumeRateLimitKey(
  key: string,
  limiter: LimiterConfig
): Promise<{ allowed: boolean; remaining: number }> {
  if (isKvAvailable()) {
    const result = await kvConsume(key, limiter.points, limiter.duration)
    return { allowed: result.success, remaining: result.remaining }
  }

  const memLimiter = getMemoryLimiter(limiter)
  try {
    const result = await memLimiter.consume(key)
    return { allowed: true, remaining: result.remainingPoints }
  } catch {
    return { allowed: false, remaining: 0 }
  }
}

/**
 * Apply rate limiting to a request.
 * Returns null if allowed, or a 429 response if rate limited.
 *
 * Uses @vercel/kv when KV_REST_API_URL is configured (persistent across instances).
 * Falls back to in-memory rate limiting otherwise (per-instance, resets on cold start).
 */
export async function applyRateLimit(
  req: NextRequest,
  limiter: LimiterConfig = apiLimiter
): Promise<NextResponse | null> {
  const identifier = getRateLimitIdentifier(req)

  // Try KV-backed rate limiting first (persistent across serverless instances)
  if (isKvAvailable()) {
    const result = await kvConsume(identifier, limiter.points, limiter.duration)
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Too many requests',
          details: 'Please wait a moment before trying again',
          code: 'RATE_LIMIT_EXCEEDED',
          retryable: true,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(limiter.duration),
            'X-RateLimit-Limit': String(limiter.points),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Date.now() + (limiter.duration * 1000)),
          },
        }
      )
    }
    return null
  }

  // Fallback: in-memory rate limiting
  const memLimiter = getMemoryLimiter(limiter)
  try {
    await memLimiter.consume(identifier)
    return null
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: 'Too many requests',
        details: 'Please wait a moment before trying again',
        code: 'RATE_LIMIT_EXCEEDED',
        retryable: true,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(limiter.duration),
          'X-RateLimit-Limit': String(limiter.points),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Date.now() + (limiter.duration * 1000)),
        },
      }
    )
  }
}

/**
 * Wrapper for API route handlers with rate limiting.
 */
export function withRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>,
  limiter: LimiterConfig = apiLimiter
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const rateLimitResponse = await applyRateLimit(req, limiter)
    if (rateLimitResponse) {
      return rateLimitResponse
    }
    return handler(req)
  }
}
