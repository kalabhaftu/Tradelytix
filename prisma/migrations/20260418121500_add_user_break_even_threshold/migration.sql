-- Add per-user break-even threshold preference
ALTER TABLE "public"."User"
ADD COLUMN "breakEvenThreshold" DOUBLE PRECISION NOT NULL DEFAULT 10;
