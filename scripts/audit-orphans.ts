import { PrismaClient } from '@prisma/client'
import { config as loadEnvFile } from 'dotenv'
import path from 'path'

async function main() {
  loadEnvFile({ path: path.join(process.cwd(), '.env') })
  loadEnvFile({ path: path.join(process.cwd(), '.env.local'), override: true })

  const url = process.env.DIRECT_URL || process.env.DATABASE_URL
  if (!url) throw new Error('Database URL missing')
  
  const prisma = new PrismaClient({
    datasources: { db: { url } }
  })

  // Also check for "Ghost" users (in public.User but NOT in auth.users)
  // This requires the Supabase Admin client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  let supabase: any = null

  if (supabaseUrl && supabaseKey) {
    const { createClient } = await import('@supabase/supabase-js')
    supabase = createClient(supabaseUrl, supabaseKey)

    console.log('\n--- Checking for Ghost Users (DB user exists but Auth user is gone) ---')
    const dbUsers = await prisma.user.findMany({ select: { id: true, email: true } })
    
    // Fetch all auth users (handling pagination)
    let authUserIds = new Set<string>()
    let page = 1
    const perPage = 1000
    
    while (true) {
      const { data: { users }, error } = await supabase.auth.admin.listUsers({
        page,
        perPage
      })
      
      if (error) {
        console.error('Error listing auth users:', error.message)
        break
      }
      
      if (!users || users.length === 0) break
      
      users.forEach((u: any) => authUserIds.add(u.id))
      if (users.length < perPage) break
      page++
    }

    let ghostCount = 0
    for (const user of dbUsers) {
      if (!authUserIds.has(user.id)) {
        console.log(`[!] Ghost user found: ${user.email} (${user.id})`)
        ghostCount++
        
        if (process.argv.includes('--fix')) {
          console.log(`    -> Deleting ghost user from DB...`)
          await prisma.user.delete({ where: { id: user.id } }).catch(() => {})
          console.log(`    [✓] Done.`)
        }
      }
    }

    if (ghostCount === 0) {
      console.log('[✓] No ghost users found.')
    }
  }

  console.log('\n--- Checking for Old Abandoned Payments (24h+) ---')
  try {
    const oneDayAgo = new Date()
    oneDayAgo.setHours(oneDayAgo.getHours() - 24)

    const unfinishedPayments = await prisma.paymentRecord.findMany({
      where: {
        providerStatus: { in: ['pending', 'waiting', 'confirming', 'sending'] },
        createdAt: { lt: oneDayAgo }
      },
      select: { id: true, createdAt: true, providerStatus: true, userId: true }
    })

    if (unfinishedPayments.length > 0) {
      console.log(`[!] Found ${unfinishedPayments.length} abandoned payments older than 24 hours.`)
      if (process.argv.includes('--fix')) {
        console.log(`    -> Marking as EXPIRED...`)
        await prisma.paymentRecord.updateMany({
          where: { id: { in: unfinishedPayments.map(p => p.id) } },
          data: { providerStatus: 'expired', expiredAt: new Date() }
        })
        console.log(`    [✓] Done.`)
      }
    } else {
      console.log('[✓] No abandoned payments found.')
    }
  } catch (e: any) {
    console.log(`[?] Error checking payments: ${e.message}`)
  }

  let totalOrphanedFolders = 0

  console.log('\n--- Checking for Orphaned Storage (Buckets & Folders) ---')
  if (supabase) {
    try {
      const { data: buckets } = await supabase.storage.listBuckets()
      const dbUsers = await prisma.user.findMany({ select: { id: true, auth_user_id: true } })
      const validIds = new Set([
        ...dbUsers.map(u => u.id),
        ...dbUsers.map(u => u.auth_user_id)
      ])

      if (buckets) {
        for (const bucket of buckets) {
          // 1. Check if the bucket ITSELF is orphaned (name is a UUID not in our system)
          const isBucketUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(bucket.name)
          if (isBucketUuid && !validIds.has(bucket.name)) {
            // Additional check: Does it have any files? If it's a UUID and has no user, it's an orphan.
            console.log(`[!] Orphaned bucket found (UUID but no user matches): ${bucket.name}`)
            totalOrphanedFolders++

            if (process.argv.includes('--fix')) {
              console.log(`    -> Attempting to delete orphaned bucket ${bucket.name}...`)
              
              // Must delete all files inside first
              const { data: files } = await supabase.storage.from(bucket.name).list('', { recursive: true })
              if (files && files.length > 0) {
                console.log(`       -> Deleting ${files.length} files first...`)
                await supabase.storage.from(bucket.name).remove(files.map((f: any) => f.name))
              }

              const { error: delError } = await supabase.storage.deleteBucket(bucket.name)
              if (delError) {
                console.log(`    [!] Failed to delete bucket: ${delError.message}`)
              } else {
                console.log(`    [✓] Bucket deleted.`)
              }
            }
            continue 
          }

          // 2. Check for orphaned folders within known shared buckets
          const foldersToCheck = ['trades', 'avatars', 'notes', 'backtests', 'weekly-calendars']
          
          for (const folder of foldersToCheck) {
            const { data: subfolders, error } = await supabase.storage.from(bucket.name).list(folder)
            if (error || !subfolders) continue

            for (const sub of subfolders) {
              const name = sub.name
              const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(name)
              
              if (isUuid && !validIds.has(name)) {
                console.log(`[!] Orphaned folder found in ${bucket.name}/${folder}: ${name}`)
                totalOrphanedFolders++

                if (process.argv.includes('--fix')) {
                  console.log(`    -> Deleting orphaned folder ${bucket.name}/${folder}/${name}...`)
                  const { data: files, error: listError } = await supabase.storage.from(bucket.name).list(`${folder}/${name}`, { recursive: true })
                  
                  if (listError) {
                    console.log(`    [!] Error listing files: ${listError.message}`)
                  } else if (files && files.length > 0) {
                    const filesToRemove = files.filter((f: any) => f.id)
                    
                    if (filesToRemove.length > 0) {
                      console.log(`    -> Removing ${filesToRemove.length} actual files...`)
                      const filePaths = filesToRemove.map((f: any) => `${folder}/${name}/${f.name}`)
                      const { error: removeError } = await supabase.storage.from(bucket.name).remove(filePaths)
                      if (removeError) {
                        console.log(`    [!] Error removing files: ${removeError.message}`)
                      } else {
                        console.log(`    [✓] Files removed.`)
                      }
                    } else {
                      // Attempt to remove prefix itself if no files found (virtual folders)
                      await supabase.storage.from(bucket.name).remove([ `${folder}/${name}` ]).catch(() => {})
                    }
                  } else {
                    console.log(`    [i] Folder is empty or contains no files.`)
                  }
                }
              }
            }
          }
        }
      }

      if (totalOrphanedFolders === 0) {
        console.log('[✓] No orphaned storage buckets or folders found.')
      }
    } catch (e: any) {
      console.log(`[?] Error checking storage: ${e.message}`)
    }
  }

  console.log('\n--- Database Integrity Audit (Orphaned Records) ---')

  const tablesWithUserRelation = [
    'Account',
    'Trade',
    'TradeExecution',
    'BacktestTrade',
    'DailyNote',
    'MasterAccount',
    'ActivityLog',
    'ImportJob',
    'JournalTemplate',
    'Notification',
    'WeeklyReview',
    'TradeTag',
    'TradingModel',
    'UserGeoLog',
    'UserGoal',
    'SharedReport',
    'DashboardTemplate',
    'LiveAccountTransaction',
    'WeeklyAIReview',
    'Subscription',
    'PaymentRecord',
    'PromoRedemption',
    'Feedback',
    'UserSettings',
    'ErrorLog'
  ]

  const isFixMode = process.argv.includes('--fix')
  let totalOrphans = 0

  for (const tableName of tablesWithUserRelation) {
    try {
      // Find records where userId is not in the User table
      const orphans = await prisma.$queryRawUnsafe<any[]>(`
        SELECT COUNT(*)::int as count 
        FROM "${tableName}" t
        LEFT JOIN "User" u ON t."userId" = u."id"
        WHERE t."userId" IS NOT NULL AND u."id" IS NULL
      `)

      const count = orphans[0].count
      if (count > 0) {
        console.log(`[!] ${tableName.padEnd(25)}: ${count} orphaned records found.`)
        totalOrphans += count

        if (isFixMode) {
          console.log(`    -> Deleting ${count} orphans from ${tableName}...`)
          await prisma.$executeRawUnsafe(`
            DELETE FROM "${tableName}"
            WHERE "userId" IN (
              SELECT t."userId"
              FROM "${tableName}" t
              LEFT JOIN "User" u ON t."userId" = u."id"
              WHERE t."userId" IS NOT NULL AND u."id" IS NULL
            )
          `)
          console.log(`    [✓] Done.`)
        }
      } else {
        console.log(`[✓] ${tableName.padEnd(25)}: Clean.`)
      }
    } catch (e: any) {
      console.log(`[?] ${tableName.padEnd(25)}: Error (${e.message})`)
    }
  }

  // Also check TradeExecution specifically since it has tradeId as well
  try {
    const orphans = await prisma.$queryRawUnsafe<any[]>(`
      SELECT COUNT(*)::int as count 
      FROM "TradeExecution" te
      LEFT JOIN "Trade" t ON te."tradeId" = t."id"
      WHERE t."id" IS NULL
    `)
    const count = orphans[0].count
    if (count > 0) {
      console.log(`[!] TradeExecution (to Trade)  : ${count} orphaned records found.`)
      totalOrphans += count
      if (isFixMode) {
        console.log(`    -> Deleting ${count} orphans from TradeExecution...`)
        await prisma.$executeRawUnsafe(`
          DELETE FROM "TradeExecution"
          WHERE "tradeId" NOT IN (SELECT "id" FROM "Trade")
        `)
        console.log(`    [✓] Done.`)
      }
    }
  } catch (e) {}

  console.log('\n--- Summary ---')
  console.log(`- Orphaned DB Records: ${totalOrphans}`)
  console.log(`- Orphaned Storage:    ${totalOrphanedFolders}`)
  
  if ((totalOrphans > 0 || totalOrphanedFolders > 0) && !isFixMode) {
    console.log('\n[!] Run with --fix to clean these up: npx tsx scripts/audit-orphans.ts --fix')
  } else if (isFixMode) {
    console.log('\n[✓] Cleanup complete.')
  } else {
    console.log('\n[✓] Everything is clean.')
  }

  await prisma.$disconnect()
}

main().catch(console.error)
