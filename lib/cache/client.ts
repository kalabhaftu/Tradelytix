import { Redis } from '@upstash/redis'
import logger from '@/lib/logger'

declare global {
    var _redis: Redis | undefined
}

function createRedisClient(): Redis {
  if (
    !process.env.UPSTASH_REDIS_REST_URL ||
    !process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    logger.warn('UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN is not set. Cache will fail-open in production, but expect degraded performance.')
    // Provide a mock Redis instance that just no-ops and fails open
    return {
      get: async () => null,
      set: async () => 'OK',
      setex: async () => 'OK',
      del: async () => 0,
      ping: async () => 'PONG',
      // The rest of the methods can throw or be mocked if needed. 
      // For a basic mock to not crash the app, this is sufficient.
    } as unknown as Redis
  }
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  })
}

export const redis = global._redis ?? createRedisClient()

if (process.env.NODE_ENV !== 'production') {
  global._redis = redis
}
