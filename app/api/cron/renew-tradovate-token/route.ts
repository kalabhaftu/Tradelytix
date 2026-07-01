import { db } from '@/lib/db/client';
import * as schema from '@/lib/db/schema';
import { NextRequest, NextResponse } from 'next/server';
import { validateCronRequest } from '@/lib/cron-auth';
import { logger } from '@/lib/logger';
import { eq, and, isNotNull, inArray } from 'drizzle-orm';

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
  
  return diffInMinutes <= 15 || diffInMinutes >= (24 * 60 - 15);
}

export async function GET(request: NextRequest) {
  const authError = validateCronRequest(request)
  if (authError) return authError

  try {
    // Get all users with Tradovate tokens from your database
    const synchronizations = await db.query.Synchronization.findMany({
      where: (table, { eq, isNotNull }) => and(eq(table.service, 'tradovate'), isNotNull(table.token))
    });

    // If tokenExpiresAt is null, clear the token (invalid state)
    const missingExpiry = synchronizations.filter((s) => !s.tokenExpiresAt);
    if (missingExpiry.length > 0) {
      logger.warn(`[CRON] Clearing ${missingExpiry.length} Tradovate tokens missing tokenExpiresAt`);
      await db.update(schema.Synchronization).set({ token: null, tokenExpiresAt: null }).where(inArray(schema.Synchronization.id, missingExpiry.map((s) => s.id)));
    }

    const validSynchronizations = synchronizations.filter((s) => !!s.tokenExpiresAt);

    let tokenRenewals = 0;
    let dailySyncs = 0;

    const promises = validSynchronizations.map(async (synchronization) => {
      let renewed = false;
      let synced = false;
      
      // Always attempt renewal for each token
      renewed = await renewUserToken(synchronization);
      
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
    logger.error('Cron job error: ' + (error instanceof Error ? error.message : String(error)));
    return NextResponse.json({ error: 'Cron job failed' }, { status: 500 });
  }
}

import { encrypt, decrypt } from '@/lib/security/encryption';

async function renewUserToken(synchronization: any): Promise<boolean> {
  try {
    const apiBaseUrl = synchronization.environment === 'demo' 
      ? 'https://demo.tradovateapi.com' 
      : 'https://live.tradovateapi.com';
    
    logger.info(`[CRON] Attempting token renewal for account ${synchronization.accountId}`);
    
    const decryptedToken = decrypt(synchronization.token) || synchronization.token;
    
    const renewal = await fetch(`${apiBaseUrl}/auth/renewAccessToken`, {
      headers: {
        'Authorization': `Bearer ${decryptedToken}`
      }
    });
    
    if (!renewal.ok) {
      const errorText = await renewal.text();
      logger.error(`[CRON] Failed to renew token for account ${synchronization.accountId}: ${errorText}`);
      // Remove invalid/expired token
      await db.update(schema.Synchronization).set({ token: null, tokenExpiresAt: null }).where(eq(schema.Synchronization.id, synchronization.id));
      return false;
    }

    const renewalData = await renewal.json();
    
    // Update database
    await db.update(schema.Synchronization).set({ token: encrypt(renewalData.accessToken), tokenExpiresAt: new Date(renewalData.expirationTime) }).where(eq(schema.Synchronization.id, synchronization.id));

    return true;
  } catch (error) {
    logger.error(`[CRON] Error renewing token for account ${synchronization.accountId}: ${error instanceof Error ? error.message : String(error)}`);
    // On unexpected error, also expire the token to force re-auth
    await db.update(schema.Synchronization).set({ token: null, tokenExpiresAt: null }).where(eq(schema.Synchronization.id, synchronization.id));
    return false;
  }
}

async function performDailySync(synchronization: any): Promise<boolean> {
  try {
    logger.info(`[CRON] Performing daily sync for account ${synchronization.accountId}`);
    
    // Dynamically import the getTradovateTrades action to avoid circular dependencies
    const { getTradovateTrades } = await import('@/app/dashboard/components/import/tradovate/sync/actions');
    
    // Use account-level fee config from DB (includedFeeTypes on sync record)
    const includedFeeTypes = synchronization.includedFeeTypes as Record<string, boolean> | null | undefined
    const decryptedToken = decrypt(synchronization.token) || synchronization.token;
    const result = await getTradovateTrades(decryptedToken, {
      userId: synchronization.userId,
      ...(includedFeeTypes && { includedFeeTypes: includedFeeTypes as any }),
    });
    
    if (result.error) {
      logger.error(`[CRON] Failed to sync trades for account ${synchronization.accountId}: ${result.error}`);
      return false;
    }
    
    logger.info(`[CRON] Successfully synced ${result.savedCount || 0} trades for account ${synchronization.accountId}`);
    return true;
  } catch (error) {
    logger.error(`[CRON] Error during daily sync for account ${synchronization.accountId}: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}