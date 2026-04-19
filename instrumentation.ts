/**
 * Instrumentation file for Next.js
 * Used to initialize monitoring tools like Sentry
 */

export async function register() {
  if (process.env.NODE_ENV !== 'production') {
    return
  }

  // Only run on server
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  }

  // Edge runtime
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }
}
