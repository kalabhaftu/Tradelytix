import { z } from 'zod'

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

    for (const [key, value] of Object.entries({
      NEXT_PUBLIC_APP_URL: env.NEXT_PUBLIC_APP_URL,
      NOWPAYMENTS_SUCCESS_URL: env.NOWPAYMENTS_SUCCESS_URL,
      NOWPAYMENTS_CANCEL_URL: env.NOWPAYMENTS_CANCEL_URL,
      NOWPAYMENTS_IPN_CALLBACK_URL: env.NOWPAYMENTS_IPN_CALLBACK_URL,
      APP_BASE_URL: env.APP_BASE_URL,
    })) {
      if (value?.includes('localhost') || value?.includes('127.0.0.1')) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [key],
          message: `${key} cannot point to localhost in production`,
        })
      }
    }
  })
function validateEnv() {
  try {
    return envSchema.parse(process.env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      throw new Error(
        `Invalid environment variables:\n${missingVars.join('\n')}\n\nPlease check your .env file.`
      )
    }
    throw error
  }
}

// Export validated environment variables
export const env = validateEnv()

// Type-safe access to environment variables
export type Env = z.infer<typeof envSchema>
