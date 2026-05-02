-- Migration: Add improvement plan features
-- Adds: webhookToken to UserSettings, trade plan fields to Trade,
--       UserGoal model, SharedReport model

-- UserSettings: add webhookToken
ALTER TABLE "public"."UserSettings" ADD COLUMN IF NOT EXISTS "webhookToken" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "UserSettings_webhookToken_key" ON "public"."UserSettings"("webhookToken");

-- Trade: add trade plan and MAE/MFE fields
ALTER TABLE "public"."Trade" ADD COLUMN IF NOT EXISTS "plannedEntry" TEXT;
ALTER TABLE "public"."Trade" ADD COLUMN IF NOT EXISTS "plannedStopLoss" TEXT;
ALTER TABLE "public"."Trade" ADD COLUMN IF NOT EXISTS "plannedTakeProfit" TEXT;
ALTER TABLE "public"."Trade" ADD COLUMN IF NOT EXISTS "plannedSize" DOUBLE PRECISION;
ALTER TABLE "public"."Trade" ADD COLUMN IF NOT EXISTS "planNotes" TEXT;
ALTER TABLE "public"."Trade" ADD COLUMN IF NOT EXISTS "mae" DOUBLE PRECISION;
ALTER TABLE "public"."Trade" ADD COLUMN IF NOT EXISTS "mfe" DOUBLE PRECISION;

-- UserGoal model
CREATE TABLE IF NOT EXISTS "public"."UserGoal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "metric" TEXT NOT NULL,
    "targetValue" DOUBLE PRECISION NOT NULL,
    "currentValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "period" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserGoal_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "public"."UserGoal" ADD CONSTRAINT "UserGoal_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "UserGoal_userId_idx" ON "public"."UserGoal"("userId");
CREATE INDEX IF NOT EXISTS "UserGoal_userId_isCompleted_idx" ON "public"."UserGoal"("userId", "isCompleted");

-- SharedReport model
CREATE TABLE IF NOT EXISTS "public"."SharedReport" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Trading Report',
    "dateFrom" TEXT,
    "dateTo" TEXT,
    "accountId" TEXT,
    "snapshot" JSONB NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SharedReport_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "public"."SharedReport" ADD CONSTRAINT "SharedReport_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS "SharedReport_slug_key" ON "public"."SharedReport"("slug");
CREATE INDEX IF NOT EXISTS "SharedReport_userId_idx" ON "public"."SharedReport"("userId");
CREATE INDEX IF NOT EXISTS "SharedReport_slug_idx" ON "public"."SharedReport"("slug");
