import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/auth/server'
import logger from '@/lib/logger'
import * as Sentry from '@sentry/nextjs'

type Handler = (
  req: NextRequest,
  context: { user: { id: string; email: string } }
) => Promise<NextResponse>

export function withAuth(handler: Handler) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const user = await getServerUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
      return await handler(req, { user: { id: user.id, email: user.email! } })
    } catch (error) {
      Sentry.captureException(error)
      logger.error({
        event: 'api_route_error',
        userId: user.id,
        path: req.nextUrl.pathname,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}
