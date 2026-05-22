export async function register() {
  if (process.env.NODE_ENV !== 'production') {
    return
  }

  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./lib/env')
    const { initSentryServer } = await import('./sentry.server.config')
    await initSentryServer()
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }
}
