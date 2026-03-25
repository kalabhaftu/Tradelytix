/**
 * GET /api/paths - API route index
 * Returns a list of all API paths for documentation and health checks.
 * Used by scripts/test-api-routes.js and to prevent 404s from tooling (e.g. Chrome DevTools).
 */

import { NextResponse } from 'next/server'

const PATHS = [
  '/api',
  '/api/auth/check',
  '/api/auth/callback',
  '/api/auth/profile',
  '/api/auth/delete-account',
  '/api/settings/account-filters',
  '/api/settings/backtest-mode',
  '/api/tags',
  '/api/tags/[id]',
  '/api/user/trading-models',
  '/api/user/trading-models/[id]',
  '/api/user/data',
  '/api/user/data/backup',
  '/api/user/goals',
  '/api/v1/init',
  '/api/v1/accounts',
  '/api/v1/accounts/[id]',
  '/api/v1/accounts/[id]/trades',
  '/api/v1/accounts/[id]/adjust-date',
  '/api/v1/trades',
  '/api/v1/trades/quick-add',
  '/api/v1/trades/import/jobs',
  '/api/v1/trades/import/jobs/[id]',
  '/api/v1/trades/import/jobs/[id]/process',
  '/api/v1/trades/import/jobs/[id]/cancel',
  '/api/v1/reports/stats',
  '/api/v1/reports/propfirm',
  '/api/v1/data/export',
  '/api/news-events',
  '/api/notifications',
  '/api/notifications/[id]',
  '/api/prop-firm-templates',
  '/api/prop-firm/accounts',
  '/api/prop-firm/accounts/[id]',
  '/api/prop-firm/accounts/[id]/trades',
  '/api/prop-firm/accounts/[id]/payouts',
  '/api/prop-firm/accounts/[id]/transition',
  '/api/prop-firm/accounts/validate-trade',
  '/api/prop-firm/payouts',
  '/api/prop-firm/payouts/[id]',
  '/api/live-accounts/[id]/transactions',
  '/api/journal/list',
  '/api/journal/daily',
  '/api/journal/daily/[id]',
  '/api/journal/ai-analysis',
  '/api/calendar/notes',
  '/api/v1/data/import/jobs',
  '/api/v1/data/import/jobs/[id]',
  '/api/v1/data/import/jobs/[id]/process',
  '/api/v1/data/import/jobs/[id]/cancel',
  '/api/ai/format-trades',
  '/api/ai/mappings',
  '/api/backtesting',
  '/api/health/edge',
  '/api/build-id',
  '/api/cron/daily-anchors',
  '/api/cron/evaluate-phases',
]

export async function GET() {
  return NextResponse.json({
    paths: PATHS,
    count: PATHS.length,
    note: 'Use scripts/test-api-routes.js to test all routes.',
  })
}
