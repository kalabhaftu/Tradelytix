import { db } from '@/lib/db/client'
import { sql } from 'drizzle-orm'
import { logger } from '@/lib/logger'

async function main() {
  logger.info('Starting migration: 001-add-zella-version-field')

  try {
    // Add zella_version column to users table if it doesn't exist
    await db.execute(sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS zella_version INTEGER DEFAULT 1;
    `)
    logger.info('Successfully added zella_version to users table.')
    process.exit(0)
  } catch (error) {
    logger.error('Migration failed:', error)
    process.exit(1)
  }
}

main()
