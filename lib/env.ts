import { z } from 'zod'
import { assertProductionUrl, getAllowedOrigins } from '@/lib/security/origins'

function isTruthy(value: string | undefined) {
  return value === '1' || value === 'true'
}

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),
  DIRECT_URL: z.string().url('DIRECT_URL must be a valid URL').optional(),
  
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
  
  // AI Services (Optional - only required if using AI features)
  XAI_API_KEY: z.string().optional(),
  XAI_BASE_URL: z.string().url().optional(),
  XAI_MODEL: z.string().optional(),
  
  // Next.js
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
  NEXT_PUBLIC_ALLOWED_ORIGINS: z.string().optional(),
  ALLOWED_ORIGINS: z.string().optional(),
  NEXT_PUBLIC_VERCEL_URL: z.string().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Vercel (optional, only in production)
  VERCEL: z.string().optional(),
  VERCEL_ENV: z.enum(['production', 'preview', 'development']).optional(),
  VERCEL_URL: z.string().optional(),

  // Cron job authentication (required in production for /api/cron/*)
  CRON_SECRET: z.string().optional(),

  // NOWPayments
  NOWPAYMENTS_API_KEY: z.string().optional(),
  NOWPAYMENTS_PUBLIC_KEY: z.string().optional(),
  NOWPAYMENTS_IPN_SECRET: z.string().optional(),
  NOWPAYMENTS_API_BASE_URL: z.string().url().optional(),
  NOWPAYMENTS_SUCCESS_URL: z.string().url().optional(),
  NOWPAYMENTS_CANCEL_URL: z.string().url().optional(),
  NOWPAYMENTS_IPN_CALLBACK_URL: z.string().url().optional(),
  APP_BASE_URL: z.string().url().optional(),

  // Rate limiting
  KV_REST_API_URL: z.string().url().optional(),
  KV_REST_API_TOKEN: z.string().optional(),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  ALLOW_IN_MEMORY_RATE_LIMITS_IN_PRODUCTION: z.string().optional(),

  // Subscription
  SUBSCRIPTION_PRICE_USD: z.string().optional(),
  SUBSCRIPTION_BILLING_INTERVAL: z.string().optional(),
  SUBSCRIPTION_GRACE_DAYS: z.string().optional(),
}).superRefine((env, ctx) => {
    if (env.NODE_ENV !== 'production') return

    const appUrl = env.NEXT_PUBLIC_APP_URL || env.NEXT_PUBLIC_SITE_URL || env.NEXT_PUBLIC_VERCEL_URL
    if (!appUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['NEXT_PUBLIC_APP_URL'],
        message: 'NEXT_PUBLIC_APP_URL or equivalent canonical app URL is required in production',
      })
    }

    for (const [key, value, required] of [
      ['NEXT_PUBLIC_APP_URL', env.NEXT_PUBLIC_APP_URL, true],
      ['NEXT_PUBLIC_SITE_URL', env.NEXT_PUBLIC_SITE_URL, false],
      ['NOWPAYMENTS_SUCCESS_URL', env.NOWPAYMENTS_SUCCESS_URL, false],
      ['NOWPAYMENTS_CANCEL_URL', env.NOWPAYMENTS_CANCEL_URL, false],
      ['NOWPAYMENTS_IPN_CALLBACK_URL', env.NOWPAYMENTS_IPN_CALLBACK_URL, false],
      ['APP_BASE_URL', env.APP_BASE_URL, false],
    ] as const) {
      const issue = assertProductionUrl(key, value, { required })
      if (issue) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [key],
          message: issue,
        })
      }
    }

    const allowedOrigins = getAllowedOrigins()
    const canonicalOrigin = appUrl ? new URL(appUrl.startsWith('http') ? appUrl : `https://${appUrl}`).origin : null
    if (canonicalOrigin && !allowedOrigins.includes(canonicalOrigin)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['ALLOWED_ORIGINS'],
        message: 'Canonical app origin must be included in the production origin allowlist',
      })
    }

    if (!env.CRON_SECRET || env.CRON_SECRET.length < 32) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['CRON_SECRET'],
        message: 'CRON_SECRET must be at least 32 characters in production',
      })
    }

    const paymentConfigured = Boolean(env.NOWPAYMENTS_API_KEY || env.NOWPAYMENTS_PUBLIC_KEY || env.NOWPAYMENTS_IPN_CALLBACK_URL)
    if (paymentConfigured && (!env.NOWPAYMENTS_IPN_SECRET || env.NOWPAYMENTS_IPN_SECRET.length < 32)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['NOWPAYMENTS_IPN_SECRET'],
        message: 'NOWPAYMENTS_IPN_SECRET must be at least 32 characters when payments are configured in production',
      })
    }

    const hasKv = Boolean(
      (env.KV_REST_API_URL && env.KV_REST_API_TOKEN) ||
        (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN)
    )
    if (!hasKv && !isTruthy(env.ALLOW_IN_MEMORY_RATE_LIMITS_IN_PRODUCTION)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['KV_REST_API_URL'],
        message: 'Production requires Redis/KV-backed sensitive rate limits or an explicit unsafe override',
      })
    }
  })
function validateEnv() {
  const result = envSchema.safeParse(process.env)
  if (result.success) {
    return result.data
  }

  const error = result.error
  const criticalFields = [
    'DATABASE_URL',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ]

  const criticalErrors = error.errors.filter(err => 
    err.path.some(p => criticalFields.includes(String(p)))
  )

  const nonCriticalErrors = error.errors.filter(err => 
    !err.path.some(p => criticalFields.includes(String(p)))
  )

  if (criticalErrors.length > 0) {
    const missingVars = criticalErrors.map(err => `${err.path.join('.')}: ${err.message}`)
    throw new Error(
      `Critical environment variables missing or invalid:\n${missingVars.join('\n')}\n\nPlease check your .env file.`
    )
  }

  if (nonCriticalErrors.length > 0) {
    const warningMsgs = nonCriticalErrors.map(err => `${err.path.join('.')}: ${err.message}`)
    console.error(
      `\x1b[33m[Warning] Non-critical environment variables failed validation. The app will boot, but some features may be disabled:\n${warningMsgs.join('\n')}\x1b[0m`
    )
  }

  const parsedEnv = { ...process.env } as any
  if (!parsedEnv.NODE_ENV) {
    parsedEnv.NODE_ENV = 'development'
  }
  return parsedEnv as Env
}

// Export validated environment variables
export const env = validateEnv()

// Type-safe access to environment variables
export type Env = z.infer<typeof envSchema>
