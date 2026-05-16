-- Normalize legacy dashboard-calendar journal rows into the Daily Journal shape.
-- Older dashboard note flows could target the shared DailyNote table with an
-- empty-string account identifier. Daily Journal uses NULL for all-account notes.

UPDATE "public"."DailyNote"
SET "accountId" = NULL
WHERE "accountId" = '';
