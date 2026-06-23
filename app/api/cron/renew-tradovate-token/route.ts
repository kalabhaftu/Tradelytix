import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { validateCronRequest } from '@/lib/cron-auth';
import { logger } from '@/lib/logger';

/**
 * Helper function to check if current time matches the configured daily sync time
 * @param dailySyncTime The configured sync time from database
 * @returns true if it's time to sync (within 15 minutes of configured time)
 */
function shouldPerformDailySync(dailySyncTime: Date | null): boolean {
  if (!dailySyncTime) return false;
  
  const now = new Date();
  const syncHour = dailySyncTime.getUTCHours();
  const syncMinute = dailySyncTime.getUTCMinutes();
  const currentHour = now.getUTCHours();
  const currentMinute = now.getUTCMinutes();
  
  // Calculate difference in minutes
  const syncTimeInMinutes = syncHour * 60 + syncMinute;
  const currentTimeInMinutes = currentHour * 60 + currentMinute;
  const diffInMinutes = Math.abs(currentTimeInMinutes - syncTimeInMinutes);
  
  // Check if we're within 15 minutes of the sync time (accounting for day wrap)
  return diffInMinutes <= 15 || diffInMinutes >= (24 * 60 - 15);
}

export async function GET(request: NextRequest) {
  const authError = validateCronRequest(request)
  if (authError) return authError

  try {
    // Get all users with Tradovate tokens from your database
    const synchronizations = await prisma.synchronization.findMany({
      where: {
        service: 'tradovate',
        token: { not: null }
      }
    });

    // If tokenExpiresAt is null, clear the token (invalid state)
    const missingExpiry = synchronizations.filter((s) => !s.tokenExpiresAt);
    if (missingExpiry.length > 0) {
      logger.warn(`[CRON] Clearing ${missingExpiry.length} Tradovate tokens missing tokenExpiresAt`);
      await prisma.synchronization.updateMany({
        where: {
          id: { in: missingExpiry.map((s) => s.id) }
        },
        data: { token: null, tokenExpiresAt: null }
      });
    }

    const validSynchronizations = synchronizations.filter((s) => !!s.tokenExpiresAt);

    let tokenRenewals = 0;
    let dailySyncs = 0;

    const promises = validSynchronizations.map(async (synchronization) => {
      let renewed = false;
      let synced = false;
      
      // Always attempt renewal for each token
      renewed = await renewUserToken(synchronization);
      
      // Check if we should perform daily sync
      if (shouldPerformDailySync(synchronization.dailySyncTime)) {
        synced = await performDailySync(synchronization);
      }
      
      return { renewed, synced };
    });

    const results = await Promise.allSettled(promises);
    
    results.forEach((result) => {
      if (result.status === 'fulfilled' && result.value) {
        if (result.value.renewed) tokenRenewals++;
        if (result.value.synced) dailySyncs++;
      }
    });
    
    return NextResponse.json({ 
      success: true, 
      processed: synchronizations.length,
      tokenRenewals,
      dailySyncs
    });
  } catch (error) {
    logger.error('Cron job error:', error);
    return NextResponse.json({ error: 'Cron job failed' }, { status: 500 });
  }
}

/**
 * Attempts to renew the Tradovate access token for a given synchronization record.
 */
async function renewUserToken(synchronization: any): Promise<boolean> {
  try {
    const apiBaseUrl = synchronization.environment === 'demo' 
      ? 'https://demo.tradovateapi.com' 
      : 'https://live.tradovateapi.com';
    
    logger.info(`[CRON] Attempting token renewal for account ${synchronization.accountId}`);
    
    const renewal = await fetch(`${apiBaseUrl}/auth/renewAccessToken`, {
      headers: {
        'Authorization': `Bearer ${synchronization.token}`
      }
    });
    
    if (!renewal.ok) {
      const errorText = await renewal.text();
      logger.error(`[CRON] Failed to renew token for account ${synchronization.accountId}: ${errorText}`);
      // Remove invalid/expired token
      await prisma.user.update({
        where: { id: synchronization.userId },
        data: {
          synchronizations: {
            update: {
              where: { id: synchronization.id },
              data: { token: null, tokenExpiresAt: null }
            }
          }
        }
      });
      return false;
    }

    const renewalData = await renewal.json();
    
    // Update database
    await prisma.user.update({
      where: { id: synchronization.userId },
      data: {
        synchronizations: {
          update: {
            where: { id: synchronization.id },
            data: { token: renewalData.accessToken, tokenExpiresAt: new Date(renewalData.expirationTime) }
          }
        }
      }
    });

    return true;
  } catch (error) {
    logger.error(`[CRON] Error renewing token for account ${synchronization.accountId}:`, error);
    // On unexpected error, also expire the token to force re-auth
    await prisma.user.update({
      where: { id: synchronization.userId },
      data: {
        synchronizations: {
          update: {
            where: { id: synchronization.id },
            data: { token: null, tokenExpiresAt: null }
          }
        }
      }
    });
    return false;
  }
}

/**
 * Performs a daily sync for the given synchronization by fetching trades from Tradovate
 */
async function performDailySync(synchronization: any): Promise<boolean> {
  try {
    logger.info(`[CRON] Performing daily sync for account ${synchronization.accountId}`);
    
    // Dynamically import the getTradovateTrades action to avoid circular dependencies
    const { getTradovateTrades } = await import('@/app/dashboard/components/import/tradovate/sync/actions');
    
    // Use account-level fee config from DB (includedFeeTypes on sync record)
    const includedFeeTypes = synchronization.includedFeeTypes as Record<string, boolean> | null | undefined
    const result = await getTradovateTrades(synchronization.token, {
      userId: synchronization.userId,
      includedFeeTypes: includedFeeTypes ?? undefined,
    });
    
    if (result.error) {
      logger.error(`[CRON] Failed to sync trades for account ${synchronization.accountId}:`, result.error);
      return false;
    }
    
    logger.info(`[CRON] Successfully synced ${result.savedCount || 0} trades for account ${synchronization.accountId}`);
    return true;
  } catch (error) {
    logger.error(`[CRON] Error during daily sync for account ${synchronization.accountId}:`, error);
    return false;
  }
}
