import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function resolveBaseDatabaseUrl(): string {
  const isProduction = process.env.NODE_ENV === 'production'
  const transactionUrl = process.env.DATABASE_URL
  const directUrl = process.env.DIRECT_URL

  // Supabase's Prisma guidance uses:
  // - session/direct-style connections for server-based local development
  // - transaction pooler connections for serverless production
  if (isProduction) {
    return transactionUrl || directUrl || 'file:./dev.db'
  }

  return directUrl || transactionUrl || 'file:./dev.db'
}

function isSupabasePoolerUrl(url: URL) {
  return url.hostname.includes('pooler.supabase.com')
}

function getConnectionLimit() {
  return process.env.PRISMA_CONNECTION_LIMIT || (process.env.NODE_ENV === 'production' ? '5' : '2')
}

function buildDatabaseUrl(): string {
  const baseUrl = resolveBaseDatabaseUrl()

  if (baseUrl.startsWith('file:')) {
    return baseUrl
  }

  try {
    const url = new URL(baseUrl)
    const isTransactionPooler = isSupabasePoolerUrl(url) && url.port === '6543'

    url.searchParams.set('connect_timeout', '30')
    url.searchParams.set('socket_timeout', '30')
    url.searchParams.set('connection_limit', getConnectionLimit())
    url.searchParams.set('pool_timeout', '30')

    if (isTransactionPooler) {
      // Supabase recommends transaction mode for serverless/edge traffic,
      // with prepared statements disabled via pgbouncer=true.
      url.searchParams.set('pgbouncer', 'true')
    } else {
      // Session mode / direct connections should not inherit transaction-pooler flags.
      url.searchParams.delete('pgbouncer')
    }

    return url.toString()
  } catch {
    return baseUrl
  }
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: buildDatabaseUrl(),
    },
  },
  ...(process.env.NODE_ENV === 'development' && {
    errorFormat: 'pretty',
  }),
})

export const safeDbOperation = async <T>(
  operation: () => Promise<T>,
  fallbackValue?: T
): Promise<T | undefined> => {
  try {
    return await operation()
  } catch (error) {
    console.error('Database operation failed:', error)
    return fallbackValue
  }
}

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
