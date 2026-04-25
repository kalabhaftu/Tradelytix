CREATE TABLE IF NOT EXISTS "public"."JournalTemplate" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "content" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "JournalTemplate_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "JournalTemplate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "JournalTemplate_userId_name_key" ON "public"."JournalTemplate"("userId", "name");
CREATE INDEX IF NOT EXISTS "JournalTemplate_userId_createdAt_idx" ON "public"."JournalTemplate"("userId", "createdAt");
