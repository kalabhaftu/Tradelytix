import { redis } from './client'
import { CACHE_KEYS } from './keys'

export async function invalidateTradesCache(userId: string) {
  const scoreKey = CACHE_KEYS.zellaScore(userId)
  const dashboardKey = CACHE_KEYS.dashboardMetrics(userId)
  
  await redis.del(scoreKey, dashboardKey)

  // Invalidate any paginated trade lists using wildcard scan
  const prefix = `trades:list:${userId}:*`
  let cursor = 0
  do {
    const [nextCursor, keys] = await redis.scan(cursor, { match: prefix, count: 100 })
    if (keys.length > 0) {
      await redis.del(...keys)
    }
    cursor = Number(nextCursor)
  } while (cursor !== 0)
}
