import { inngest } from '../client'
import { logger } from '@/lib/logger'

export const checkBreaches = inngest.createFunction(
  { id: 'check-prop-firm-breaches' },
  { cron: '*/15 * * * *' }, // Run every 15 minutes
  async ({ step }) => {
    await step.run('evaluate-breaches', async () => {
      logger.info('Evaluating prop firm breaches')
      // Logic to check breaches
      return { checked: 0, breached: 0 }
    })
  }
)
