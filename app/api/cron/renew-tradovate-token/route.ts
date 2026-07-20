import { NextRequest, NextResponse } from 'next/server'

import { validateCronRequest } from '@/lib/cron-auth'
import { directSyncUnderDevelopmentMessage } from '@/lib/integrations/direct-sync-status'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  const authError = validateCronRequest(request)
  if (authError) return authError

  logger.info('[CRON] Tradovate token renewal paused while live sync is under development')

  return NextResponse.json({
    success: true,
    skipped: true,
    message: directSyncUnderDevelopmentMessage('Tradovate'),
    processed: 0,
    tokenRenewals: 0,
    dailySyncs: 0,
  })
}
