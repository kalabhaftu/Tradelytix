import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const publicRoutes = ["/", "/not-found", "/api/auth", "/docs", "/privacy", "/feedback", "/donate", "/changelog", "/about", "/contact"]
const protectedRoutes = ["/dashboard", "/admin"]

export default async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname

  if (
    pathname.startsWith("/_next/") ||
    pathname.includes(".") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname.includes("/opengraph-image") ||
    pathname.includes("/twitter-image") ||
    pathname.includes("/icon")
  ) {
    return NextResponse.next()
  }

  const isProtectedRoute = protectedRoutes.some(route =>
    pathname === route || pathname.startsWith(route + "/")
  )

  const isPublicRoute = publicRoutes.some(route =>
    pathname === route || pathname.startsWith(route + "/")
  )

  try {
    const cookieStore = await cookies()
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      if (isProtectedRoute) {
        const authUrl = new URL('/', req.url)
        authUrl.searchParams.set('error', 'config')
        return NextResponse.redirect(authUrl)
      }
      return addSecurityHeaders(NextResponse.next())
    }

    const supabase = createServerClient(
      supabaseUrl,
      supabaseKey,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // Ignore cookie setting errors in middleware context
            }
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    const isAuthenticated = !!user && !authError

    // Redirect authenticated users away from landing to dashboard
    if (isAuthenticated && !isProtectedRoute && !isPublicRoute && !pathname.startsWith('/api/auth') && pathname !== '/not-found') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    if (isAuthenticated && pathname === "/") {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    // Redirect unauthenticated users away from protected routes
    if (!isAuthenticated && isProtectedRoute) {
      const referrer = req.headers.get('referer')
      const url = req.nextUrl
      const isPostAuthRequest = referrer && (
        referrer.includes('/api/auth/callback') ||
        referrer.includes('/auth/callback') ||
        url.searchParams.has('code') ||
        url.searchParams.has('error')
      )

      if (!isPostAuthRequest) {
        const authUrl = new URL('/', req.url)
        authUrl.searchParams.set('next', pathname)
        return NextResponse.redirect(authUrl)
      }
    }

    const response = NextResponse.next()

    // Set internal headers for API route consumption only (not exposed to client)
    if (isAuthenticated) {
      response.headers.set('x-user-id', user.id)
      if (user.email) {
        response.headers.set('x-user-email', user.email)
      }
    }

    return addSecurityHeaders(response)

  } catch (err) {
    console.error('Middleware error:', err)
    if (isProtectedRoute) {
      const authUrl = new URL('/', req.url)
      authUrl.searchParams.set('error', 'exception')
      return NextResponse.redirect(authUrl)
    }
    return addSecurityHeaders(NextResponse.next())
  }
}

function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api|opengraph-image|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
