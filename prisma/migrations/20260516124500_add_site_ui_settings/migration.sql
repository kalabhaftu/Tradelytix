CREATE TABLE IF NOT EXISTS "public"."SiteUiSettings" (
  "id" TEXT NOT NULL,
  "showDonateButton" BOOLEAN NOT NULL DEFAULT true,
  "showFeedbackButton" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "SiteUiSettings_pkey" PRIMARY KEY ("id")
);

INSERT INTO "public"."SiteUiSettings" ("id", "showDonateButton", "showFeedbackButton")
VALUES ('global', true, true)
ON CONFLICT ("id") DO NOTHING;
