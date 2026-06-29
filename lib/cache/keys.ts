// Type-safe cache keys
export const CACHE_KEYS = {
  zellaScore: (userId: string) => `zella:score:${userId}`,
  dashboardMetrics: (userId: string) => `dashboard:metrics:${userId}`,
  tradeList: (userId: string, filterHash: string) => `trades:list:${userId}:${filterHash}`
} as const;
