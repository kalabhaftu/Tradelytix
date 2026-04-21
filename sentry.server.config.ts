const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN

export async function initSentryServer() {
  if (process.env.NODE_ENV !== 'production' || !SENTRY_DSN) {
    return
  }

  const Sentry = await import('@sentry/nextjs')

  Sentry.init({
    dsn: SENTRY_DSN,

    // Performance monitoring
    tracesSampleRate: 0.1,

    // Environment
    environment: process.env.NODE_ENV || 'development',

    // Don't report outside production
    enabled: true,

    // Avoid Prisma/OpenTelemetry instrumentation unless we explicitly opt in later.
    skipOpenTelemetrySetup: true,
    integrations(defaultIntegrations) {
      return defaultIntegrations.filter((integration) => integration.name !== 'Prisma')
    },

    // Filter sensitive data
    beforeSend(event) {
      if (event.request?.headers) {
        delete event.request.headers['Authorization']
        delete event.request.headers['Cookie']
      }

      return event
    },
  })
}
