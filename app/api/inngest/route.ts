import { serve } from 'inngest/next'
import { inngest } from '@/lib/inngest/client'
import { resetDailyAnchors } from '@/lib/inngest/functions/reset-daily-anchors'
import { syncRithmicData } from '@/lib/inngest/functions/sync-rithmic'
import { syncTradovateData } from '@/lib/inngest/functions/sync-tradovate'
import { syncThorData } from '@/lib/inngest/functions/sync-thor'
import { checkBreaches } from '@/lib/inngest/functions/check-breaches'
import { weeklyAiReview } from '@/lib/inngest/functions/weekly-ai-review'

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    resetDailyAnchors,
    syncRithmicData,
    syncTradovateData,
    syncThorData,
    checkBreaches,
    weeklyAiReview
  ],
})
