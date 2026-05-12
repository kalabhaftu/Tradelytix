ALTER TABLE "public"."PhaseAccount"
ADD COLUMN IF NOT EXISTS "accountSize" DOUBLE PRECISION;

ALTER TABLE "public"."Trade"
ADD COLUMN IF NOT EXISTS "tradeIdentityKey" TEXT,
ADD COLUMN IF NOT EXISTS "entryPriceValue" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "closePriceValue" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "stopLossValue" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "takeProfitValue" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "chartLinksList" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

ALTER TABLE "public"."Trade"
DROP CONSTRAINT IF EXISTS "unique_trade_identification";

DO $$
BEGIN
  CREATE TYPE "public"."TradeExecutionKind" AS ENUM ('ENTRY', 'EXIT');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "public"."UserSettings" (
  "userId" TEXT NOT NULL,
  "timezone" TEXT NOT NULL DEFAULT 'America/New_York',
  "theme" TEXT NOT NULL DEFAULT 'system',
  "accountFilterSettings" TEXT,
  "aiSettings" JSONB,
  "backtestInputMode" TEXT NOT NULL DEFAULT 'manual',
  "breakEvenThreshold" DOUBLE PRECISION NOT NULL DEFAULT 10,
  "pnlDisplayMode" TEXT NOT NULL DEFAULT 'net',
  "accentPack" TEXT NOT NULL DEFAULT 'classic',
  "autoAdjustAccountDate" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("userId"),
  CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "public"."TradeExecution" (
  "id" TEXT NOT NULL,
  "tradeId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "kind" "public"."TradeExecutionKind" NOT NULL,
  "quantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "price" DOUBLE PRECISION,
  "executedAt" TIMESTAMP(3),
  "pnl" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "commission" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "brokerExecutionId" TEXT,
  "legacySourceTradeId" TEXT,
  "closeReason" TEXT,
  "rawSymbol" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TradeExecution_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "TradeExecution_tradeId_fkey" FOREIGN KEY ("tradeId") REFERENCES "public"."Trade"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "trade_identity_key" ON "public"."Trade"("userId", "tradeIdentityKey");
CREATE INDEX IF NOT EXISTS "Trade_tradeIdentityKey_idx" ON "public"."Trade"("tradeIdentityKey");
CREATE INDEX IF NOT EXISTS "TradeExecution_tradeId_kind_idx" ON "public"."TradeExecution"("tradeId", "kind");
CREATE INDEX IF NOT EXISTS "TradeExecution_tradeId_executedAt_idx" ON "public"."TradeExecution"("tradeId", "executedAt");
CREATE INDEX IF NOT EXISTS "TradeExecution_userId_brokerExecutionId_idx" ON "public"."TradeExecution"("userId", "brokerExecutionId");
CREATE UNIQUE INDEX IF NOT EXISTS "trade_execution_legacy_source_key" ON "public"."TradeExecution"("tradeId", "kind", "legacySourceTradeId");

INSERT INTO "public"."UserSettings" (
  "userId",
  "timezone",
  "theme",
  "accountFilterSettings",
  "aiSettings",
  "backtestInputMode",
  "breakEvenThreshold",
  "pnlDisplayMode",
  "accentPack",
  "autoAdjustAccountDate",
  "createdAt",
  "updatedAt"
)
SELECT
  "id",
  "timezone",
  "theme",
  "accountFilterSettings",
  "aiSettings",
  "backtestInputMode",
  "breakEvenThreshold",
  "pnlDisplayMode",
  "accentPack",
  "autoAdjustAccountDate",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "public"."User"
ON CONFLICT ("userId") DO NOTHING;
