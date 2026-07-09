import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Use a fallback to mock Redis if environment variables are missing during build/dev
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? Redis.fromEnv()
  : {
      sadd: async () => 1,
      eval: async () => [0, 0],
      zrange: async () => [],
      zremrangebyscore: async () => 0,
      zadd: async () => 0,
    } as unknown as Redis; // Mock stub to prevent crashing if unconfigured

// General API Rate Limiting (e.g., standard endpoints)
const apiRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'),
  analytics: true,
  prefix: '@upstash/ratelimit/api',
});

// Stricter Rate Limiting for Thor ingestion endpoints
export const thorRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, '1 m'),
  analytics: true,
  prefix: '@upstash/ratelimit/thor',
});

// Strict Rate Limiting for Authentication (login/signup)
const authRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 m'),
  analytics: true,
  prefix: '@upstash/ratelimit/auth',
});

// Extremely strict limit for OpenAI feature usage
const aiRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 d'), 
  analytics: true,
  prefix: '@upstash/ratelimit/ai',
});
