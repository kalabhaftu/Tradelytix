import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from "next/server";
import {
  getDxFeedToken,
  getDxFeedTrades,
} from "@/app/dashboard/components/import/dxfeed/sync/actions";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const accountId = body?.accountId as string | undefined;

    if (!accountId) {
      return NextResponse.json(
        { success: false, message: "accountId is required" },
        { status: 400 }
      );
    }

    const tokenResult = await getDxFeedToken(accountId);
    if (tokenResult.error || !tokenResult.storedTokenJson) {
      return NextResponse.json(
        {
          success: false,
          message: tokenResult.error || "Missing DxFeed stored token data",
        },
        { status: 400 }
      );
    }

    const syncResult = await getDxFeedTrades(tokenResult.storedTokenJson);
    if (syncResult.error) {
      return NextResponse.json(
        { success: false, message: syncResult.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      savedCount: syncResult.savedCount ?? 0,
      tradesCount: syncResult.tradesCount ?? 0,
      message: "Sync completed",
    });
  } catch (error) {
    logger.error("Error performing DxFeed sync: " + (error instanceof Error ? error.message : String(error)));
    return NextResponse.json(
      { success: false, message: "Failed to perform DxFeed sync" },
      { status: 500 }
    );
  }
}
