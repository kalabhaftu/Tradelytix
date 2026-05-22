-- Add chartStyle column to User table
ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "chartStyle" TEXT NOT NULL DEFAULT 'smooth';

-- Add chartStyle column to UserSettings table
ALTER TABLE "public"."UserSettings" ADD COLUMN IF NOT EXISTS "chartStyle" TEXT NOT NULL DEFAULT 'smooth';
