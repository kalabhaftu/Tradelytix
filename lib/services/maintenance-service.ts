import { logger } from '@/lib/logger'
import { prisma } from '@/lib/prisma'

/**
 * Maintenance Service
 * Handles periodic database cleanup and optimization tasks.
 */

/**
 * Clean up old activity logs.
 * Deletes logs older than the specified number of days.
 */
export async function cleanupActivityLogs(daysOld = 90) {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - daysOld)

  logger.info('[Maintenance] Cleaning up activity logs', { daysOld, cutoff: cutoff.toISOString() })
  
  const result = await prisma.activityLog.deleteMany({
    where: {
      createdAt: {
        lt: cutoff
      }
    }
  })

  return { deleted: result.count }
}

/**
 * Clean up old import jobs.
 * Deletes completed or failed import jobs older than the specified number of days.
 */
export async function cleanupImportJobs(daysOld = 7) {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - daysOld)

  logger.info('[Maintenance] Cleaning up import jobs', { daysOld, cutoff: cutoff.toISOString() })
  
  const result = await prisma.importJob.deleteMany({
    where: {
      updatedAt: {
        lt: cutoff
      },
      status: {
        in: ['completed', 'failed', 'cancelled']
      }
    }
  })

  return { deleted: result.count }
}

/**
 * Orchestrator for all daily maintenance tasks.
 */
export async function runDailyMaintenance() {
  const results = {
    activityLogs: { deleted: 0 },
    importJobs: { deleted: 0 },
    errors: [] as string[]
  }

  try {
    results.activityLogs = await cleanupActivityLogs()
  } catch (err) {
    results.errors.push(`ActivityLogs: ${err instanceof Error ? err.message : 'unknown error'}`)
  }

  try {
    results.importJobs = await cleanupImportJobs()
  } catch (err) {
    results.errors.push(`ImportJobs: ${err instanceof Error ? err.message : 'unknown error'}`)
  }

  return results
}
