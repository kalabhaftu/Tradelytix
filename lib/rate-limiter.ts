import { RateLimiterMemory } from 'rate-limiter-flexible'
import { NextRequest, NextResponse } from 'next/server'

// Rate limiters for different endpoint types
export const apiLimiter = new RateLimiterMemory({
  points: 100,
  duration: 60,
})

export const authLimiter = new RateLimiterMemory({
  points: 10,
  duration: 60,
})

export const aiLimiter = new RateLimiterMemory({
  points: 20,
  duration: 60,
})

export const importLimiter = new RateLimiterMemory({
  points: 10,
  duration: 60,
})

export const uploadLimiter = new RateLimiterMemory({
  points: 30,
  duration: 60,
})

export const feedbackLimiter = new RateLimiterMemory({
  points: 5,
  duration: 60,
})

export const adminLimiter = new RateLimiterMemory({
  points: 200,
  duration: 60,
})

export const publicLimiter = new RateLimiterMemory({
  points: 30,
  duration: 60,
})

export const errorReportLimiter = new RateLimiterMemory({
  points: 10,
  duration: 60,
})

/**
 * Get identifier for rate limiting.
 * Uses user ID if available, falls back to IP.
 */
export function getRateLimitIdentifier(req: NextRequest): string {
  const userId = req.headers.get('x-user-id')
  if (userId) {
    return `user:${userId}`
  }

  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : req.headers.get('x-real-ip') || 'unknown'
  return `ip:${ip}`
}

/**
 * Apply rate limiting to a request.
 * Returns null if allowed, or a 429 response if rate limited.
 */
export async function applyRateLimit(
  req: NextRequest,
  limiter: RateLimiterMemory = apiLimiter
): Promise<NextResponse | null> {
  const identifier = getRateLimitIdentifier(req)

  try {
    await limiter.consume(identifier)
    return null
  } catch (rateLimitError) {
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
          'Retry-After': '60',
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
  limiter: RateLimiterMemory = apiLimiter
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const rateLimitResponse = await applyRateLimit(req, limiter)
    if (rateLimitResponse) {
      return rateLimitResponse
    }
    return handler(req)
  }
}
