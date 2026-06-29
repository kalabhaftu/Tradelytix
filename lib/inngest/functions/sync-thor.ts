import { inngest } from '../client'
import logger from "@/lib/logger"

export const syncThorData = inngest.createFunction(
  { id: 'sync-thor-data' },
  { event: 'import/thor.sync' },
  async ({ event, step }) => {
    const { userId, importId } = event.data

    await step.run('process-thor-sync', async () => {
      logger.info({ userId, importId }, 'Processing Thor sync')
      // Simulate sync logic for now
      return { status: 'completed' }
    })
  }
)
