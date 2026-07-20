import { inngest } from '../client'
import logger from "@/lib/logger"
import { directSyncUnderDevelopmentMessage } from '@/lib/integrations/direct-sync-status'

export const syncTradovateData = inngest.createFunction(
  { id: 'sync-tradovate-data' },
  { event: 'import/tradovate.sync' },
  async ({ event, step }) => {
    const { userId, importId } = event.data

    await step.run('process-tradovate-sync', async () => {
      logger.info({ userId, importId }, 'Tradovate sync skipped while under development')
      return { status: 'skipped', message: directSyncUnderDevelopmentMessage('Tradovate') }
    })
  }
)
