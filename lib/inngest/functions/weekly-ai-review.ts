import { inngest } from '../client'
import logger from "@/lib/logger"

export const weeklyAiReview = inngest.createFunction(
  { id: 'weekly-ai-review' },
  { cron: '0 0 * * 0' }, // Run every Sunday at midnight
  async ({ step }) => {
    await step.run('generate-weekly-reviews', async () => {
      logger.info('Generating weekly AI reviews for users')
      // Logic to generate reviews
      return { processed: 0 }
    })
  }
)
