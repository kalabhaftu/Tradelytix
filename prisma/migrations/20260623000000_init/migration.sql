-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "BacktestDirection" AS ENUM ('BUY', 'SELL');

-- CreateEnum
CREATE TYPE "BacktestModel" AS ENUM ('ICT_2022', 'MSNR', 'TTFM', 'PRICE_ACTION', 'SUPPLY_DEMAND', 'SMART_MONEY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "BacktestOutcome" AS ENUM ('WIN', 'LOSS', 'BREAKEVEN');

-- CreateEnum
CREATE TYPE "BacktestSession" AS ENUM ('ASIAN', 'LONDON', 'NEW_YORK');

-- CreateEnum
CREATE TYPE "BreachType" AS ENUM ('daily_drawdown', 'max_drawdown');

-- CreateEnum
CREATE TYPE "DrawdownType" AS ENUM ('static', 'trailing');

-- CreateEnum
CREATE TYPE "MarketBias" AS ENUM ('BULLISH', 'BEARISH', 'UNDECIDED');

-- CreateEnum
CREATE TYPE "MasterAccountStatus" AS ENUM ('active', 'funded', 'failed');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('pending', 'approved', 'paid', 'rejected');

-- CreateEnum
CREATE TYPE "NotificationPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('FUNDED_PENDING_APPROVAL', 'FUNDED_APPROVED', 'FUNDED_DECLINED', 'PHASE_TRANSITION_PENDING', 'PAYOUT_APPROVED', 'PAYOUT_REJECTED', 'SYSTEM', 'RISK_ALERT', 'IMPORT_STATUS', 'WEEKLY_PERFORMANCE', 'STRATEGY_DEVIATION', 'SYSTEM_ANNOUNCEMENT', 'TRADE_STATUS', 'RISK_DAILY_LOSS_80', 'RISK_DAILY_LOSS_95', 'RISK_MAX_DRAWDOWN_80', 'RISK_MAX_DRAWDOWN_95', 'IMPORT_PROCESSING', 'IMPORT_COMPLETE', 'STRATEGY_SESSION_VIOLATION', 'FEEDBACK_REPLY', 'PAYMENT_DUE_SOON', 'PAYMENT_DUE_TODAY', 'PAYMENT_OVERDUE', 'SUBSCRIPTION_EXPIRED', 'PAYMENT_RECEIVED', 'PAYMENT_FAILED', 'ACCESS_RESTORED', 'ADMIN_FREE_ACCESS_GRANTED', 'ADMIN_FREE_ACCESS_REVOKED');

-- CreateEnum
CREATE TYPE "ImportJobStatus" AS ENUM ('queued', 'processing', 'completed', 'failed', 'cancelled');

-- CreateEnum
CREATE TYPE "PhaseAccountStatus" AS ENUM ('active', 'passed', 'failed', 'archived', 'pending', 'pending_approval');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('DEPOSIT', 'WITHDRAWAL');

-- CreateEnum
CREATE TYPE "WeeklyExpectation" AS ENUM ('BULLISH_EXPANSION', 'BEARISH_EXPANSION', 'CONSOLIDATION');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('user', 'admin');

-- CreateEnum
CREATE TYPE "TradeOutcome" AS ENUM ('GOOD_WIN', 'BAD_WIN', 'GOOD_BE', 'BAD_BE', 'BREAKEVEN', 'GOOD_LOSS', 'BAD_LOSS');

-- CreateEnum
CREATE TYPE "TradeExecutionKind" AS ENUM ('ENTRY', 'EXIT');

-- CreateEnum
CREATE TYPE "JournalEmotion" AS ENUM ('confident', 'anxious', 'focused', 'energetic', 'calm', 'frustrated', 'optimistic', 'pessimistic', 'disciplined', 'impulsive', 'happy', 'sad', 'neutral', 'tired', 'excited', 'stressed', 'relaxed');

-- CreateEnum
CREATE TYPE "FeedbackCategory" AS ENUM ('BUG_REPORT', 'FEATURE_REQUEST', 'GENERAL', 'OTHER');

-- CreateEnum
CREATE TYPE "FeedbackStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "ErrorSource" AS ENUM ('CLIENT', 'SERVER', 'API');

-- CreateEnum
CREATE TYPE "ErrorLevel" AS ENUM ('WARNING', 'ERROR', 'CRITICAL');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('active', 'past_due', 'unpaid', 'expired', 'cancelled', 'free_access', 'invited_free', 'promo_active');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'waiting', 'confirming', 'confirmed', 'sending', 'finished', 'partially_paid', 'failed', 'refunded', 'expired');

-- CreateEnum
CREATE TYPE "FreeAccessType" AS ENUM ('lifetime', 'until_date', 'one_time_signup');

-- CreateEnum
CREATE TYPE "PromoType" AS ENUM ('percentage_discount', 'fixed_discount', 'free_months', 'lifetime_free');

-- CreateEnum
CREATE TYPE "PromoApplicability" AS ENUM ('signup_only', 'renewal_only', 'any');

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "name" TEXT,
    "broker" TEXT,
    "startingBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "isConfigured" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BacktestTrade" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pair" TEXT NOT NULL,
    "direction" "BacktestDirection" NOT NULL,
    "outcome" "BacktestOutcome" NOT NULL,
    "session" "BacktestSession" NOT NULL,
    "model" "BacktestModel" NOT NULL,
    "customModel" TEXT,
    "riskRewardRatio" DOUBLE PRECISION NOT NULL,
    "entryPrice" DOUBLE PRECISION NOT NULL,
    "stopLoss" DOUBLE PRECISION NOT NULL,
    "takeProfit" DOUBLE PRECISION NOT NULL,
    "exitPrice" DOUBLE PRECISION NOT NULL,
    "pnl" DOUBLE PRECISION NOT NULL,
    "imageOne" TEXT,
    "imageTwo" TEXT,
    "imageThree" TEXT,
    "imageFour" TEXT,
    "imageFive" TEXT,
    "imageSix" TEXT,
    "cardPreviewImage" TEXT,
    "notes" TEXT,
    "tags" TEXT[],
    "dateExecuted" TIMESTAMP(3) NOT NULL,
    "backtestDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "riskPoints" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rewardPoints" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "BacktestTrade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BreachRecord" (
    "id" TEXT NOT NULL,
    "phaseAccountId" TEXT NOT NULL,
    "breachType" "BreachType" NOT NULL,
    "breachAmount" DOUBLE PRECISION NOT NULL,
    "breachTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentEquity" DOUBLE PRECISION NOT NULL,
    "accountSize" DOUBLE PRECISION NOT NULL,
    "dailyStartBalance" DOUBLE PRECISION,
    "highWaterMark" DOUBLE PRECISION,
    "tradeId" TEXT,
    "notes" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BreachRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyAnchor" (
    "id" TEXT NOT NULL,
    "phaseAccountId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "anchorEquity" DOUBLE PRECISION NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyAnchor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyNote" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "note" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "accountId" TEXT,
    "emotion" "JournalEmotion",

    CONSTRAINT "DailyNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DashboardTemplate" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "layout" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DashboardTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminWidgetSetting" (
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

-- CreateTable
CREATE TABLE "AdminDashboardPreset" (
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

-- CreateTable
CREATE TABLE "AdminFeatureFlag" (
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

-- CreateTable
CREATE TABLE "AdminSharingPolicy" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL DEFAULT 'default',
    "publicSharingEnabled" BOOLEAN NOT NULL DEFAULT true,
    "defaultExpirationDays" INTEGER,
    "requireExpiration" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminSharingPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiveAccountTransaction" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LiveAccountTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MasterAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "propFirmName" TEXT NOT NULL,
    "accountSize" DOUBLE PRECISION NOT NULL,
    "evaluationType" TEXT NOT NULL,
    "currentPhase" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "MasterAccountStatus" NOT NULL DEFAULT 'active',
    "isArchived" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "MasterAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payout" (
    "id" TEXT NOT NULL,
    "masterAccountId" TEXT NOT NULL,
    "phaseAccountId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "PayoutStatus" NOT NULL DEFAULT 'pending',
    "requestDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedDate" TIMESTAMP(3),
    "paidDate" TIMESTAMP(3),
    "rejectedDate" TIMESTAMP(3),
    "notes" TEXT,
    "rejectionReason" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhaseAccount" (
    "id" TEXT NOT NULL,
    "masterAccountId" TEXT NOT NULL,
    "phaseNumber" INTEGER NOT NULL,
    "phaseId" TEXT,
    "accountSize" DOUBLE PRECISION,
    "status" "PhaseAccountStatus" NOT NULL DEFAULT 'active',
    "profitTargetPercent" DOUBLE PRECISION NOT NULL,
    "dailyDrawdownPercent" DOUBLE PRECISION NOT NULL,
    "maxDrawdownPercent" DOUBLE PRECISION NOT NULL,
    "maxDrawdownType" "DrawdownType" NOT NULL DEFAULT 'static',
    "minTradingDays" INTEGER NOT NULL DEFAULT 0,
    "timeLimitDays" INTEGER,
    "consistencyRulePercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "profitSplitPercent" DOUBLE PRECISION,
    "payoutCycleDays" INTEGER,
    "minProfitForPayout" DOUBLE PRECISION,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PhaseAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trade" (
    "id" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "entryId" TEXT,
    "closeId" TEXT,
    "tradeIdentityKey" TEXT,
    "instrument" TEXT NOT NULL,
    "entryPrice" TEXT NOT NULL,
    "closePrice" TEXT NOT NULL,
    "entryDate" TEXT NOT NULL,
    "closeDate" TEXT NOT NULL,
    "entryPriceValue" DOUBLE PRECISION,
    "closePriceValue" DOUBLE PRECISION,
    "pnl" DOUBLE PRECISION NOT NULL,
    "timeInPosition" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "userId" TEXT NOT NULL,
    "side" TEXT,
    "commission" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "comment" TEXT,
    "groupId" TEXT,
    "cardPreviewImage" TEXT,
    "cardPreviewTransform" JSONB,
    "imageOne" TEXT,
    "imageTwo" TEXT,
    "imageThree" TEXT,
    "imageFour" TEXT,
    "imageFive" TEXT,
    "imageSix" TEXT,
    "accountId" TEXT,
    "phaseAccountId" TEXT,
    "symbol" TEXT,
    "entryTime" TIMESTAMP(3),
    "exitTime" TIMESTAMP(3),
    "closeReason" TEXT,
    "stopLoss" TEXT,
    "stopLossValue" DOUBLE PRECISION,
    "takeProfit" TEXT,
    "takeProfitValue" DOUBLE PRECISION,
    "tags" TEXT[],
    "marketBias" "MarketBias",
    "modelId" TEXT,
    "selectedRules" JSONB,
    "outcome" "TradeOutcome",
    "ruleBroken" BOOLEAN DEFAULT false,
    "newsDay" BOOLEAN DEFAULT false,
    "selectedNews" TEXT,
    "newsTraded" BOOLEAN DEFAULT false,
    "biasTimeframe" TEXT,
    "narrativeTimeframe" TEXT,
    "entryTimeframe" TEXT,
    "structureTimeframe" TEXT,
    "orderType" TEXT,
    "chartLinks" TEXT,
    "chartLinksList" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "plannedEntry" TEXT,
    "plannedStopLoss" TEXT,
    "plannedTakeProfit" TEXT,
    "plannedSize" DOUBLE PRECISION,
    "planNotes" TEXT,
    "mae" DOUBLE PRECISION,
    "mfe" DOUBLE PRECISION,
    "setup" TEXT,

    CONSTRAINT "Trade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TradeExecution" (
    "id" TEXT NOT NULL,
    "tradeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" "TradeExecutionKind" NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "price" DOUBLE PRECISION,
    "executedAt" TIMESTAMP(3),
    "pnl" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "commission" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "brokerExecutionId" TEXT,
    "legacySourceTradeId" TEXT,
    "closeReason" TEXT,
    "rawSymbol" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TradeExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TradeTag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#3b82f6',
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TradeTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TradingModel" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rules" JSONB NOT NULL DEFAULT '[]',
    "setups" JSONB NOT NULL DEFAULT '[]',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TradingModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "auth_user_id" TEXT NOT NULL,
    "isFirstConnection" BOOLEAN NOT NULL DEFAULT true,
    "firstName" TEXT,
    "lastName" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'user',
    "onboarding_status" JSONB,
    "etpToken" TEXT,
    "thorToken" TEXT,
    "fcmToken" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JournalTemplate" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JournalTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSettings" (
    "userId" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'America/New_York',
    "theme" TEXT NOT NULL DEFAULT 'system',
    "accountFilterSettings" TEXT,
    "aiSettings" JSONB,
    "backtestInputMode" TEXT NOT NULL DEFAULT 'manual',
    "breakEvenThreshold" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "pnlDisplayMode" TEXT NOT NULL DEFAULT 'net',
    "accentPack" TEXT NOT NULL DEFAULT 'classic',
    "widgetStyle" TEXT NOT NULL DEFAULT 'default',
    "chartStyle" TEXT NOT NULL DEFAULT 'smooth',
    "autoAdjustAccountDate" BOOLEAN NOT NULL DEFAULT false,
    "webhookToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "ImportJob" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "ImportJobStatus" NOT NULL DEFAULT 'queued',
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

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "actionRequired" BOOLEAN NOT NULL DEFAULT false,
    "invalidationKey" TEXT,
    "priority" "NotificationPriority" NOT NULL DEFAULT 'MEDIUM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyReview" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "calendarImage" TEXT,
    "expectation" "WeeklyExpectation",
    "actualOutcome" "WeeklyExpectation",
    "isCorrect" BOOLEAN,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeeklyReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT,
    "email" TEXT,
    "category" "FeedbackCategory" NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "attachments" JSONB,
    "status" "FeedbackStatus" NOT NULL DEFAULT 'OPEN',
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "country" TEXT,
    "city" TEXT,
    "region" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedbackReply" (
    "id" TEXT NOT NULL,
    "feedbackId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeedbackReply_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DonationAddress" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DonationAddress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteUiSettings" (
    "id" TEXT NOT NULL,
    "showDonateButton" BOOLEAN NOT NULL DEFAULT true,
    "showFeedbackButton" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteUiSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ErrorLog" (
    "id" TEXT NOT NULL,
    "source" "ErrorSource" NOT NULL,
    "level" "ErrorLevel" NOT NULL DEFAULT 'ERROR',
    "message" TEXT NOT NULL,
    "stack" TEXT,
    "url" TEXT,
    "userId" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ErrorLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserGeoLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "country" TEXT,
    "countryCode" TEXT,
    "city" TEXT,
    "region" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserGeoLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyAIReview" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weekStart" DATE NOT NULL,
    "weekEnd" DATE NOT NULL,
    "summary" TEXT NOT NULL,
    "highlights" JSONB NOT NULL DEFAULT '[]',
    "lowlights" JSONB NOT NULL DEFAULT '[]',
    "stats" JSONB NOT NULL DEFAULT '{}',
    "grade" TEXT NOT NULL DEFAULT '',
    "focusNextWeek" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WeeklyAIReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserGoal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "metric" TEXT NOT NULL,
    "targetValue" DOUBLE PRECISION NOT NULL,
    "currentValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "period" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SharedReport" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Trading Report',
    "dateFrom" TEXT,
    "dateTo" TEXT,
    "accountId" TEXT,
    "snapshot" JSONB NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SharedReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
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

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentRecord" (
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

    CONSTRAINT "PaymentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromoCode" (
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

-- CreateTable
CREATE TABLE "PromoRedemption" (
    "id" TEXT NOT NULL,
    "promoCodeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "redeemedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PromoRedemption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FreeAccessInvite" (
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

-- CreateTable
CREATE TABLE "AIChat" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'New Conversation',
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "accounts" TEXT[],
    "dateRange" TEXT NOT NULL,
    "customFrom" TIMESTAMP(3),
    "customTo" TIMESTAMP(3),
    "dataSources" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIChat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIChatMessage" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AISavedInsight" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'insight',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AISavedInsight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminAISetting" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "demoModeEnabled" BOOLEAN NOT NULL DEFAULT true,
    "freePlanAccess" BOOLEAN NOT NULL DEFAULT false,
    "paidPlanAccess" BOOLEAN NOT NULL DEFAULT true,
    "adminAccess" BOOLEAN NOT NULL DEFAULT true,
    "maxContextSize" INTEGER NOT NULL DEFAULT 32768,
    "maxMessagesPerDay" INTEGER NOT NULL DEFAULT 50,
    "maxTokensPerResponse" INTEGER NOT NULL DEFAULT 2048,
    "conversationRetentionDays" INTEGER NOT NULL DEFAULT 30,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminAISetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIChatUsageLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "chatId" TEXT,
    "promptTokens" INTEGER NOT NULL DEFAULT 0,
    "completionTokens" INTEGER NOT NULL DEFAULT 0,
    "totalTokens" INTEGER NOT NULL DEFAULT 0,
    "estimatedCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "responseTimeMs" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIChatUsageLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Synchronization" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "lastSyncedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "dailySyncTime" TIMESTAMP(3),
    "includedFeeTypes" JSONB,

    CONSTRAINT "Synchronization_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_number_userId_key" ON "Account"("number", "userId");

-- CreateIndex
CREATE INDEX "BacktestTrade_userId_model_idx" ON "BacktestTrade"("userId", "model");

-- CreateIndex
CREATE UNIQUE INDEX "BacktestTrade_userId_pair_dateExecuted_entryPrice_direction_key" ON "BacktestTrade"("userId", "pair", "dateExecuted", "entryPrice", "direction");

-- CreateIndex
CREATE INDEX "BreachRecord_phaseAccountId_idx" ON "BreachRecord"("phaseAccountId");

-- CreateIndex
CREATE INDEX "DailyAnchor_date_idx" ON "DailyAnchor"("date");

-- CreateIndex
CREATE UNIQUE INDEX "DailyAnchor_phaseAccountId_date_key" ON "DailyAnchor"("phaseAccountId", "date");

-- CreateIndex
CREATE INDEX "DailyNote_accountId_idx" ON "DailyNote"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "DailyNote_userId_accountId_date_key" ON "DailyNote"("userId", "accountId", "date");

-- CreateIndex
CREATE INDEX "DashboardTemplate_userId_idx" ON "DashboardTemplate"("userId");

-- CreateIndex
CREATE INDEX "DashboardTemplate_userId_isActive_idx" ON "DashboardTemplate"("userId", "isActive");

-- CreateIndex
CREATE INDEX "DashboardTemplate_userId_isDefault_idx" ON "DashboardTemplate"("userId", "isDefault");

-- CreateIndex
CREATE UNIQUE INDEX "DashboardTemplate_userId_name_key" ON "DashboardTemplate"("userId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "AdminWidgetSetting_widgetType_key" ON "AdminWidgetSetting"("widgetType");

-- CreateIndex
CREATE INDEX "AdminWidgetSetting_visible_idx" ON "AdminWidgetSetting"("visible");

-- CreateIndex
CREATE INDEX "AdminWidgetSetting_recommended_idx" ON "AdminWidgetSetting"("recommended");

-- CreateIndex
CREATE INDEX "AdminWidgetSetting_deprecated_idx" ON "AdminWidgetSetting"("deprecated");

-- CreateIndex
CREATE UNIQUE INDEX "AdminDashboardPreset_name_key" ON "AdminDashboardPreset"("name");

-- CreateIndex
CREATE INDEX "AdminDashboardPreset_segment_idx" ON "AdminDashboardPreset"("segment");

-- CreateIndex
CREATE INDEX "AdminDashboardPreset_active_idx" ON "AdminDashboardPreset"("active");

-- CreateIndex
CREATE INDEX "AdminDashboardPreset_recommended_idx" ON "AdminDashboardPreset"("recommended");

-- CreateIndex
CREATE UNIQUE INDEX "AdminFeatureFlag_key_key" ON "AdminFeatureFlag"("key");

-- CreateIndex
CREATE INDEX "AdminFeatureFlag_enabled_idx" ON "AdminFeatureFlag"("enabled");

-- CreateIndex
CREATE INDEX "AdminFeatureFlag_internalOnly_idx" ON "AdminFeatureFlag"("internalOnly");

-- CreateIndex
CREATE UNIQUE INDEX "AdminSharingPolicy_key_key" ON "AdminSharingPolicy"("key");

-- CreateIndex
CREATE INDEX "LiveAccountTransaction_accountId_idx" ON "LiveAccountTransaction"("accountId");

-- CreateIndex
CREATE INDEX "LiveAccountTransaction_accountId_createdAt_idx" ON "LiveAccountTransaction"("accountId", "createdAt");

-- CreateIndex
CREATE INDEX "LiveAccountTransaction_userId_idx" ON "LiveAccountTransaction"("userId");

-- CreateIndex
CREATE INDEX "MasterAccount_userId_status_idx" ON "MasterAccount"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "MasterAccount_userId_accountName_key" ON "MasterAccount"("userId", "accountName");

-- CreateIndex
CREATE INDEX "Payout_masterAccountId_idx" ON "Payout"("masterAccountId");

-- CreateIndex
CREATE INDEX "Payout_phaseAccountId_idx" ON "Payout"("phaseAccountId");

-- CreateIndex
CREATE INDEX "PhaseAccount_masterAccountId_idx" ON "PhaseAccount"("masterAccountId");

-- CreateIndex
CREATE INDEX "PhaseAccount_masterAccountId_phaseNumber_idx" ON "PhaseAccount"("masterAccountId", "phaseNumber");

-- CreateIndex
CREATE INDEX "PhaseAccount_masterAccountId_status_idx" ON "PhaseAccount"("masterAccountId", "status");

-- CreateIndex
CREATE INDEX "PhaseAccount_phaseId_idx" ON "PhaseAccount"("phaseId");

-- CreateIndex
CREATE INDEX "PhaseAccount_status_idx" ON "PhaseAccount"("status");

-- CreateIndex
CREATE UNIQUE INDEX "PhaseAccount_masterAccountId_phaseNumber_key" ON "PhaseAccount"("masterAccountId", "phaseNumber");

-- CreateIndex
CREATE INDEX "Trade_accountId_exitTime_idx" ON "Trade"("accountId", "exitTime");

-- CreateIndex
CREATE INDEX "Trade_accountId_phaseAccountId_idx" ON "Trade"("accountId", "phaseAccountId");

-- CreateIndex
CREATE INDEX "Trade_accountNumber_idx" ON "Trade"("accountNumber");

-- CreateIndex
CREATE INDEX "Trade_entryId_idx" ON "Trade"("entryId");

-- CreateIndex
CREATE INDEX "Trade_exitTime_idx" ON "Trade"("exitTime");

-- CreateIndex
CREATE INDEX "Trade_groupId_idx" ON "Trade"("groupId");

-- CreateIndex
CREATE INDEX "Trade_modelId_idx" ON "Trade"("modelId");

-- CreateIndex
CREATE INDEX "Trade_phaseAccountId_exitTime_idx" ON "Trade"("phaseAccountId", "exitTime");

-- CreateIndex
CREATE INDEX "Trade_symbol_idx" ON "Trade"("symbol");

-- CreateIndex
CREATE INDEX "Trade_tradeIdentityKey_idx" ON "Trade"("tradeIdentityKey");

-- CreateIndex
CREATE INDEX "Trade_userId_accountNumber_id_idx" ON "Trade"("userId", "accountNumber", "id");

-- CreateIndex
CREATE INDEX "Trade_userId_entryDate_idx" ON "Trade"("userId", "entryDate" DESC);

-- CreateIndex
CREATE INDEX "Trade_userId_accountId_entryDate_idx" ON "Trade"("userId", "accountId", "entryDate" DESC);

-- CreateIndex
CREATE INDEX "Trade_userId_phaseAccountId_entryDate_idx" ON "Trade"("userId", "phaseAccountId", "entryDate" DESC);

-- CreateIndex
CREATE INDEX "Trade_userId_entryId_idx" ON "Trade"("userId", "entryId");

-- CreateIndex
CREATE INDEX "Trade_userId_modelId_entryDate_idx" ON "Trade"("userId", "modelId", "entryDate" DESC);

-- CreateIndex
CREATE INDEX "Trade_userId_ruleBroken_entryDate_idx" ON "Trade"("userId", "ruleBroken", "entryDate" DESC);

-- CreateIndex
CREATE INDEX "Trade_userId_outcome_entryDate_idx" ON "Trade"("userId", "outcome", "entryDate" DESC);

-- CreateIndex
CREATE INDEX "Trade_userId_instrument_idx" ON "Trade"("userId", "instrument");

-- CreateIndex
CREATE INDEX "Trade_userId_accountNumber_entryDate_idx" ON "Trade"("userId", "accountNumber", "entryDate");

-- CreateIndex
CREATE INDEX "Trade_userId_pnl_idx" ON "Trade"("userId", "pnl");

-- CreateIndex
CREATE UNIQUE INDEX "Trade_userId_tradeIdentityKey_key" ON "Trade"("userId", "tradeIdentityKey");

-- CreateIndex
CREATE INDEX "TradeExecution_tradeId_kind_idx" ON "TradeExecution"("tradeId", "kind");

-- CreateIndex
CREATE INDEX "TradeExecution_tradeId_executedAt_idx" ON "TradeExecution"("tradeId", "executedAt");

-- CreateIndex
CREATE INDEX "TradeExecution_userId_brokerExecutionId_idx" ON "TradeExecution"("userId", "brokerExecutionId");

-- CreateIndex
CREATE UNIQUE INDEX "TradeExecution_tradeId_kind_legacySourceTradeId_key" ON "TradeExecution"("tradeId", "kind", "legacySourceTradeId");

-- CreateIndex
CREATE INDEX "TradeTag_userId_idx" ON "TradeTag"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TradeTag_name_userId_key" ON "TradeTag"("name", "userId");

-- CreateIndex
CREATE INDEX "TradingModel_userId_idx" ON "TradingModel"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TradingModel_userId_name_key" ON "TradingModel"("userId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_auth_user_id_key" ON "User"("auth_user_id");

-- CreateIndex
CREATE INDEX "User_auth_user_id_idx" ON "User"("auth_user_id");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "JournalTemplate_userId_createdAt_idx" ON "JournalTemplate"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "JournalTemplate_userId_name_key" ON "JournalTemplate"("userId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "UserSettings_webhookToken_key" ON "UserSettings"("webhookToken");

-- CreateIndex
CREATE INDEX "ImportJob_userId_createdAt_idx" ON "ImportJob"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ImportJob_userId_status_idx" ON "ImportJob"("userId", "status");

-- CreateIndex
CREATE INDEX "ActivityLog_userId_createdAt_idx" ON "ActivityLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ActivityLog_action_idx" ON "ActivityLog"("action");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "Notification_userId_actionRequired_idx" ON "Notification"("userId", "actionRequired");

-- CreateIndex
CREATE INDEX "Notification_userId_invalidationKey_idx" ON "Notification"("userId", "invalidationKey");

-- CreateIndex
CREATE INDEX "WeeklyReview_userId_idx" ON "WeeklyReview"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyReview_userId_startDate_key" ON "WeeklyReview"("userId", "startDate");

-- CreateIndex
CREATE INDEX "Feedback_userId_idx" ON "Feedback"("userId");

-- CreateIndex
CREATE INDEX "Feedback_status_idx" ON "Feedback"("status");

-- CreateIndex
CREATE INDEX "Feedback_category_idx" ON "Feedback"("category");

-- CreateIndex
CREATE INDEX "Feedback_createdAt_idx" ON "Feedback"("createdAt");

-- CreateIndex
CREATE INDEX "FeedbackReply_feedbackId_idx" ON "FeedbackReply"("feedbackId");

-- CreateIndex
CREATE INDEX "DonationAddress_isActive_idx" ON "DonationAddress"("isActive");

-- CreateIndex
CREATE INDEX "ErrorLog_source_idx" ON "ErrorLog"("source");

-- CreateIndex
CREATE INDEX "ErrorLog_level_idx" ON "ErrorLog"("level");

-- CreateIndex
CREATE INDEX "ErrorLog_createdAt_idx" ON "ErrorLog"("createdAt");

-- CreateIndex
CREATE INDEX "ErrorLog_userId_idx" ON "ErrorLog"("userId");

-- CreateIndex
CREATE INDEX "UserGeoLog_userId_idx" ON "UserGeoLog"("userId");

-- CreateIndex
CREATE INDEX "UserGeoLog_countryCode_idx" ON "UserGeoLog"("countryCode");

-- CreateIndex
CREATE INDEX "UserGeoLog_createdAt_idx" ON "UserGeoLog"("createdAt");

-- CreateIndex
CREATE INDEX "WeeklyAIReview_userId_createdAt_idx" ON "WeeklyAIReview"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyAIReview_userId_weekStart_key" ON "WeeklyAIReview"("userId", "weekStart");

-- CreateIndex
CREATE INDEX "UserGoal_userId_idx" ON "UserGoal"("userId");

-- CreateIndex
CREATE INDEX "UserGoal_userId_isCompleted_idx" ON "UserGoal"("userId", "isCompleted");

-- CreateIndex
CREATE UNIQUE INDEX "SharedReport_slug_key" ON "SharedReport"("slug");

-- CreateIndex
CREATE INDEX "SharedReport_userId_idx" ON "SharedReport"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_userId_key" ON "Subscription"("userId");

-- CreateIndex
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");

-- CreateIndex
CREATE INDEX "Subscription_nextPaymentDue_idx" ON "Subscription"("nextPaymentDue");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentRecord_providerPaymentId_key" ON "PaymentRecord"("providerPaymentId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentRecord_providerInvoiceId_key" ON "PaymentRecord"("providerInvoiceId");

-- CreateIndex
CREATE INDEX "PaymentRecord_userId_idx" ON "PaymentRecord"("userId");

-- CreateIndex
CREATE INDEX "PaymentRecord_subscriptionId_idx" ON "PaymentRecord"("subscriptionId");

-- CreateIndex
CREATE INDEX "PaymentRecord_dueDate_idx" ON "PaymentRecord"("dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "PromoCode_code_key" ON "PromoCode"("code");

-- CreateIndex
CREATE INDEX "PromoCode_code_idx" ON "PromoCode"("code");

-- CreateIndex
CREATE INDEX "PromoCode_isActive_idx" ON "PromoCode"("isActive");

-- CreateIndex
CREATE INDEX "PromoRedemption_userId_idx" ON "PromoRedemption"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PromoRedemption_promoCodeId_userId_key" ON "PromoRedemption"("promoCodeId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "FreeAccessInvite_email_key" ON "FreeAccessInvite"("email");

-- CreateIndex
CREATE INDEX "FreeAccessInvite_email_idx" ON "FreeAccessInvite"("email");

-- CreateIndex
CREATE INDEX "FreeAccessInvite_isActive_idx" ON "FreeAccessInvite"("isActive");

-- CreateIndex
CREATE INDEX "AIChat_userId_isPinned_isArchived_isDeleted_idx" ON "AIChat"("userId", "isPinned", "isArchived", "isDeleted");

-- CreateIndex
CREATE INDEX "AIChatMessage_chatId_createdAt_idx" ON "AIChatMessage"("chatId", "createdAt");

-- CreateIndex
CREATE INDEX "AISavedInsight_userId_createdAt_idx" ON "AISavedInsight"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AIChatUsageLog_userId_createdAt_idx" ON "AIChatUsageLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AIChatUsageLog_createdAt_idx" ON "AIChatUsageLog"("createdAt");

-- CreateIndex
CREATE INDEX "Synchronization_userId_idx" ON "Synchronization"("userId");

-- CreateIndex
CREATE INDEX "Synchronization_service_idx" ON "Synchronization"("service");

-- CreateIndex
CREATE UNIQUE INDEX "Synchronization_userId_service_accountId_key" ON "Synchronization"("userId", "service", "accountId");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BacktestTrade" ADD CONSTRAINT "BacktestTrade_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BreachRecord" ADD CONSTRAINT "BreachRecord_phaseAccountId_fkey" FOREIGN KEY ("phaseAccountId") REFERENCES "PhaseAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyAnchor" ADD CONSTRAINT "DailyAnchor_phaseAccountId_fkey" FOREIGN KEY ("phaseAccountId") REFERENCES "PhaseAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyNote" ADD CONSTRAINT "DailyNote_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyNote" ADD CONSTRAINT "DailyNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DashboardTemplate" ADD CONSTRAINT "DashboardTemplate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiveAccountTransaction" ADD CONSTRAINT "LiveAccountTransaction_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiveAccountTransaction" ADD CONSTRAINT "LiveAccountTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MasterAccount" ADD CONSTRAINT "MasterAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_masterAccountId_fkey" FOREIGN KEY ("masterAccountId") REFERENCES "MasterAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_phaseAccountId_fkey" FOREIGN KEY ("phaseAccountId") REFERENCES "PhaseAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhaseAccount" ADD CONSTRAINT "PhaseAccount_masterAccountId_fkey" FOREIGN KEY ("masterAccountId") REFERENCES "MasterAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "TradingModel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_phaseAccountId_fkey" FOREIGN KEY ("phaseAccountId") REFERENCES "PhaseAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeExecution" ADD CONSTRAINT "TradeExecution_tradeId_fkey" FOREIGN KEY ("tradeId") REFERENCES "Trade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeTag" ADD CONSTRAINT "TradeTag_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradingModel" ADD CONSTRAINT "TradingModel_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalTemplate" ADD CONSTRAINT "JournalTemplate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSettings" ADD CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportJob" ADD CONSTRAINT "ImportJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyReview" ADD CONSTRAINT "WeeklyReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedbackReply" ADD CONSTRAINT "FeedbackReply_feedbackId_fkey" FOREIGN KEY ("feedbackId") REFERENCES "Feedback"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserGeoLog" ADD CONSTRAINT "UserGeoLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyAIReview" ADD CONSTRAINT "WeeklyAIReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserGoal" ADD CONSTRAINT "UserGoal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedReport" ADD CONSTRAINT "SharedReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_promoCodeId_fkey" FOREIGN KEY ("promoCodeId") REFERENCES "PromoCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_freeAccessId_fkey" FOREIGN KEY ("freeAccessId") REFERENCES "FreeAccessInvite"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentRecord" ADD CONSTRAINT "PaymentRecord_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentRecord" ADD CONSTRAINT "PaymentRecord_promoCodeId_fkey" FOREIGN KEY ("promoCodeId") REFERENCES "PromoCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromoRedemption" ADD CONSTRAINT "PromoRedemption_promoCodeId_fkey" FOREIGN KEY ("promoCodeId") REFERENCES "PromoCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIChat" ADD CONSTRAINT "AIChat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIChatMessage" ADD CONSTRAINT "AIChatMessage_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "AIChat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AISavedInsight" ADD CONSTRAINT "AISavedInsight_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Synchronization" ADD CONSTRAINT "Synchronization_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

