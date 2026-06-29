import path from 'node:path'
import { fileURLToPath } from 'node:url'

import dotenv from 'dotenv'


export interface BackfillOptions {
  apply: boolean
  userId?: string
}

export interface BackfillSummary {
  mode: 'dry-run' | 'apply'
  user_filter: string | null
  scanned_users: number
  regular_accounts_scanned: number
  master_accounts_scanned: number
  phase_accounts_scanned: number
  regular_account_updates: number
  master_account_updates: number
  phase_startdate_updates: number
  regular_account_skipped_no_trades: number
  master_account_skipped_no_trades: number
  phase_startdate_skipped_no_trades: number
  regular_account_skipped_backward_only: number
  master_account_skipped_backward_only: number
  phase_startdate_skipped_backward_only: number
  writes_applied: number
  write_errors: number
  sample_updates: {
    regular_account_updates: Array<Record<string, string>>
    master_account_updates: Array<Record<string, string>>
    phase_startdate_updates: Array<Record<string, string>>
  }
}

type BackfillPrismaClient = Pick<PrismaClient, 'user' | 'account' | 'masterAccount' | 'phaseAccount' | 'trade' | '$disconnect'>

let prismaSingleton: PrismaClient | null = null

function getPrismaClient(): PrismaClient {
  if (!prismaSingleton) {
    prismaSingleton = new PrismaClient()
  }
  return prismaSingleton
}

function parseDate(value: Date | string | null | undefined): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value
  }

  if (typeof value !== 'string' || value.trim().length === 0) {
    return null
  }

  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function normalizeToStartOfDay(date: Date): Date {
  const normalized = new Date(date)
  normalized.setHours(0, 0, 0, 0)
  return normalized
}

export function shouldApplyBackwardOnly(current: Date, candidate: Date | null): boolean {
  if (!candidate) {
    return false
  }
  return candidate.getTime() < current.getTime()
}

function addSample(
  collection: Array<Record<string, string>>,
  sample: Record<string, string>,
  max = 10
): void {
  if (collection.length < max) {
    collection.push(sample)
  }
}

function toIso(date: Date): string {
  return date.toISOString()
}

function makeUserAccountKey(userId: string, accountNumber: string): string {
  return `${userId}::${accountNumber}`
}

function maybeLowerDate(map: Map<string, Date>, key: string, date: Date): void {
  const existing = map.get(key)
  if (!existing || date.getTime() < existing.getTime()) {
    map.set(key, date)
  }
}

export async function runBackfillAutoAdjustAccountDates(
  options: BackfillOptions,
  db: BackfillPrismaClient = getPrismaClient()
): Promise<BackfillSummary> {
  const summary: BackfillSummary = {
    mode: options.apply ? 'apply' : 'dry-run',
    user_filter: options.userId ?? null,
    scanned_users: 0,
    regular_accounts_scanned: 0,
    master_accounts_scanned: 0,
    phase_accounts_scanned: 0,
    regular_account_updates: 0,
    master_account_updates: 0,
    phase_startdate_updates: 0,
    regular_account_skipped_no_trades: 0,
    master_account_skipped_no_trades: 0,
    phase_startdate_skipped_no_trades: 0,
    regular_account_skipped_backward_only: 0,
    master_account_skipped_backward_only: 0,
    phase_startdate_skipped_backward_only: 0,
    writes_applied: 0,
    write_errors: 0,
    sample_updates: {
      regular_account_updates: [],
      master_account_updates: [],
      phase_startdate_updates: [],
    },
  }

  const userWhere = options.userId ? { id: options.userId } : undefined

  const users = await db.user.findMany({
    where: userWhere,
    select: { id: true },
  })

  summary.scanned_users = users.length

  if (users.length === 0) {
    return summary
  }

  const scopedUserIds = users.map((user) => user.id)

  const accounts = await db.account.findMany({
    where: options.userId ? { userId: options.userId } : undefined,
    select: {
      id: true,
      userId: true,
      number: true,
      createdAt: true,
    },
  })

  summary.regular_accounts_scanned = accounts.length

  const regularTrades = await db.trade.findMany({
    where: {
      userId: options.userId ? options.userId : { in: scopedUserIds },
      phaseAccountId: null,
    },
    select: {
      userId: true,
      accountId: true,
      accountNumber: true,
      entryTime: true,
      entryDate: true,
    },
  })

  const earliestRegularTradeByAccountId = new Map<string, Date>()
  const earliestRegularTradeByUserAndAccountNumber = new Map<string, Date>()

  for (const trade of regularTrades) {
    const parsedDate = parseDate(trade.entryTime) ?? parseDate(trade.entryDate)
    if (!parsedDate) {
      continue
    }

    const normalizedDate = normalizeToStartOfDay(parsedDate)

    if (trade.accountId) {
      maybeLowerDate(earliestRegularTradeByAccountId, trade.accountId, normalizedDate)
    }

    if (trade.accountNumber) {
      const key = makeUserAccountKey(trade.userId, trade.accountNumber)
      maybeLowerDate(earliestRegularTradeByUserAndAccountNumber, key, normalizedDate)
    }
  }

  for (const account of accounts) {
    const key = makeUserAccountKey(account.userId, account.number)
    const byAccountId = earliestRegularTradeByAccountId.get(account.id) ?? null
    const byAccountNumber = earliestRegularTradeByUserAndAccountNumber.get(key) ?? null
    const earliestTradeDate =
      byAccountId && byAccountNumber
        ? new Date(Math.min(byAccountId.getTime(), byAccountNumber.getTime()))
        : (byAccountId ?? byAccountNumber)

    if (!earliestTradeDate) {
      summary.regular_account_skipped_no_trades += 1
      continue
    }

    if (!shouldApplyBackwardOnly(account.createdAt, earliestTradeDate)) {
      summary.regular_account_skipped_backward_only += 1
      continue
    }

    summary.regular_account_updates += 1

    addSample(summary.sample_updates.regular_account_updates, {
      userId: account.userId,
      accountId: account.id,
      accountNumber: account.number,
      from: toIso(account.createdAt),
      to: toIso(earliestTradeDate),
    })

    if (!options.apply) {
      continue
    }

    try {
      await db.account.update({
        where: { id: account.id },
        data: { createdAt: earliestTradeDate },
      })
      summary.writes_applied += 1
    } catch (error) {
      summary.write_errors += 1
      console.error('[regular_account_updates] failed', {
        accountId: account.id,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  const phaseAccounts = await db.phaseAccount.findMany({
    where: options.userId
      ? { MasterAccount: { userId: options.userId } }
      : undefined,
    select: {
      id: true,
      masterAccountId: true,
      startDate: true,
    },
  })

  summary.phase_accounts_scanned = phaseAccounts.length

  const phaseTrades = await db.trade.findMany({
    where: {
      userId: options.userId ? options.userId : { in: scopedUserIds },
      phaseAccountId: { not: null },
    },
    select: {
      phaseAccountId: true,
      entryTime: true,
      entryDate: true,
    },
  })

  const earliestTradeByPhaseId = new Map<string, Date>()

  for (const trade of phaseTrades) {
    if (!trade.phaseAccountId) {
      continue
    }

    const parsedDate = parseDate(trade.entryTime) ?? parseDate(trade.entryDate)
    if (!parsedDate) {
      continue
    }

    const normalizedDate = normalizeToStartOfDay(parsedDate)
    maybeLowerDate(earliestTradeByPhaseId, trade.phaseAccountId, normalizedDate)
  }

  const earliestMasterTradeByMasterId = new Map<string, Date>()

  for (const phase of phaseAccounts) {
    const earliestPhaseTrade = earliestTradeByPhaseId.get(phase.id) ?? null

    if (!earliestPhaseTrade) {
      summary.phase_startdate_skipped_no_trades += 1
      continue
    }

    maybeLowerDate(earliestMasterTradeByMasterId, phase.masterAccountId, earliestPhaseTrade)

    if (!shouldApplyBackwardOnly(phase.startDate, earliestPhaseTrade)) {
      summary.phase_startdate_skipped_backward_only += 1
      continue
    }

    summary.phase_startdate_updates += 1

    addSample(summary.sample_updates.phase_startdate_updates, {
      phaseAccountId: phase.id,
      masterAccountId: phase.masterAccountId,
      from: toIso(phase.startDate),
      to: toIso(earliestPhaseTrade),
    })

    if (!options.apply) {
      continue
    }

    try {
      await db.phaseAccount.update({
        where: { id: phase.id },
        data: { startDate: earliestPhaseTrade },
      })
      summary.writes_applied += 1
    } catch (error) {
      summary.write_errors += 1
      console.error('[phase_startdate_updates] failed', {
        phaseAccountId: phase.id,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  const masterAccounts = await db.masterAccount.findMany({
    where: options.userId ? { userId: options.userId } : undefined,
    select: {
      id: true,
      userId: true,
      createdAt: true,
    },
  })

  summary.master_accounts_scanned = masterAccounts.length

  for (const master of masterAccounts) {
    const earliestMasterTrade = earliestMasterTradeByMasterId.get(master.id) ?? null

    if (!earliestMasterTrade) {
      summary.master_account_skipped_no_trades += 1
      continue
    }

    if (!shouldApplyBackwardOnly(master.createdAt, earliestMasterTrade)) {
      summary.master_account_skipped_backward_only += 1
      continue
    }

    summary.master_account_updates += 1

    addSample(summary.sample_updates.master_account_updates, {
      userId: master.userId,
      masterAccountId: master.id,
      from: toIso(master.createdAt),
      to: toIso(earliestMasterTrade),
    })

    if (!options.apply) {
      continue
    }

    try {
      await db.masterAccount.update({
        where: { id: master.id },
        data: { createdAt: earliestMasterTrade },
      })
      summary.writes_applied += 1
    } catch (error) {
      summary.write_errors += 1
      console.error('[master_account_updates] failed', {
        masterAccountId: master.id,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  return summary
}

function parseBooleanFlag(value: string | undefined): boolean {
  if (value === undefined) return false
  const normalized = value.toLowerCase()
  return normalized === '' || normalized === '1' || normalized === 'true' || normalized === 'yes'
}

function parseArgs(argv: string[], env: NodeJS.ProcessEnv = process.env): BackfillOptions {
  // npm run <script> -- --apply forwards args directly to argv.
  // npm run <script> --apply can be swallowed by npm and exposed as npm_config_all=true.
  const lifecycleEvent = env.npm_lifecycle_event ?? ''
  const implicitApplyFromNpmAll =
    lifecycleEvent === 'backfill:auto-adjust-account-dates' &&
    parseBooleanFlag(env.npm_config_all)

  let apply = parseBooleanFlag(env.npm_config_apply) || implicitApplyFromNpmAll
  let userId: string | undefined
  let sawExplicitDryRun = false

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]

    if (arg === 'apply') {
      apply = true
      continue
    }

    if (arg === 'dry-run') {
      apply = false
      sawExplicitDryRun = true
      continue
    }

    if (arg === '--apply') {
      apply = true
      continue
    }

    if (arg === '--dry-run') {
      apply = false
      sawExplicitDryRun = true
      continue
    }

    if (arg === '--user-id') {
      const next = argv[index + 1]
      if (!next || next.startsWith('--')) {
        throw new Error('Missing value for --user-id')
      }
      userId = next
      index += 1
      continue
    }

    throw new Error(`Unknown argument: ${arg}`)
  }

  if (implicitApplyFromNpmAll && !sawExplicitDryRun && !argv.includes('--apply') && !argv.includes('apply')) {
    console.warn(
      '[backfill:auto-adjust-account-dates] Interpreting `npm run backfill:auto-adjust-account-dates --apply` as apply mode. ' +
      'Recommended explicit forms: `npm run backfill:auto-adjust-account-dates -- --apply` or `npm run backfill:auto-adjust-account-dates:apply`.'
    )
  }

  return { apply, userId }
}

export async function main(): Promise<void> {
  dotenv.config({ path: path.resolve(process.cwd(), '.env') })
  dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), override: true })

  const options = parseArgs(process.argv.slice(2), process.env)

  console.log(`[backfill:auto-adjust-account-dates] mode=${options.apply ? 'apply' : 'dry-run'} userId=${options.userId ?? 'ALL'}`)

  const summary = await runBackfillAutoAdjustAccountDates(options)

  console.log('[backfill:auto-adjust-account-dates] summary')
  console.log(JSON.stringify(summary, null, 2))

  if (!options.apply) {
    console.log('[backfill:auto-adjust-account-dates] dry-run only. Re-run with --apply to persist updates.')
  }

  const prisma = getPrismaClient()
  await prisma.$disconnect()
}

const entryPath = process.argv[1] ? path.resolve(process.argv[1]) : ''
const currentFilePath = fileURLToPath(import.meta.url)

if (entryPath === currentFilePath) {
  main().catch((error) => {
    console.error('[backfill:auto-adjust-account-dates] failed', error)
    process.exit(1)
  })
}
