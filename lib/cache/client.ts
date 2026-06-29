import { Redis } from '@upstash/redis'
import logger from '@/lib/logger'

const globalForRedis = global as unknown as { redis: Redis }

export const redis =
  globalForRedis.redis ||
  new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL || '',
    token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
  })

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis

export async function getCached<T>(key: string, fetcher: () => Promise<T>, ttlSeconds: number = 3600): Promise<T> {
  try {
    const cached = await redis.get<T>(key)
    if (cached) return cached
  } catch (error) {
    logger.error({ error, key, event: 'cache_read_failed' }, 'Redis cache read failed')
  }

  const freshData = await fetcher()

  try {
    await redis.set(key, freshData, { ex: ttlSeconds })
  } catch (error) {
    logger.error({ error, key, event: 'cache_write_failed' }, 'Redis cache write failed')
  }

  return freshData
}

export async function invalidateCache(keyPattern: string) {
  try {
    // Note: Upstash doesn't support SCAN effectively in edge, so we delete by exact key or use tags/sets for complex invalidation
    await redis.del(keyPattern)
  } catch (error) {
    logger.error({ error, keyPattern, event: 'cache_invalidate_failed' }, 'Redis cache invalidation failed')
  }
}
