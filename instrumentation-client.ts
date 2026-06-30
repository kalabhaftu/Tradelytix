import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  enabled: process.env.NODE_ENV === 'production',
  tracesSampleRate: 0.2,
  enableLogs: true,
  replaysSessionSampleRate: 0.05,
  replaysOnErrorSampleRate: 1.0,
  sendDefaultPii: false,
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: false,
    }),
    Sentry.browserTracingIntegration(),
  ],
  beforeSend(event, hint) {
    const error = hint.originalException
    if (error instanceof Error && error.message?.includes('blocked by client')) return null
    return event
  },
})

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
