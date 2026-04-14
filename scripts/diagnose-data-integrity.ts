import fs from 'fs/promises'
import path from 'path'
import process from 'process'

import { Prisma, PrismaClient } from '@prisma/client'
import { config as loadEnvFile } from 'dotenv'

type CliOptions = {
  outDir: string
  sampleRows: number
  fullDump: boolean
}

type TableColumn = {
  column_name: string
  data_type: string
}

type TableSummary = {
  tableName: string
  rowCount: number
  columns: Array<{ name: string; type: string }>
  sample: unknown[]
  fullDumpFile?: string
}

type AuthDirectorySnapshot = {
  authUsers: Array<{
    id: string
    email: string | null
    createdAt: string | null
    lastSignInAt: string | null
    deletedAt: string | null
  }>
  dbUsers: Array<{
    id: string
    email: string
    authUserId: string
  }>
  activeDbUsers: Array<{
    id: string
    email: string
    authUserId: string
  }>
  orphanedDbUsers: Array<{
    id: string
    email: string
    authUserId: string
  }>
  authUsersMissingDbRows: Array<{
    id: string
    email: string | null
  }>
  emailMismatches: Array<{
    userId: string
    dbEmail: string
    authEmail: string | null
  }>
}

type StorageObjectIndex = {
  bucket: string
  name: string
  path: string
  size: number | null
  createdAt: string | null
  updatedAt: string | null
}

type StorageReference = {
  sourceTable: string
  sourceId: string
  field: string
  url: string
  bucket: string | null
  path: string | null
}

const DEFAULT_OUT_DIR = path.join(process.cwd(), 'diagnostics', 'data-integrity')
const DEFAULT_SAMPLE_ROWS = 5
const STORAGE_BUCKETS = ['feedback-attachments', 'trade-images', 'weekly-calendars']

let prisma: PrismaClient
let getSupabaseAdminClient: typeof import('../server/supabase-admin').getSupabaseAdminClient
let listAllAuthUsers: typeof import('../server/supabase-admin').listAllAuthUsers
let activeRunDirectory = DEFAULT_OUT_DIR

function buildDiagnosticDatabaseUrl() {
  const baseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL

  if (!baseUrl) {
    throw new Error('DATABASE_URL or DIRECT_URL is required to run the diagnostic')
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

function loadEnvironment() {
  loadEnvFile({ path: path.join(process.cwd(), '.env') })
  loadEnvFile({ path: path.join(process.cwd(), '.env.local'), override: true })

  if (process.env.DIRECT_URL) {
    process.env.DATABASE_URL = process.env.DIRECT_URL
  }
}

async function loadDependencies() {
  const [supabaseAdminModule] = await Promise.all([
    import('../server/supabase-admin'),
  ])

  prisma = new PrismaClient({
    datasources: {
      db: {
        url: buildDiagnosticDatabaseUrl(),
      },
    },
    log: ['error'],
  })
  getSupabaseAdminClient = supabaseAdminModule.getSupabaseAdminClient
  listAllAuthUsers = supabaseAdminModule.listAllAuthUsers
}

function parseCliArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    outDir: DEFAULT_OUT_DIR,
    sampleRows: DEFAULT_SAMPLE_ROWS,
    fullDump: false,
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]

    if (arg === '--full') {
      options.fullDump = true
      continue
    }

    if (arg === '--out-dir' && argv[index + 1]) {
      options.outDir = path.resolve(process.cwd(), argv[index + 1])
      index += 1
      continue
    }

    if (arg === '--sample-rows' && argv[index + 1]) {
      const parsed = Number(argv[index + 1])
      if (Number.isFinite(parsed) && parsed >= 0) {
        options.sampleRows = parsed
      }
      index += 1
    }
  }

  return options
}

function sanitizeValue(value: unknown): unknown {
  if (value === null || value === undefined) return value

  if (typeof value === 'bigint') return value.toString()
  if (value instanceof Date) return value.toISOString()
  if (Buffer.isBuffer(value)) return `[Buffer ${value.byteLength} bytes]`
  if (value instanceof Uint8Array) return `[Uint8Array ${value.byteLength} bytes]`

  if (Array.isArray(value)) {
    return value.map(sanitizeValue)
  }

  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nestedValue]) => [key, sanitizeValue(nestedValue)])
    )
  }

  return value
}

async function writeJsonFile(filePath: string, payload: unknown) {
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, JSON.stringify(sanitizeValue(payload), null, 2), 'utf8')
}

function toFileTimestamp(value: string) {
  return value.replace(/[:.]/g, '-')
}

function quoteIdentifier(identifier: string) {
  return `"${identifier.replace(/"/g, '""')}"`
}

async function listPublicTables() {
  const tables = await prisma.$queryRaw<Array<{ table_name: string }>>(Prisma.sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    ORDER BY table_name ASC
  `)

  return tables.map((table) => table.table_name)
}

async function listTableColumns(tableName: string) {
  return prisma.$queryRaw<TableColumn[]>(Prisma.sql`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = ${tableName}
    ORDER BY ordinal_position ASC
  `)
}

async function getTableRowCount(tableName: string) {
  const tableRef = `${quoteIdentifier('public')}.${quoteIdentifier(tableName)}`
  const rows = await prisma.$queryRawUnsafe<Array<{ count: string }>>(
    `SELECT COUNT(*)::text AS count FROM ${tableRef}`
  )

  return Number(rows[0]?.count ?? 0)
}

async function getTableSample(tableName: string, sampleRows: number) {
  if (sampleRows <= 0) return []

  const tableRef = `${quoteIdentifier('public')}.${quoteIdentifier(tableName)}`
  return prisma.$queryRawUnsafe<unknown[]>(`SELECT * FROM ${tableRef} LIMIT ${sampleRows}`)
}

async function getFullTableDump(tableName: string) {
  const tableRef = `${quoteIdentifier('public')}.${quoteIdentifier(tableName)}`
  return prisma.$queryRawUnsafe<unknown[]>(`SELECT * FROM ${tableRef}`)
}

async function buildTableSummaries(options: CliOptions) {
  const tables = await listPublicTables()
  const summaries: TableSummary[] = []

  for (const tableName of tables) {
    const [columns, rowCount, sample] = await Promise.all([
      listTableColumns(tableName),
      getTableRowCount(tableName),
      getTableSample(tableName, options.sampleRows),
    ])

    const summary: TableSummary = {
      tableName,
      rowCount,
      columns: columns.map((column) => ({
        name: column.column_name,
        type: column.data_type,
      })),
      sample,
    }

    if (options.fullDump) {
      const rows = await getFullTableDump(tableName)
      const dumpFile = path.join(options.outDir, 'raw', 'tables', `${tableName}.json`)
      await writeJsonFile(dumpFile, rows)
      summary.fullDumpFile = path.relative(options.outDir, dumpFile)
    }

    summaries.push(summary)
  }

  return summaries
}

async function buildAuthDirectorySnapshot() {
  const [dbUsers, authUsers] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        email: true,
        auth_user_id: true,
      },
      orderBy: {
        email: 'asc',
      },
    }),
    listAllAuthUsers(),
  ])

  const authUsersById = new Map(authUsers.map((user) => [user.id, user]))
  const dbUsersByAuthId = new Map(dbUsers.map((user) => [user.auth_user_id, user]))

  const activeDbUsers = dbUsers.filter((user) => authUsersById.has(user.auth_user_id))
  const orphanedDbUsers = dbUsers.filter((user) => !authUsersById.has(user.auth_user_id))
  const authUsersMissingDbRows = authUsers
    .filter((user) => !dbUsersByAuthId.has(user.id))
    .map((user) => ({
      id: user.id,
      email: user.email ?? null,
    }))

  const emailMismatches = activeDbUsers
    .map((user) => {
      const authUser = authUsersById.get(user.auth_user_id)
      const authEmail = authUser?.email ?? null

      if (!authEmail) return null
      if (authEmail.toLowerCase() === user.email.toLowerCase()) return null

      return {
        userId: user.id,
        dbEmail: user.email,
        authEmail,
      }
    })
    .filter(Boolean) as Array<{
      userId: string
      dbEmail: string
      authEmail: string | null
    }>

  const snapshot: AuthDirectorySnapshot = {
    authUsers: authUsers.map((user) => ({
      id: user.id,
      email: user.email ?? null,
      createdAt: user.created_at ?? null,
      lastSignInAt: user.last_sign_in_at ?? null,
      deletedAt: user.deleted_at ?? null,
    })),
    dbUsers: dbUsers.map((user) => ({
      id: user.id,
      email: user.email,
      authUserId: user.auth_user_id,
    })),
    activeDbUsers: activeDbUsers.map((user) => ({
      id: user.id,
      email: user.email,
      authUserId: user.auth_user_id,
    })),
    orphanedDbUsers: orphanedDbUsers.map((user) => ({
      id: user.id,
      email: user.email,
      authUserId: user.auth_user_id,
    })),
    authUsersMissingDbRows,
    emailMismatches,
  }

  return snapshot
}

async function buildOrphanedUserImpact(orphanedUserIds: string[]) {
  if (orphanedUserIds.length === 0) {
    return []
  }

  const userScopedTables = await prisma.$queryRaw<Array<{ table_name: string }>>(Prisma.sql`
    SELECT table_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND column_name = 'userId'
    ORDER BY table_name ASC
  `)

  const results: Array<{ tableName: string; orphanedRows: number }> = []

  for (const { table_name: tableName } of userScopedTables) {
    const rows = await prisma.$queryRawUnsafe<Array<{ count: string }>>(
      `SELECT COUNT(*)::text AS count FROM ${quoteIdentifier('public')}.${quoteIdentifier(tableName)} WHERE "userId" IN (${orphanedUserIds
        .map((id) => `'${id.replace(/'/g, "''")}'`)
        .join(', ')})`
    )

    results.push({
      tableName,
      orphanedRows: Number(rows[0]?.count ?? 0),
    })
  }

  return results.filter((row) => row.orphanedRows > 0)
}

function createSupabaseStoragePathIndex(url: string) {
  try {
    const parsed = new URL(url)
    const marker = '/storage/v1/object/public/'
    const markerIndex = parsed.pathname.indexOf(marker)
    if (markerIndex === -1) return { bucket: null, path: null }

    const storagePath = parsed.pathname.slice(markerIndex + marker.length)
    const [bucket, ...rest] = storagePath.split('/').filter(Boolean)
    if (!bucket || rest.length === 0) {
      return { bucket: null, path: null }
    }

    return {
      bucket: decodeURIComponent(bucket),
      path: rest.map((segment) => decodeURIComponent(segment)).join('/'),
    }
  } catch {
    return { bucket: null, path: null }
  }
}

async function listBucketObjects(bucket: string, prefix = ''): Promise<StorageObjectIndex[]> {
  const supabase = getSupabaseAdminClient()
  const visitedPrefixes = new Set<string>()

  async function walk(currentPrefix: string): Promise<StorageObjectIndex[]> {
    if (visitedPrefixes.has(currentPrefix)) {
      return []
    }
    visitedPrefixes.add(currentPrefix)

    let offset = 0
    const collected: StorageObjectIndex[] = []

    while (true) {
      const { data, error } = await supabase.storage.from(bucket).list(currentPrefix, {
        limit: 100,
        offset,
        sortBy: { column: 'name', order: 'asc' },
      })

      if (error) {
        throw new Error(`Failed to list storage bucket "${bucket}" at "${currentPrefix || '/'}": ${error.message}`)
      }

      if (!data || data.length === 0) {
        break
      }

      for (const item of data) {
        const itemPath = currentPrefix ? `${currentPrefix}/${item.name}` : item.name
        const isFolder = !item.id && item.metadata === null

        if (isFolder) {
          collected.push(...(await walk(itemPath)))
          continue
        }

        collected.push({
          bucket,
          name: item.name,
          path: itemPath,
          size: typeof item.metadata?.size === 'number' ? item.metadata.size : null,
          createdAt: item.created_at ?? null,
          updatedAt: item.updated_at ?? null,
        })
      }

      if (data.length < 100) {
        break
      }

      offset += data.length
    }

    return collected
  }

  return walk(prefix)
}

async function buildStorageIndex() {
  const supabase = getSupabaseAdminClient()
  const { data: buckets, error } = await supabase.storage.listBuckets()

  if (error) {
    throw new Error(`Failed to list Supabase buckets: ${error.message}`)
  }

  const availableBuckets = new Set((buckets ?? []).map((bucket) => bucket.name))
  const relevantBuckets = STORAGE_BUCKETS.filter((bucket) => availableBuckets.has(bucket))
  const index: Record<string, StorageObjectIndex[]> = {}

  for (const bucket of relevantBuckets) {
    index[bucket] = await listBucketObjects(bucket)
  }

  return {
    availableBuckets: (buckets ?? []).map((bucket) => ({
      id: bucket.id,
      name: bucket.name,
      public: bucket.public,
      fileSizeLimit: bucket.file_size_limit,
      allowedMimeTypes: bucket.allowed_mime_types,
    })),
    objectsByBucket: index,
  }
}

async function buildStorageReferenceIndex() {
  const [feedbackItems, trades, backtestTrades, weeklyReviews] = await Promise.all([
    prisma.feedback.findMany({
      select: {
        id: true,
        attachments: true,
      },
    }),
    prisma.trade.findMany({
      select: {
        id: true,
        cardPreviewImage: true,
        imageOne: true,
        imageTwo: true,
        imageThree: true,
        imageFour: true,
        imageFive: true,
        imageSix: true,
      },
    }),
    prisma.backtestTrade.findMany({
      select: {
        id: true,
        cardPreviewImage: true,
        imageOne: true,
        imageTwo: true,
        imageThree: true,
        imageFour: true,
        imageFive: true,
        imageSix: true,
      },
    }),
    prisma.weeklyReview.findMany({
      select: {
        id: true,
        calendarImage: true,
      },
    }),
  ])

  const references: StorageReference[] = []

  for (const item of feedbackItems) {
    const attachments = Array.isArray(item.attachments) ? item.attachments : []

    for (const attachment of attachments) {
      if (!attachment || typeof attachment !== 'object') continue

      const url = typeof (attachment as Record<string, unknown>).url === 'string'
        ? (attachment as Record<string, string>).url
        : null

      if (!url) continue

      const resolved = createSupabaseStoragePathIndex(url)
      references.push({
        sourceTable: 'Feedback',
        sourceId: item.id,
        field: 'attachments',
        url,
        bucket: resolved.bucket,
        path: resolved.path,
      })
    }
  }

  const imageFields = ['cardPreviewImage', 'imageOne', 'imageTwo', 'imageThree', 'imageFour', 'imageFive', 'imageSix'] as const

  for (const trade of trades) {
    for (const field of imageFields) {
      const url = trade[field]
      if (!url) continue

      const resolved = createSupabaseStoragePathIndex(url)
      references.push({
        sourceTable: 'Trade',
        sourceId: trade.id,
        field,
        url,
        bucket: resolved.bucket,
        path: resolved.path,
      })
    }
  }

  for (const backtest of backtestTrades) {
    for (const field of imageFields) {
      const url = backtest[field]
      if (!url) continue

      const resolved = createSupabaseStoragePathIndex(url)
      references.push({
        sourceTable: 'BacktestTrade',
        sourceId: backtest.id,
        field,
        url,
        bucket: resolved.bucket,
        path: resolved.path,
      })
    }
  }

  for (const review of weeklyReviews) {
    if (!review.calendarImage) continue

    const resolved = createSupabaseStoragePathIndex(review.calendarImage)
    references.push({
      sourceTable: 'WeeklyReview',
      sourceId: review.id,
      field: 'calendarImage',
      url: review.calendarImage,
      bucket: resolved.bucket,
      path: resolved.path,
    })
  }

  return references
}

function compareStorageState(
  references: StorageReference[],
  objectsByBucket: Record<string, StorageObjectIndex[]>
) {
  const referenceKeyMap = new Map<string, StorageReference[]>()

  for (const reference of references) {
    if (!reference.bucket || !reference.path) continue
    const key = `${reference.bucket}/${reference.path}`
    const existing = referenceKeyMap.get(key) ?? []
    existing.push(reference)
    referenceKeyMap.set(key, existing)
  }

  const storageObjects = Object.values(objectsByBucket).flat()
  const storageObjectMap = new Map(storageObjects.map((object) => [`${object.bucket}/${object.path}`, object]))

  const missingObjects = Array.from(referenceKeyMap.entries())
    .filter(([key]) => !storageObjectMap.has(key))
    .map(([key, refs]) => ({
      key,
      references: refs,
    }))

  const orphanedObjects = storageObjects
    .filter((object) => !referenceKeyMap.has(`${object.bucket}/${object.path}`))
    .sort((left, right) => left.path.localeCompare(right.path))

  const unresolvedReferences = references.filter((reference) => !reference.bucket || !reference.path)

  return {
    missingObjects,
    orphanedObjects,
    unresolvedReferences,
  }
}

function buildMarkdownReport(params: {
  generatedAt: string
  tableSummaries: TableSummary[]
  authDirectory: AuthDirectorySnapshot
  orphanedUserImpact: Array<{ tableName: string; orphanedRows: number }>
  storageIndex: Awaited<ReturnType<typeof buildStorageIndex>>
  storageReferences: StorageReference[]
  storageDiff: ReturnType<typeof compareStorageState>
}) {
  const {
    generatedAt,
    tableSummaries,
    authDirectory,
    orphanedUserImpact,
    storageIndex,
    storageReferences,
    storageDiff,
  } = params

  const lines: string[] = []

  lines.push('# Data Integrity Diagnostic')
  lines.push('')
  lines.push(`Generated at: ${generatedAt}`)
  lines.push('')
  lines.push('## Snapshot')
  lines.push('')
  lines.push(`- Public tables inspected: ${tableSummaries.length}`)
  lines.push(`- Total DB users: ${authDirectory.dbUsers.length}`)
  lines.push(`- Total Supabase Auth users: ${authDirectory.authUsers.length}`)
  lines.push(`- Active DB users backed by auth: ${authDirectory.activeDbUsers.length}`)
  lines.push(`- Orphaned DB users with no auth user: ${authDirectory.orphanedDbUsers.length}`)
  lines.push(`- Auth users missing DB rows: ${authDirectory.authUsersMissingDbRows.length}`)
  lines.push(`- Email mismatches: ${authDirectory.emailMismatches.length}`)
  lines.push(`- Relevant storage references found in DB: ${storageReferences.length}`)
  lines.push(`- Missing storage objects referenced by DB: ${storageDiff.missingObjects.length}`)
  lines.push(`- Orphaned storage objects not referenced by DB: ${storageDiff.orphanedObjects.length}`)
  lines.push('')
  lines.push('## User/Auth Mismatch')
  lines.push('')

  if (authDirectory.orphanedDbUsers.length === 0) {
    lines.push('- No orphaned DB users were found.')
  } else {
    for (const user of authDirectory.orphanedDbUsers) {
      lines.push(`- Orphaned DB user: ${user.email} | dbId=${user.id} | authUserId=${user.authUserId}`)
    }
  }

  if (authDirectory.authUsersMissingDbRows.length > 0) {
    lines.push('')
    lines.push('### Auth Users Missing DB Rows')
    lines.push('')
    for (const user of authDirectory.authUsersMissingDbRows) {
      lines.push(`- ${user.email ?? '(no email)'} | authUserId=${user.id}`)
    }
  }

  if (authDirectory.emailMismatches.length > 0) {
    lines.push('')
    lines.push('### Email Mismatches')
    lines.push('')
    for (const mismatch of authDirectory.emailMismatches) {
      lines.push(`- dbUser=${mismatch.userId} | dbEmail=${mismatch.dbEmail} | authEmail=${mismatch.authEmail ?? '(missing)'}`)
    }
  }

  if (orphanedUserImpact.length > 0) {
    lines.push('')
    lines.push('### Orphaned User Impact By Table')
    lines.push('')
    for (const row of orphanedUserImpact) {
      lines.push(`- ${row.tableName}: ${row.orphanedRows} rows tied to orphaned users`)
    }
  }

  lines.push('')
  lines.push('## Table Counts')
  lines.push('')
  for (const summary of tableSummaries) {
    lines.push(`- ${summary.tableName}: ${summary.rowCount}`)
  }

  lines.push('')
  lines.push('## Storage')
  lines.push('')

  for (const bucket of storageIndex.availableBuckets) {
    const objectCount = storageIndex.objectsByBucket[bucket.name]?.length ?? 0
    lines.push(`- ${bucket.name}: ${objectCount} objects`)
  }

  if (storageDiff.missingObjects.length > 0) {
    lines.push('')
    lines.push('### Missing Objects Referenced By DB')
    lines.push('')
    for (const item of storageDiff.missingObjects.slice(0, 50)) {
      const refList = item.references.map((reference) => `${reference.sourceTable}.${reference.field}:${reference.sourceId}`).join(', ')
      lines.push(`- ${item.key} | referenced by ${refList}`)
    }
    if (storageDiff.missingObjects.length > 50) {
      lines.push(`- ... ${storageDiff.missingObjects.length - 50} more`)
    }
  }

  if (storageDiff.orphanedObjects.length > 0) {
    lines.push('')
    lines.push('### Orphaned Storage Objects')
    lines.push('')
    for (const object of storageDiff.orphanedObjects.slice(0, 50)) {
      lines.push(`- ${object.bucket}/${object.path}`)
    }
    if (storageDiff.orphanedObjects.length > 50) {
      lines.push(`- ... ${storageDiff.orphanedObjects.length - 50} more`)
    }
  }

  if (storageDiff.unresolvedReferences.length > 0) {
    lines.push('')
    lines.push('### Unresolved DB URLs')
    lines.push('')
    for (const reference of storageDiff.unresolvedReferences.slice(0, 30)) {
      lines.push(`- ${reference.sourceTable}.${reference.field}:${reference.sourceId} -> ${reference.url}`)
    }
    if (storageDiff.unresolvedReferences.length > 30) {
      lines.push(`- ... ${storageDiff.unresolvedReferences.length - 30} more`)
    }
  }

  lines.push('')
  lines.push('## Cleanup Direction')
  lines.push('')
  lines.push('- Remove or archive DB users that have no matching Supabase Auth user only after reviewing their dependent rows.')
  lines.push('- Clean storage objects that are not referenced by Feedback, Trade, BacktestTrade, or WeeklyReview.')
  lines.push('- Investigate DB references that point to missing storage objects before deleting their parent rows.')
  lines.push('- Use the JSON artifacts in `raw/` to decide safe cleanup rules per table.')

  return `${lines.join('\n')}\n`
}

async function main() {
  loadEnvironment()
  await loadDependencies()

  const options = parseCliArgs(process.argv.slice(2))
  const generatedAt = new Date().toISOString()
  const runDirectory = path.join(options.outDir, toFileTimestamp(generatedAt))
  const latestDirectory = path.join(options.outDir, 'latest')
  const runOptions = {
    ...options,
    outDir: runDirectory,
  }
  activeRunDirectory = runDirectory

  console.log('Starting data integrity diagnostic...')
  console.log(`Output directory: ${runDirectory}`)

  await fs.mkdir(runDirectory, { recursive: true })

  const tableSummaries = await buildTableSummaries(runOptions)
  console.log(`Inspected ${tableSummaries.length} public tables`)

  const authDirectory = await buildAuthDirectorySnapshot()
  console.log(
    `Compared ${authDirectory.dbUsers.length} DB users with ${authDirectory.authUsers.length} auth users`
  )

  const orphanedUserImpact = await buildOrphanedUserImpact(
    authDirectory.orphanedDbUsers.map((user) => user.id)
  )

  const storageIndex = await buildStorageIndex()
  const storageReferences = await buildStorageReferenceIndex()
  const storageDiff = compareStorageState(storageReferences, storageIndex.objectsByBucket)

  const summaryPayload = {
    generatedAt,
    options,
    tableSummaries,
    authDirectory,
    orphanedUserImpact,
    storage: {
      buckets: storageIndex.availableBuckets,
      objectsByBucket: storageIndex.objectsByBucket,
      references: storageReferences,
      diff: storageDiff,
    },
  }

  const summaryFile = path.join(runDirectory, 'data-integrity-summary.json')
  const reportFile = path.join(runDirectory, 'data-integrity-report.md')
  const reportContent = buildMarkdownReport({
    generatedAt,
    tableSummaries,
    authDirectory,
    orphanedUserImpact,
    storageIndex,
    storageReferences,
    storageDiff,
  })

  await Promise.all([
    writeJsonFile(summaryFile, summaryPayload),
    writeJsonFile(path.join(runDirectory, 'raw', 'table-summaries.json'), tableSummaries),
    writeJsonFile(path.join(runDirectory, 'raw', 'auth-directory.json'), authDirectory),
    writeJsonFile(path.join(runDirectory, 'raw', 'orphaned-user-impact.json'), orphanedUserImpact),
    writeJsonFile(path.join(runDirectory, 'raw', 'storage-index.json'), storageIndex),
    writeJsonFile(path.join(runDirectory, 'raw', 'storage-references.json'), storageReferences),
    writeJsonFile(path.join(runDirectory, 'raw', 'storage-diff.json'), storageDiff),
    fs.writeFile(reportFile, reportContent, 'utf8'),
    writeJsonFile(path.join(latestDirectory, 'latest-run.json'), {
      generatedAt,
      runDirectory,
      summaryFile,
      reportFile,
    }),
    writeJsonFile(path.join(latestDirectory, 'data-integrity-summary.json'), summaryPayload),
    fs.writeFile(path.join(latestDirectory, 'data-integrity-report.md'), reportContent, 'utf8'),
  ])

  console.log('Diagnostic complete.')
  console.log(`Summary JSON: ${summaryFile}`)
  console.log(`Markdown report: ${reportFile}`)
  console.log(`Orphaned DB users: ${authDirectory.orphanedDbUsers.length}`)
  console.log(`Storage objects missing from DB refs: ${storageDiff.orphanedObjects.length}`)
  console.log(`DB refs missing storage objects: ${storageDiff.missingObjects.length}`)
}

main()
  .catch(async (error) => {
    console.error('Data integrity diagnostic failed:')
    console.error(error)
    try {
      await writeJsonFile(path.join(activeRunDirectory, 'data-integrity-error.json'), {
        generatedAt: new Date().toISOString(),
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : null,
      })
    } catch (writeError) {
      console.error('Failed to write error artifact:')
      console.error(writeError)
    }
    process.exitCode = 1
  })
  .finally(async () => {
    if (prisma) {
      await prisma.$disconnect()
    }
  })
