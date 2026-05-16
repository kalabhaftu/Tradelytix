CREATE TABLE IF NOT EXISTS "public"."AdminWidgetSetting" (
  "id" TEXT NOT NULL,
  "widgetType" TEXT NOT NULL,
  "label" TEXT,
  "description" TEXT,
  "visible" BOOLEAN NOT NULL DEFAULT true,
  "recommended" BOOLEAN NOT NULL DEFAULT false,
  "deprecated" BOOLEAN NOT NULL DEFAULT false,
  "status" TEXT NOT NULL DEFAULT 'stable',
  "premiumOnly" BOOLEAN NOT NULL DEFAULT false,
  "roleGate" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AdminWidgetSetting_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AdminWidgetSetting_widgetType_key" ON "public"."AdminWidgetSetting"("widgetType");
CREATE INDEX IF NOT EXISTS "AdminWidgetSetting_visible_idx" ON "public"."AdminWidgetSetting"("visible");
CREATE INDEX IF NOT EXISTS "AdminWidgetSetting_recommended_idx" ON "public"."AdminWidgetSetting"("recommended");
CREATE INDEX IF NOT EXISTS "AdminWidgetSetting_deprecated_idx" ON "public"."AdminWidgetSetting"("deprecated");

CREATE TABLE IF NOT EXISTS "public"."AdminDashboardPreset" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "segment" TEXT NOT NULL DEFAULT 'all',
  "description" TEXT,
  "layout" JSONB NOT NULL DEFAULT '[]',
  "active" BOOLEAN NOT NULL DEFAULT true,
  "recommended" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AdminDashboardPreset_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AdminDashboardPreset_name_key" ON "public"."AdminDashboardPreset"("name");
CREATE INDEX IF NOT EXISTS "AdminDashboardPreset_segment_idx" ON "public"."AdminDashboardPreset"("segment");
CREATE INDEX IF NOT EXISTS "AdminDashboardPreset_active_idx" ON "public"."AdminDashboardPreset"("active");
CREATE INDEX IF NOT EXISTS "AdminDashboardPreset_recommended_idx" ON "public"."AdminDashboardPreset"("recommended");

CREATE TABLE IF NOT EXISTS "public"."AdminFeatureFlag" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "description" TEXT,
  "enabled" BOOLEAN NOT NULL DEFAULT false,
  "internalOnly" BOOLEAN NOT NULL DEFAULT false,
  "roleGate" TEXT,
  "cohort" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AdminFeatureFlag_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AdminFeatureFlag_key_key" ON "public"."AdminFeatureFlag"("key");
CREATE INDEX IF NOT EXISTS "AdminFeatureFlag_enabled_idx" ON "public"."AdminFeatureFlag"("enabled");
CREATE INDEX IF NOT EXISTS "AdminFeatureFlag_internalOnly_idx" ON "public"."AdminFeatureFlag"("internalOnly");

CREATE TABLE IF NOT EXISTS "public"."AdminSharingPolicy" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL DEFAULT 'default',
  "publicSharingEnabled" BOOLEAN NOT NULL DEFAULT true,
  "defaultExpirationDays" INTEGER,
  "requireExpiration" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AdminSharingPolicy_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AdminSharingPolicy_key_key" ON "public"."AdminSharingPolicy"("key");
