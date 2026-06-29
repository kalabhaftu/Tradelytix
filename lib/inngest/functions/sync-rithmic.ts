import { inngest } from '../client'
import { logger } from '@/lib/logger'
import { db } from '@/lib/db/client'

export const syncRithmicData = inngest.createFunction(
  { id: 'sync-rithmic-data' },
  { event: 'import/rithmic.sync' },
  async ({ event, step }) => {
    const { userId, importId } = event.data

    await step.run('process-rithmic-sync', async () => {
      logger.info({ userId, importId }, 'Processing Rithmic sync')
      // Simulate sync logic for now
      return { status: 'completed' }
    })
  }
)
