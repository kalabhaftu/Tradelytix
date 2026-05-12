-- Subscription and payment access system

ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'PAYMENT_DUE_SOON';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'PAYMENT_DUE_TODAY';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'PAYMENT_OVERDUE';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'SUBSCRIPTION_EXPIRED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'PAYMENT_RECEIVED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'PAYMENT_FAILED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'ACCESS_RESTORED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'ADMIN_FREE_ACCESS_GRANTED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'ADMIN_FREE_ACCESS_REVOKED';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SubscriptionStatus') THEN
    CREATE TYPE "SubscriptionStatus" AS ENUM ('active', 'past_due', 'unpaid', 'expired', 'cancelled', 'free_access', 'invited_free', 'promo_active');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PaymentStatus') THEN
    CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'waiting', 'confirming', 'confirmed', 'sending', 'finished', 'partially_paid', 'failed', 'refunded', 'expired');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'FreeAccessType') THEN
    CREATE TYPE "FreeAccessType" AS ENUM ('lifetime', 'until_date', 'one_time_signup');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PromoType') THEN
    CREATE TYPE "PromoType" AS ENUM ('percentage_discount', 'fixed_discount', 'free_months', 'lifetime_free');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PromoApplicability') THEN
    CREATE TYPE "PromoApplicability" AS ENUM ('signup_only', 'renewal_only', 'any');
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS "PromoCode" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "type" "PromoType" NOT NULL,
  "applicability" "PromoApplicability" NOT NULL DEFAULT 'signup_only',
  "value" DOUBLE PRECISION NOT NULL,
  "maxUses" INTEGER,
  "usesCount" INTEGER NOT NULL DEFAULT 0,
  "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "validUntil" TIMESTAMP(3),
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "appliesToPlan" TEXT NOT NULL DEFAULT 'pro',
  "createdBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PromoCode_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "FreeAccessInvite" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "type" "FreeAccessType" NOT NULL,
  "expiresAt" TIMESTAMP(3),
  "note" TEXT,
  "grantedBy" TEXT,
  "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "revokedAt" TIMESTAMP(3),
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "registeredAt" TIMESTAMP(3),
  "registeredUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FreeAccessInvite_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Subscription" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "status" "SubscriptionStatus" NOT NULL DEFAULT 'unpaid',
  "planId" TEXT NOT NULL DEFAULT 'pro',
  "currentPeriodStart" TIMESTAMP(3),
  "currentPeriodEnd" TIMESTAMP(3),
  "nextPaymentDue" TIMESTAMP(3),
  "cancelledAt" TIMESTAMP(3),
  "promoCodeId" TEXT,
  "freeAccessId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Subscription_promoCodeId_fkey" FOREIGN KEY ("promoCodeId") REFERENCES "PromoCode"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "Subscription_freeAccessId_fkey" FOREIGN KEY ("freeAccessId") REFERENCES "FreeAccessInvite"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "PaymentRecord" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "subscriptionId" TEXT NOT NULL,
  "planId" TEXT NOT NULL DEFAULT 'pro',
  "amountUsd" DOUBLE PRECISION NOT NULL,
  "provider" TEXT NOT NULL DEFAULT 'nowpayments',
  "providerPaymentId" TEXT,
  "providerInvoiceId" TEXT,
  "providerStatus" TEXT,
  "payCurrency" TEXT,
  "payAmount" DOUBLE PRECISION,
  "paymentUrl" TEXT,
  "invoiceUrl" TEXT,
  "subscriptionPeriodStart" TIMESTAMP(3),
  "subscriptionPeriodEnd" TIMESTAMP(3),
  "dueDate" TIMESTAMP(3),
  "paidAt" TIMESTAMP(3),
  "expiredAt" TIMESTAMP(3),
  "rawProviderPayload" JSONB,
  "promoCodeId" TEXT,
  "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PaymentRecord_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PaymentRecord_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "PaymentRecord_promoCodeId_fkey" FOREIGN KEY ("promoCodeId") REFERENCES "PromoCode"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "PromoRedemption" (
  "id" TEXT NOT NULL,
  "promoCodeId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "redeemedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PromoRedemption_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PromoRedemption_promoCodeId_fkey" FOREIGN KEY ("promoCodeId") REFERENCES "PromoCode"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "PromoCode_code_key" ON "PromoCode"("code");
CREATE INDEX IF NOT EXISTS "PromoCode_code_idx" ON "PromoCode"("code");
CREATE INDEX IF NOT EXISTS "PromoCode_isActive_idx" ON "PromoCode"("isActive");

CREATE UNIQUE INDEX IF NOT EXISTS "FreeAccessInvite_email_key" ON "FreeAccessInvite"("email");
CREATE INDEX IF NOT EXISTS "FreeAccessInvite_email_idx" ON "FreeAccessInvite"("email");
CREATE INDEX IF NOT EXISTS "FreeAccessInvite_isActive_idx" ON "FreeAccessInvite"("isActive");

CREATE UNIQUE INDEX IF NOT EXISTS "Subscription_userId_key" ON "Subscription"("userId");
CREATE INDEX IF NOT EXISTS "Subscription_status_idx" ON "Subscription"("status");
CREATE INDEX IF NOT EXISTS "Subscription_nextPaymentDue_idx" ON "Subscription"("nextPaymentDue");

CREATE UNIQUE INDEX IF NOT EXISTS "PaymentRecord_providerPaymentId_key" ON "PaymentRecord"("providerPaymentId");
CREATE UNIQUE INDEX IF NOT EXISTS "PaymentRecord_providerInvoiceId_key" ON "PaymentRecord"("providerInvoiceId");
CREATE INDEX IF NOT EXISTS "PaymentRecord_userId_idx" ON "PaymentRecord"("userId");
CREATE INDEX IF NOT EXISTS "PaymentRecord_subscriptionId_idx" ON "PaymentRecord"("subscriptionId");
CREATE INDEX IF NOT EXISTS "PaymentRecord_providerPaymentId_idx" ON "PaymentRecord"("providerPaymentId");
CREATE INDEX IF NOT EXISTS "PaymentRecord_providerInvoiceId_idx" ON "PaymentRecord"("providerInvoiceId");
CREATE INDEX IF NOT EXISTS "PaymentRecord_dueDate_idx" ON "PaymentRecord"("dueDate");

CREATE UNIQUE INDEX IF NOT EXISTS "PromoRedemption_promoCodeId_userId_key" ON "PromoRedemption"("promoCodeId", "userId");
CREATE INDEX IF NOT EXISTS "PromoRedemption_userId_idx" ON "PromoRedemption"("userId");
