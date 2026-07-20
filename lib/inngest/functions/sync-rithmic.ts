import { inngest } from '../client'
import logger from '@/lib/logger'
import { directSyncUnderDevelopmentMessage } from '@/lib/integrations/direct-sync-status'

export const syncRithmicData = inngest.createFunction(
  { id: 'sync-rithmic-data' },
  { event: 'import/rithmic.sync' },
  async ({ event, step }) => {
    const { userId, importId } = event.data

    await step.run('process-rithmic-sync', async () => {
      logger.info({ userId, importId }, 'Rithmic sync skipped while under development')
      return { status: 'skipped', message: directSyncUnderDevelopmentMessage('Rithmic') }
    })
  }
)
