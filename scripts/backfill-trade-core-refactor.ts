import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { buildSyntheticExecutionsFromTrade, buildTradePersistenceData, parseTradeChartLinks } from '@/lib/trade-core'
import { extractUserSettingsWriteData } from '@/lib/user-settings'

const APPLY = process.argv.includes('--apply')
const BATCH_SIZE = 100

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
      error.message.includes('Timed out fetching a new connection') ||
      error.message.includes('Connection closed') ||
      error.message.includes('pool_timeout') ||
      error.message.includes('socket_timeout')
    ))
  )
}

async function withRetry<T>(operation: () => Promise<T>, attempts = 6): Promise<T> {
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

async function backfillUserSettings() {
  const users = await withRetry(() => prisma.user.findMany({
    where: {
      settings: null,
    },
    select: {
      id: true,
      timezone: true,
      theme: true,
      accountFilterSettings: true,
      aiSettings: true,
      backtestInputMode: true,
      breakEvenThreshold: true,
      pnlDisplayMode: true,
      accentPack: true,
      autoAdjustAccountDate: true,
    },
  }))

  if (APPLY) {
    for (const user of users) {
      await withRetry(() => prisma.userSettings.create({
        data: {
          userId: user.id,
          ...extractUserSettingsWriteData(user as any),
        },
      }))
    }
  }

  return users.length
}

async function backfillPhaseSnapshots() {
  const phases = await withRetry(() => prisma.phaseAccount.findMany({
    where: {
      accountSize: null,
    },
    select: {
      id: true,
      MasterAccount: {
        select: {
          accountSize: true,
        },
      },
    },
  }))

  if (APPLY) {
    for (const phase of phases) {
      await withRetry(() => prisma.phaseAccount.update({
        where: { id: phase.id },
        data: {
          accountSize: phase.MasterAccount.accountSize,
        },
      }))
    }
  }

  return phases.length
}

type AuditSnapshot = {
  tradesWithInvalidUserReference: number
  usersMissingSettings: number
  phasesMissingAccountSize: number
  tradesMissingIdentity: number
  tradesMissingTypedTimes: number
  tradesMissingTypedPrices: number
  tradesMissingChartLinksList: number
  tradesWithoutExecutions: number
  invalidEmotionNotes: number
}

async function loadAuditSnapshot(): Promise<AuditSnapshot> {
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

  return {
    tradesWithInvalidUserReference,
    usersMissingSettings,
    phasesMissingAccountSize,
    tradesMissingIdentity,
    tradesMissingTypedTimes,
    tradesMissingTypedPrices,
    tradesMissingChartLinksList,
    tradesWithoutExecutions,
    invalidEmotionNotes,
  }
}

async function backfillTradesAndExecutions() {
  let cursor: string | undefined
  let processed = 0
  let updatedTrades = 0
  let createdExecutions = 0
  let repairedTradeUsers = 0
  let resolvedIdentityCollisions = 0

  while (true) {
    const candidateIds = await withRetry(() => prisma.$queryRawUnsafe<Array<{ id: string }>>(`
      SELECT t."id"
      FROM "Trade" t
      LEFT JOIN "User" u ON u."id" = t."userId"
      WHERE ${cursor ? `t."id" > '${cursor.replace(/'/g, "''")}' AND` : ''}
        (
          u."id" IS NULL OR
          t."tradeIdentityKey" IS NULL OR
          t."tradeIdentityKey" = '' OR
          t."entryTime" IS NULL OR
          t."exitTime" IS NULL OR
          t."entryPriceValue" IS NULL OR
          t."closePriceValue" IS NULL OR
          (
            COALESCE(cardinality(t."chartLinksList"), 0) = 0 AND
            t."chartLinks" IS NOT NULL
          ) OR
          NOT EXISTS (
            SELECT 1
            FROM "TradeExecution" te
            WHERE te."tradeId" = t."id"
          )
        )
      ORDER BY t."id" ASC
      LIMIT ${BATCH_SIZE}
    `))

    if (candidateIds.length === 0) break

    const trades = await withRetry(() => prisma.trade.findMany({
      where: {
        id: {
          in: candidateIds.map((row) => row.id),
        },
      },
      orderBy: { id: 'asc' },
      include: {
        executions: {
          select: { id: true },
        },
        Account: {
          select: { userId: true },
        },
        PhaseAccount: {
          select: {
            MasterAccount: {
              select: { userId: true },
            },
          },
        },
      },
    }))

    if (trades.length === 0) break

    for (const trade of trades as any[]) {
      processed += 1
      const canonicalUserId =
        trade.Account?.userId ||
        trade.PhaseAccount?.MasterAccount?.userId ||
        trade.userId

      const prepared = buildTradePersistenceData({
        ...trade,
        userId: canonicalUserId,
      })
      const existingLinks = parseTradeChartLinks(trade)
      const needsUserRepair = canonicalUserId !== trade.userId
      const needsTradeUpdate =
        needsUserRepair ||
        trade.tradeIdentityKey !== prepared.tradeIdentityKey ||
        trade.entryPriceValue !== prepared.entryPriceValue ||
        trade.closePriceValue !== prepared.closePriceValue ||
        trade.stopLossValue !== prepared.stopLossValue ||
        trade.takeProfitValue !== prepared.takeProfitValue ||
        String(trade.entryTime || '') !== String(prepared.entryTime || '') ||
        String(trade.exitTime || '') !== String(prepared.exitTime || '') ||
        JSON.stringify(trade.chartLinksList || []) !== JSON.stringify(existingLinks)

      if (APPLY && needsTradeUpdate) {
        const updateData = {
          userId: canonicalUserId,
          tradeIdentityKey: prepared.tradeIdentityKey,
          entryTime: prepared.entryTime,
          exitTime: prepared.exitTime,
          entryPriceValue: prepared.entryPriceValue,
          closePriceValue: prepared.closePriceValue,
          stopLossValue: prepared.stopLossValue,
          takeProfitValue: prepared.takeProfitValue,
          chartLinksList: prepared.chartLinksList,
        }

        try {
          await withRetry(() => prisma.trade.update({
            where: { id: trade.id },
            data: updateData,
          }))
        } catch (error) {
          if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === 'P2002'
          ) {
            resolvedIdentityCollisions += 1
            await withRetry(() => prisma.trade.update({
              where: { id: trade.id },
              data: {
                ...updateData,
                tradeIdentityKey: `${prepared.tradeIdentityKey}|legacy|${trade.id}`,
              },
            }))
          } else {
            throw error
          }
        }
      }

      if (needsTradeUpdate) {
        updatedTrades += 1
      }

      if (needsUserRepair) {
        repairedTradeUsers += 1
      }

      if (!trade.executions || trade.executions.length === 0) {
        const executionRows = buildSyntheticExecutionsFromTrade(prepared as any)
        if (APPLY) {
          await withRetry(() => prisma.tradeExecution.createMany({
            data: executionRows as any,
            skipDuplicates: true,
          }))
        }
        createdExecutions += executionRows.length
      }
    }

    cursor = trades[trades.length - 1]?.id

    if (processed > 0 && processed % (BATCH_SIZE * 5) === 0) {
      console.log(JSON.stringify({
        mode: APPLY ? 'apply' : 'dry-run',
        progress: {
          processed,
          updatedTrades,
          createdExecutions,
          repairedTradeUsers,
          resolvedIdentityCollisions,
        },
      }))
    }
  }

  return { processed, updatedTrades, createdExecutions, repairedTradeUsers, resolvedIdentityCollisions }
}

async function main() {
  await withRetry(() => prisma.$queryRawUnsafe('select 1'), 8)

  const auditBefore = await loadAuditSnapshot()
  const needsWork = Object.values(auditBefore).some((count) => count > 0)

  if (!needsWork) {
    console.log(JSON.stringify({
      mode: APPLY ? 'apply' : 'dry-run',
      skipped: true,
      reason: 'trade-core backfill already clean',
      auditBefore,
    }, null, 2))
    return
  }

  const userSettingsCreated = await backfillUserSettings()
  const phaseSnapshotsUpdated = await backfillPhaseSnapshots()
  const tradeResults = await backfillTradesAndExecutions()
  const auditAfter = await loadAuditSnapshot()

  console.log(JSON.stringify({
    mode: APPLY ? 'apply' : 'dry-run',
    skipped: false,
    auditBefore,
    auditAfter,
    userSettingsCreated,
    phaseSnapshotsUpdated,
    ...tradeResults,
  }, null, 2))
}

main()
  .catch((error) => {
    if (
      error instanceof Prisma.PrismaClientInitializationError ||
      (error instanceof Error && error.message.includes("Can't reach database server"))
    ) {
      console.error('Trade-core backfill could not connect to the database. Check DATABASE_URL/network access and try again.')
    } else {
      console.error(error)
    }
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
