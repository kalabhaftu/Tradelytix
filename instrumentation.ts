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
    // Keep the server config behind a runtime-resolved import so local
    // development doesn't eagerly bundle Sentry's optional tracing tree.
    const loadServerConfig = new Function(
      'modulePath',
      'return import(modulePath)'
    ) as (modulePath: string) => Promise<unknown>

    await loadServerConfig('./sentry.server.config')
  }

  // Edge runtime
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }
}
