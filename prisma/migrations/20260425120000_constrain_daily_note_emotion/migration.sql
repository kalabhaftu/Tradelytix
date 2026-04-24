DO $$
BEGIN
  CREATE TYPE "public"."JournalEmotion" AS ENUM (
    'confident',
    'anxious',
    'focused',
    'energetic',
    'calm',
    'frustrated',
    'optimistic',
    'pessimistic',
    'disciplined',
    'impulsive',
    'happy',
    'sad',
    'neutral',
    'tired',
    'excited',
    'stressed',
    'relaxed'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

UPDATE "public"."DailyNote"
SET "emotion" = NULL
WHERE "emotion" IS NOT NULL
  AND "emotion" NOT IN (
    'confident',
    'anxious',
    'focused',
    'energetic',
    'calm',
    'frustrated',
    'optimistic',
    'pessimistic',
    'disciplined',
    'impulsive',
    'happy',
    'sad',
    'neutral',
    'tired',
    'excited',
    'stressed',
    'relaxed'
  );

ALTER TABLE "public"."DailyNote"
ALTER COLUMN "emotion" TYPE "public"."JournalEmotion"
USING (
  CASE
    WHEN "emotion" IS NULL THEN NULL
    ELSE "emotion"::"public"."JournalEmotion"
  END
);
