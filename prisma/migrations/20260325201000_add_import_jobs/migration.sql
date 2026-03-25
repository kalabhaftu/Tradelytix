-- CreateEnum
CREATE TYPE "public"."ImportJobStatus" AS ENUM ('queued', 'processing', 'completed', 'failed', 'cancelled');

-- CreateTable
CREATE TABLE "public"."ImportJob" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "public"."ImportJobStatus" NOT NULL DEFAULT 'queued',
    "stage" TEXT NOT NULL DEFAULT 'queued',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "totalItems" INTEGER NOT NULL DEFAULT 0,
    "processedItems" INTEGER NOT NULL DEFAULT 0,
    "importedCount" INTEGER NOT NULL DEFAULT 0,
    "skippedCount" INTEGER NOT NULL DEFAULT 0,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "fileData" BYTEA NOT NULL,
    "state" JSONB,
    "error" TEXT,
    "cancelRequested" BOOLEAN NOT NULL DEFAULT false,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImportJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ImportJob_userId_createdAt_idx" ON "public"."ImportJob"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ImportJob_userId_status_idx" ON "public"."ImportJob"("userId", "status");

-- AddForeignKey
ALTER TABLE "public"."ImportJob" ADD CONSTRAINT "ImportJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
