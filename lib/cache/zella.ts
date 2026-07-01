import { redis } from './client'
import { getCachedOrFetch } from './utils'
import { calculateZellaScore } from '@/lib/zella-score'

export async function getCachedZellaScore(userId: string, fetcher: () => Promise<ReturnType<typeof calculateZellaScore>>) {
  const key = `zella:score:${userId}`
  // Cache for 24 hours (86400 seconds) since it's a heavy calculation and only updates once a day
  return getCachedOrFetch(key, fetcher, 86400)
}

export async function invalidateZellaScore(userId: string) {
  const key = `zella:score:${userId}`
  await redis.del(key)
}
