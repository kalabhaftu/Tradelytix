import { inngest } from '../client'
import logger from "@/lib/logger"

export const syncTradovateData = inngest.createFunction(
  { id: 'sync-tradovate-data' },
  { event: 'import/tradovate.sync' },
  async ({ event, step }) => {
    const { userId, importId } = event.data

    await step.run('process-tradovate-sync', async () => {
      logger.info({ userId, importId }, 'Processing Tradovate sync')
      // Simulate sync logic for now
      return { status: 'completed' }
    })
  }
)
