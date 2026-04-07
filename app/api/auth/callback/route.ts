'use server'
import { createClient, ensureUserInDatabase } from '@/server/auth'
import { NextResponse } from 'next/server'
import { logActivity } from '@/lib/activity-logger'
import { captureUserGeo, extractIP } from '@/server/geolocation'
import { resolveInternalUserId } from '@/server/user-identity'

// Helper function to determine if we're in local development
function isLocalDevelopment() {
  const isVercel = process.env.VERCEL === '1'
  return process.env.NODE_ENV === 'development' && !isVercel
}

// Race a promise against a timeout — rejects with a descriptive error
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    ),
  ])
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error_code = searchParams.get('error_code')
  const next = searchParams.get('next')
  const action = searchParams.get('action')
  const baseUrl = isLocalDevelopment() ? 'http://localhost:3000' : origin

  // Handle OAuth errors from the provider
  if (error_code) {
    if (error_code === 'bad_oauth_state') {
      return NextResponse.redirect(new URL('/', baseUrl))
    }
    return NextResponse.redirect(new URL('/dashboard', baseUrl))
  }

  const decodedNext = next ? decodeURIComponent(next) : null

  if (code) {
    try {
      const supabase = await createClient()

      // ── 1. Exchange code for session — 15 s hard cap ──
      const { data, error } = await withTimeout(
        supabase.auth.exchangeCodeForSession(code),
        15_000,
        'exchangeCodeForSession'
      )

      if (!error && data.user) {
        // ── 2. DB sync — 8 s cap, non-blocking on failure ──
        try {
          await withTimeout(
            ensureUserInDatabase(data.user, 'en'),
            8_000,
            'ensureUserInDatabase'
          )
        } catch {
          // Auth succeeded — DB sync can happen on the next page load
        }

        // Fire-and-forget (already non-blocking)
        logActivity({ userId: data.user.id, action: 'USER_LOGIN', entity: 'Auth' })

        // Geo capture — fire-and-forget, never blocks auth
        const clientIP = extractIP(request.headers)
        resolveInternalUserId(data.user.id).then(internalId => {
          if (internalId) captureUserGeo(internalId, clientIP)
        }).catch(() => {})


        // Handle identity linking redirect
        if (action === 'link') {
          const forwardedHost = request.headers.get('host')
          const linkBase = isLocalDevelopment()
            ? `${origin}/dashboard/settings`
            : `https://${forwardedHost || origin}/dashboard/settings`
          return NextResponse.redirect(new URL('/dashboard/settings?linked=true', linkBase))
        }

        const redirectPath = decodedNext || '/dashboard'
        return NextResponse.redirect(new URL(redirectPath, baseUrl))
      }

      // Auth error — redirect home
      return NextResponse.redirect(new URL('/', baseUrl))
    } catch {
      // Timeout or network failure — redirect home instead of 504
      return NextResponse.redirect(new URL('/', baseUrl))
    }
  }

  // No code param — send user to login
  return NextResponse.redirect(new URL('/', baseUrl))
}
