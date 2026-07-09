import { inngest } from '../client'
import logger from '@/lib/logger'
import { Resend } from 'resend'
import { db } from '@/lib/db/client'
import * as schema from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy')

export const checkBreaches = inngest.createFunction(
  { id: 'check-prop-firm-breaches' },
  { cron: '*/15 * * * *' }, // Run every 15 minutes
  async ({ step }) => {
    await step.run('evaluate-breaches', async () => {
      logger.info('Evaluating prop firm breaches')
      
      // In a real implementation, you would fetch prop firm accounts
      // evaluate them against their rules, and then if a breach is detected:
      //
      // const breachedAccounts = await db.query.PropFirmAccount.findMany(...)
      // 
      // for (const account of breachedAccounts) {
      //   if (process.env.RESEND_API_KEY) {
      //     await resend.emails.send({
      //       from: 'Alerts <alerts@jji.app>',
      //       to: [userEmail],
      //       subject: `Prop Firm Rule Breach Detected: ${account.name}`,
      //       html: `<p>Your prop firm account <strong>${account.name}</strong> has breached a rule.</p>`
      //     })
      //   } else {
      //     logger.warn('RESEND_API_KEY not set, skipping breach email')
      //   }
      // }
      
      return { checked: 0, breached: 0 }
    })
  }
)
