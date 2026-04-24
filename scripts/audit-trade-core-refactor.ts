import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isTransientDbError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientInitializationError ||
    (error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === 'P2024' || error.code === 'P1001')) ||
    (error instanceof Error && (
      error.message.includes("Can't reach database server") ||
      error.message.includes('Timed out fetching a new connection')
    ))
  )
}

async function withRetry<T>(operation: () => Promise<T>, attempts = 4): Promise<T> {
  let lastError: unknown

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      if (!isTransientDbError(error) || attempt === attempts) {
        throw error
      }
      await sleep(1500 * attempt)
    }
  }

  throw lastError
}

async function main() {
  await withRetry(() => prisma.$queryRawUnsafe('select 1'))

  const [{ tradesWithInvalidUserReference }] = await withRetry(() => prisma.$queryRawUnsafe<
    Array<{ tradesWithInvalidUserReference: number }>
  >(`
    SELECT COUNT(*)::int AS "tradesWithInvalidUserReference"
    FROM "Trade" t
    LEFT JOIN "User" u ON u."id" = t."userId"
    WHERE u."id" IS NULL
  `))

  const usersMissingSettings = await withRetry(() => prisma.user.count({
    where: {
      settings: null,
    },
  }))
  const phasesMissingAccountSize = await withRetry(() => prisma.phaseAccount.count({
    where: {
      accountSize: null,
    },
  }))
  const tradesMissingIdentity = await withRetry(() => prisma.trade.count({
    where: {
      OR: [
        { tradeIdentityKey: null },
        { tradeIdentityKey: '' },
      ],
    },
  }))
  const tradesMissingTypedTimes = await withRetry(() => prisma.trade.count({
    where: {
      OR: [
        { entryTime: null },
        { exitTime: null },
      ],
    },
  }))
  const tradesMissingTypedPrices = await withRetry(() => prisma.trade.count({
    where: {
      OR: [
        { entryPriceValue: null },
        { closePriceValue: null },
      ],
    },
  }))
  const tradesMissingChartLinksList = await withRetry(() => prisma.trade.count({
    where: {
      chartLinksList: {
        isEmpty: true,
      },
      chartLinks: {
        not: null,
      },
    },
  }))
  const tradesWithoutExecutions = await withRetry(() => prisma.trade.count({
    where: {
      executions: {
        none: {},
      },
    },
  }))
  const invalidEmotionNotes = await withRetry(() => prisma.dailyNote.count({
    where: {
      emotion: {
        notIn: [
          'confident',
          'anxious',
          'focused',
          'energetic',
          'calm',
          'frustrated',
          'optimistic',
          'pessimistic',
          'disciplined',
          'impulsive',
          'happy',
          'sad',
          'neutral',
          'tired',
          'excited',
          'stressed',
          'relaxed',
        ],
      },
    },
  }))

  console.log(JSON.stringify({
    tradesWithInvalidUserReference,
    usersMissingSettings,
    phasesMissingAccountSize,
    tradesMissingIdentity,
    tradesMissingTypedTimes,
    tradesMissingTypedPrices,
    tradesMissingChartLinksList,
    tradesWithoutExecutions,
    invalidEmotionNotes,
  }, null, 2))
}

main()
  .catch((error) => {
    if (
      error instanceof Prisma.PrismaClientInitializationError ||
      (error instanceof Error && error.message.includes("Can't reach database server"))
    ) {
      console.error('Trade-core audit could not connect to the database. Check DATABASE_URL/network access and try again.')
    } else {
      console.error(error)
    }
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
