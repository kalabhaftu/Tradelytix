import fs from 'fs/promises'
import path from 'path'
import process from 'process'


import { config as loadEnvFile } from 'dotenv'

type CleanupCandidate = {
  id: string
  email: string
  authUserId: string
}

type AuthUser = {
  id: string
  email: string | null
}

type CleanupOptions = {
  apply: boolean
  outDir: string
}

const DEFAULT_OUT_DIR = path.join(process.cwd(), 'diagnostics', 'orphan-cleanup')

let prisma: PrismaClient
let listAllAuthUsers: typeof import('../server/supabase-admin').listAllAuthUsers

function loadEnvironment() {
  loadEnvFile({ path: path.join(process.cwd(), '.env') })
  loadEnvFile({ path: path.join(process.cwd(), '.env.local'), override: true })

  if (process.env.DIRECT_URL) {
    process.env.DATABASE_URL = process.env.DIRECT_URL
  }
}

function buildCleanupDatabaseUrl() {
  const baseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL

  if (!baseUrl) {
    throw new Error('DATABASE_URL or DIRECT_URL is required to run orphan cleanup')
  }

  if (baseUrl.startsWith('file:')) {
    return baseUrl
  }

  const url = new URL(baseUrl)
  url.searchParams.delete('pgbouncer')
  url.searchParams.delete('connection_limit')
  url.searchParams.delete('pool_timeout')
  url.searchParams.delete('socket_timeout')
  return url.toString()
}

async function loadDependencies() {
  const supabaseAdminModule = await import('../server/supabase-admin')

  prisma = new PrismaClient({
    datasources: {
      db: {
        url: buildCleanupDatabaseUrl(),
      },
    },
    log: ['error'],
  })

  listAllAuthUsers = supabaseAdminModule.listAllAuthUsers
}

function parseCliArgs(argv: string[]): CleanupOptions {
  const options: CleanupOptions = {
    apply: false,
    outDir: DEFAULT_OUT_DIR,
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]

    if (arg === '--apply') {
      options.apply = true
      continue
    }

    if (arg === '--out-dir' && argv[index + 1]) {
      options.outDir = path.resolve(process.cwd(), argv[index + 1])
      index += 1
    }
  }

  return options
}

function normalizeEmail(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? null
}

function toFileTimestamp(value: string) {
  return value.replace(/[:.]/g, '-')
}

async function writeJson(filePath: string, payload: unknown) {
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(
    filePath,
    JSON.stringify(payload, (_, value) => (typeof value === 'bigint' ? Number(value) : value), 2),
    'utf8'
  )
}

async function getDirectorySnapshot() {
  const [authUsers, dbUsers] = await Promise.all([
    listAllAuthUsers(),
    prisma.user.findMany({
      select: {
        id: true,
        email: true,
        auth_user_id: true,
      },
      orderBy: { email: 'asc' },
    }),
  ])

  const authUsersById = new Map(authUsers.map((user) => [user.id, user]))
  const dbUsersByAuthId = new Map(dbUsers.map((user) => [user.auth_user_id, user]))
  const authUsersByEmail = new Map(
    authUsers
      .filter((user) => normalizeEmail(user.email))
      .map((user) => [normalizeEmail(user.email) as string, user])
  )

  const activeDbUsers = dbUsers.filter((user) => authUsersById.has(user.auth_user_id))
  const orphanedDbUsers = dbUsers.filter((user) => !authUsersById.has(user.auth_user_id))
  const authUsersMissingDbRows = authUsers.filter((user) => !dbUsersByAuthId.has(user.id))

  return {
    authUsers,
    dbUsers,
    authUsersByEmail,
    activeDbUsers,
    orphanedDbUsers,
    authUsersMissingDbRows,
  }
}

async function getPerUserImpact(userIds: string[]) {
  if (userIds.length === 0) return []

  const values = userIds.map((id) => `'${id.replace(/'/g, "''")}'`).join(', ')
  const sql = `
    select
      u.id,
      u.email,
      (select count(*) from "public"."Account" a where a."userId" = u.id) as account_count,
      (select count(*) from "public"."MasterAccount" ma where ma."userId" = u.id) as master_account_count,
      (select count(*) from "public"."DashboardTemplate" dt where dt."userId" = u.id) as dashboard_template_count,
      (select count(*) from "public"."Trade" t where t."userId" = u.id) as trade_count,
      (select count(*) from "public"."ActivityLog" al where al."userId" = u.id) as activity_count,
      (select count(*) from "public"."UserGeoLog" g where g."userId" = u.id) as geo_count,
      (select count(*) from "public"."WeeklyReview" wr where wr."userId" = u.id) as weekly_review_count
    from "public"."User" u
    where u.id in (${values})
    order by u.email asc
  `

  return prisma.$queryRawUnsafe(sql)
}

function classifyCleanup(
  orphanedDbUsers: CleanupCandidate[],
  authUsersMissingDbRows: AuthUser[],
  authUsersByEmail: Map<string, AuthUser>
) {
  const missingDbRowEmails = new Set(
    authUsersMissingDbRows.map((user) => normalizeEmail(user.email)).filter(Boolean) as string[]
  )

  const relinkCandidates: Array<{
    dbUser: CleanupCandidate
    authUser: AuthUser
  }> = []
  const deleteCandidates: CleanupCandidate[] = []

  for (const dbUser of orphanedDbUsers) {
    const normalizedEmail = normalizeEmail(dbUser.email)
    const authUser = normalizedEmail ? authUsersByEmail.get(normalizedEmail) ?? null : null

    if (authUser && normalizedEmail && missingDbRowEmails.has(normalizedEmail)) {
      relinkCandidates.push({ dbUser, authUser })
      continue
    }

    deleteCandidates.push(dbUser)
  }

  return {
    relinkCandidates,
    deleteCandidates,
  }
}

async function ensureAuthDeletionTrigger() {
  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_proc
        WHERE proname = 'handle_auth_user_deleted_cleanup'
      ) THEN
        CREATE FUNCTION public.handle_auth_user_deleted_cleanup()
        RETURNS trigger
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $fn$
        BEGIN
          DELETE FROM "public"."User" WHERE auth_user_id = OLD.id::text;
          RETURN OLD;
        END;
        $fn$;
      END IF;
    END $$;
  `)

  await prisma.$executeRawUnsafe(`
    DROP TRIGGER IF EXISTS on_auth_user_deleted_cleanup ON auth.users
  `)

  await prisma.$executeRawUnsafe(`
    CREATE TRIGGER on_auth_user_deleted_cleanup
    AFTER DELETE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_auth_user_deleted_cleanup()
  `)
}

function buildMarkdownReport(params: {
  generatedAt: string
  apply: boolean
  before: Awaited<ReturnType<typeof getDirectorySnapshot>>
  after: Awaited<ReturnType<typeof getDirectorySnapshot>> | null
  relinkCandidates: Array<{ dbUser: CleanupCandidate; authUser: AuthUser }>
  deleteCandidates: CleanupCandidate[]
  impactBefore: unknown[]
  actions: string[]
}) {
  const lines: string[] = []
  const { generatedAt, apply, before, after, relinkCandidates, deleteCandidates, impactBefore, actions } = params

  lines.push('# Orphaned User Cleanup')
  lines.push('')
  lines.push(`Generated at: ${generatedAt}`)
  lines.push(`Mode: ${apply ? 'apply' : 'dry-run'}`)
  lines.push('')
  lines.push('## Before')
  lines.push('')
  lines.push(`- Auth users: ${before.authUsers.length}`)
  lines.push(`- DB users: ${before.dbUsers.length}`)
  lines.push(`- Orphaned DB users: ${before.orphanedDbUsers.length}`)
  lines.push(`- Auth users missing DB rows: ${before.authUsersMissingDbRows.length}`)
  lines.push('')
  lines.push('## Planned Actions')
  lines.push('')

  if (relinkCandidates.length === 0 && deleteCandidates.length === 0) {
    lines.push('- No orphaned users were eligible for cleanup.')
  }

  for (const candidate of relinkCandidates) {
    lines.push(`- Relink ${candidate.dbUser.email}: ${candidate.dbUser.id} -> ${candidate.authUser.id}`)
  }

  for (const candidate of deleteCandidates) {
    lines.push(`- Delete orphaned DB user ${candidate.email} (${candidate.id})`)
  }

  lines.push('')
  lines.push('## Per-User Impact Before Cleanup')
  lines.push('')

  for (const row of impactBefore as Array<Record<string, unknown>>) {
    lines.push(`- ${row.email}: accounts=${row.account_count}, masterAccounts=${row.master_account_count}, templates=${row.dashboard_template_count}, trades=${row.trade_count}, activity=${row.activity_count}, geo=${row.geo_count}, weeklyReviews=${row.weekly_review_count}`)
  }

  lines.push('')
  lines.push('## Executed Actions')
  lines.push('')
  if (actions.length === 0) {
    lines.push('- No data changes were applied.')
  } else {
    for (const action of actions) {
      lines.push(`- ${action}`)
    }
  }

  if (after) {
    lines.push('')
    lines.push('## After')
    lines.push('')
    lines.push(`- Auth users: ${after.authUsers.length}`)
    lines.push(`- DB users: ${after.dbUsers.length}`)
    lines.push(`- Orphaned DB users: ${after.orphanedDbUsers.length}`)
    lines.push(`- Auth users missing DB rows: ${after.authUsersMissingDbRows.length}`)
  }

  lines.push('')
  lines.push('## Manual File Review')
  lines.push('')
  lines.push('- Storage files were intentionally not deleted in this cleanup pass.')
  lines.push('- Use the latest data-integrity diagnostic artifacts to review orphaned storage objects manually.')

  return `${lines.join('\n')}\n`
}

async function main() {
  loadEnvironment()
  await loadDependencies()

  const options = parseCliArgs(process.argv.slice(2))
  const generatedAt = new Date().toISOString()
  const runDirectory = path.join(options.outDir, toFileTimestamp(generatedAt))
  const latestDirectory = path.join(options.outDir, 'latest')

  await fs.mkdir(runDirectory, { recursive: true })

  const before = await getDirectorySnapshot()
  const { relinkCandidates, deleteCandidates } = classifyCleanup(
    before.orphanedDbUsers,
    before.authUsersMissingDbRows,
    before.authUsersByEmail
  )
  const impactBefore = await getPerUserImpact(before.orphanedDbUsers.map((user) => user.id))
  const actions: string[] = []

  if (options.apply) {
    await prisma.$transaction(async (tx) => {
      for (const candidate of relinkCandidates) {
        const nextEmail = candidate.authUser.email ?? candidate.dbUser.email
        await tx.$executeRawUnsafe(
          `
            UPDATE "public"."User"
            SET id = $1,
                auth_user_id = $1,
                email = $2
            WHERE id = $3
          `,
          candidate.authUser.id,
          nextEmail,
          candidate.dbUser.id
        )
        actions.push(`Relinked ${candidate.dbUser.email} from ${candidate.dbUser.id} to ${candidate.authUser.id}`)
      }

      for (const candidate of deleteCandidates) {
        await tx.user.delete({
          where: { id: candidate.id },
        })
        actions.push(`Deleted orphaned DB user ${candidate.email} (${candidate.id})`)
      }
    })

    await ensureAuthDeletionTrigger()
    actions.push('Ensured auth.users delete trigger cleans matching public.User rows')
  }

  const after = options.apply ? await getDirectorySnapshot() : null

  const summary = {
    generatedAt,
    apply: options.apply,
    before: {
      authUsers: before.authUsers.length,
      dbUsers: before.dbUsers.length,
      orphanedDbUsers: before.orphanedDbUsers,
      authUsersMissingDbRows: before.authUsersMissingDbRows,
    },
    planned: {
      relinkCandidates,
      deleteCandidates,
      impactBefore,
    },
    actions,
    after: after
      ? {
          authUsers: after.authUsers.length,
          dbUsers: after.dbUsers.length,
          orphanedDbUsers: after.orphanedDbUsers,
          authUsersMissingDbRows: after.authUsersMissingDbRows,
        }
      : null,
  }

  const report = buildMarkdownReport({
    generatedAt,
    apply: options.apply,
    before,
    after,
    relinkCandidates,
    deleteCandidates,
    impactBefore,
    actions,
  })

  await Promise.all([
    writeJson(path.join(runDirectory, 'cleanup-summary.json'), summary),
    writeJson(path.join(runDirectory, 'raw', 'before-directory.json'), before),
    writeJson(path.join(runDirectory, 'raw', 'impact-before.json'), impactBefore),
    fs.writeFile(path.join(runDirectory, 'cleanup-report.md'), report, 'utf8'),
    writeJson(path.join(latestDirectory, 'latest-run.json'), {
      generatedAt,
      runDirectory,
      apply: options.apply,
    }),
    writeJson(path.join(latestDirectory, 'cleanup-summary.json'), summary),
    fs.writeFile(path.join(latestDirectory, 'cleanup-report.md'), report, 'utf8'),
  ])

  console.log(options.apply ? 'Orphan cleanup applied.' : 'Orphan cleanup dry-run complete.')
  console.log(`Report: ${path.join(runDirectory, 'cleanup-report.md')}`)
  console.log(`Relink candidates: ${relinkCandidates.length}`)
  console.log(`Delete candidates: ${deleteCandidates.length}`)

  if (after) {
    console.log(`Remaining orphaned DB users: ${after.orphanedDbUsers.length}`)
    console.log(`Remaining auth users missing DB rows: ${after.authUsersMissingDbRows.length}`)
  }
}

main()
  .catch(async (error) => {
    console.error('Orphan cleanup failed:')
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    if (prisma) {
      await prisma.$disconnect()
    }
  })
