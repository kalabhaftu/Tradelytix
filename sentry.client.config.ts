import * as Sentry from '@sentry/nextjs'

// This file is deprecated — all client Sentry config is now in instrumentation-client.ts
// Keeping this file to avoid Turbopack warnings during migration.
// It intentionally does nothing to avoid double-initializing Sentry.
