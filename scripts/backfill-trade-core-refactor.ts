import { db } from '@/lib/db/client'
import * as schema from '@/lib/db/schema'
import { eq, isNull, or, sql, notInArray, inArray } from 'drizzle-orm'

import { buildSyntheticExecutionsFromTrade, buildTradePersistenceData, parseTradeChartLinks } from '@/lib/trade-core'
import { extractUserSettingsWriteData } from '@/lib/user-settings'

const APPLY = process.argv.includes('--apply')
const BATCH_SIZE = 100

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isTransientDbError(error: unknown) {
  return (
    (error instanceof Error && (
      error.message.includes("Can't reach database server") ||
      error.message.includes('Timed out fetching a new connection') ||
      error.message.includes('Connection closed') ||
      error.message.includes('pool_timeout') ||
      error.message.includes('socket_timeout') ||
      error.message.includes('ECONNREFUSED')
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
  const users = await withRetry(() => db.query.User.findMany({
    with: {
      settings: true,
    },
    columns: {
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
  }).then(res => res.filter(u => !u.settings)))

  if (APPLY) {
    for (const user of users) {
      await withRetry(() => db.insert(schema.UserSettings).values({
          userId: user.id,
          ...extractUserSettingsWriteData(user as any),
      }))
    }
  }

  return users.length
}

async function backfillPhaseSnapshots() {
  const phases = await withRetry(() => db.query.PhaseAccount.findMany({
    where: (table, { isNull }) => isNull(table.accountSize),
    with: {
      MasterAccount: {
        columns: {
          accountSize: true,
        },
      },
    },
    columns: {
      id: true,
    },
  }))

  if (APPLY) {
    for (const phase of phases) {
      if (phase.MasterAccount) {
        await withRetry(() => db.update(schema.PhaseAccount).set({
            accountSize: phase.MasterAccount.accountSize,
        }).where(eq(schema.PhaseAccount.id, phase.id)))
      }
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
  const rawRes = await withRetry(() => db.execute(sql`
    SELECT COUNT(*)::int AS "tradesWithInvalidUserReference"
    FROM "Trade" t
    LEFT JOIN "User" u ON u."id" = t."userId"
    WHERE u."id" IS NULL
  `))
  const tradesWithInvalidUserReference = Number((rawRes as any)[0]?.tradesWithInvalidUserReference || 0)

  const usersMissingSettingsRes = await withRetry(() => db.execute(sql`
    SELECT COUNT(*)::int AS count FROM "User" u LEFT JOIN "UserSettings" s ON u.id = s."userId" WHERE s."userId" IS NULL
  `))
  const usersMissingSettings = Number((usersMissingSettingsRes as any)[0]?.count || 0)

  const phasesMissingAccountSizeRes = await withRetry(() => db.select({ count: sql`count(*)` }).from(schema.PhaseAccount).where(isNull(schema.PhaseAccount.accountSize)))
  const phasesMissingAccountSize = Number((phasesMissingAccountSizeRes as any)[0]?.count || 0)

  const tradesMissingIdentityRes = await withRetry(() => db.select({ count: sql`count(*)` }).from(schema.Trade).where(or(isNull(schema.Trade.tradeIdentityKey), eq(schema.Trade.tradeIdentityKey, ''))))
  const tradesMissingIdentity = Number((tradesMissingIdentityRes as any)[0]?.count || 0)

  const tradesMissingTypedTimesRes = await withRetry(() => db.select({ count: sql`count(*)` }).from(schema.Trade).where(or(isNull(schema.Trade.entryTime), isNull(schema.Trade.exitTime))))
  const tradesMissingTypedTimes = Number((tradesMissingTypedTimesRes as any)[0]?.count || 0)

  const tradesMissingTypedPricesRes = await withRetry(() => db.select({ count: sql`count(*)` }).from(schema.Trade).where(or(isNull(schema.Trade.entryPriceValue), isNull(schema.Trade.closePriceValue))))
  const tradesMissingTypedPrices = Number((tradesMissingTypedPricesRes as any)[0]?.count || 0)

  const tradesMissingChartLinksListRes = await withRetry(() => db.execute(sql`
    SELECT COUNT(*)::int AS count FROM "Trade" WHERE (cardinality("chartLinksList") = 0 OR "chartLinksList" IS NULL) AND "chartLinks" IS NOT NULL
  `))
  const tradesMissingChartLinksList = Number((tradesMissingChartLinksListRes as any)[0]?.count || 0)

  const tradesWithoutExecutionsRes = await withRetry(() => db.execute(sql`
    SELECT COUNT(*)::int AS count FROM "Trade" t WHERE NOT EXISTS (SELECT 1 FROM "TradeExecution" e WHERE e."tradeId" = t.id)
  `))
  const tradesWithoutExecutions = Number((tradesWithoutExecutionsRes as any)[0]?.count || 0)

  const invalidEmotionNotesRes = await withRetry(() => db.select({ count: sql`count(*)` }).from(schema.DailyNote).where(notInArray(schema.DailyNote.emotion, [
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
        ] as any)))
  const invalidEmotionNotes = Number((invalidEmotionNotesRes as any)[0]?.count || 0)

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
    const candidateIdsRes = await withRetry(() => db.execute(sql.raw(`
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
    `)))
    
    const candidateIds = candidateIdsRes as any[]

    if (candidateIds.length === 0) break

    const trades = await withRetry(() => db.query.Trade.findMany({
      where: (table, { inArray }) => inArray(table.id, candidateIds.map((row) => row.id)),
      orderBy: (table, { asc }) => asc(table.id),
      with: {
        executions: {
          columns: { id: true },
        },
        Account: {
          columns: { userId: true },
        },
        PhaseAccount: {
          with: {
            MasterAccount: {
              columns: { userId: true },
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
          await withRetry(() => db.update(schema.Trade).set(updateData).where(eq(schema.Trade.id, trade.id)))
        } catch (error: any) {
          if (
            error.code === '23505'
          ) {
            resolvedIdentityCollisions += 1
            await withRetry(() => db.update(schema.Trade).set({
                ...updateData,
                tradeIdentityKey: `${prepared.tradeIdentityKey}|legacy|${trade.id}`,
              }).where(eq(schema.Trade.id, trade.id)))
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
          await withRetry(() => db.insert(schema.TradeExecution).values(executionRows as any).onConflictDoNothing())
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
  await withRetry(() => db.execute(sql`select 1`), 8)

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
      (error instanceof Error && error.message.includes("Can't reach database server"))
    ) {
      console.error('Trade-core backfill could not connect to the database. Check DATABASE_URL/network access and try again.')
    } else {
      console.error(error)
    }
    process.exit(1)
  })
  .finally(async () => {
    process.exit(0)
  })
