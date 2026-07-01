import { redis } from './client'
import { CacheKeys } from './keys'

export async function invalidateUserCache(userId: string) {
  const userAccountsKey = CacheKeys.userAccounts(userId)
  
  await redis.del(userAccountsKey)
  
  // Note: For wildcard deletions (like trades:list:userId:*), 
  // you can use the SCAN command or store related keys in a Set.
}

export async function getCachedOrFetch<T>(key: string, fetcher: () => Promise<T>, ttlSeconds: number = 300): Promise<T> {
  const cached = await redis.get<T>(key)
  if (cached) return cached

  const data = await fetcher()
  await redis.set(key, data, { ex: ttlSeconds })
  return data
}
