import { Redis } from '@upstash/redis'

declare global {
  // eslint-disable-next-line no-var
  var _redis: Redis | undefined
}

function createRedisClient(): Redis {
  if (
    !process.env.UPSTASH_REDIS_REST_URL ||
    !process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    throw new Error(
      'UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set'
    )
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
