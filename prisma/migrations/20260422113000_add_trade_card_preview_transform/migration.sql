-- Persist social-style crop state for trade card preview images
ALTER TABLE "public"."Trade"
ADD COLUMN "cardPreviewTransform" JSONB;
