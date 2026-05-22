import { getSafeRedirectPath } from '@/lib/security/redirects'
import { getCorsHeaders } from '@/lib/security/origins'
import { type NextRequest, NextResponse } from "next/server"
import { createServerClient, type CookieOptions } from "@supabase/ssr"

const publicRoutes = ["/", "/subscribe", "/app-launch", "/not-found", "/api/auth", "/docs", "/privacy", "/feedback", "/donate", "/changelog", "/about", "/contact", "/reports/shared"]
const protectedRoutes = ["/dashboard", "/admin"]

function isProtectedPath(pathname: string) {
  return protectedRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`))
}

function isPublicPath(pathname: string) {
  return publicRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`))
}

function copyAuthCookies(source: NextResponse, target: NextResponse) {
  source.cookies.getAll().forEach((cookie) => {
    target.cookies.set(cookie)
  })
}

function addCorsHeaders(request: NextRequest, response: NextResponse): NextResponse {
  if (!request.nextUrl.pathname.startsWith('/api/')) {
    return response
  }

  const headers = getCorsHeaders(request.headers.get('origin'))
  if (!headers) {
    return response
  }

  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value)
  }

  return response
}

function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  response.headers.set("X-XSS-Protection", "1; mode=block")
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")

  if (process.env.NODE_ENV === "production") {
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload")
  }

  const csp = [
    "default-src 'self'",
    process.env.NODE_ENV === "production"
      ? "script-src 'self' 'unsafe-inline' https://vercel.live"
      : "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live",
    "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
    "font-src 'self' fonts.gstatic.com",
    "img-src 'self' data: blob: https://*.supabase.co https://lh3.googleusercontent.com",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co api.x.ai ip-api.com",
    "frame-src 'self' https://vercel.live",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    process.env.NODE_ENV === "production" ? "upgrade-insecure-requests" : "",
  ]
    .filter(Boolean)
    .join("; ")

  response.headers.set("Content-Security-Policy", csp)
  return response
}

function secureRedirect(request: NextRequest, url: URL, authResponse: NextResponse) {
  const response = NextResponse.redirect(url)
  copyAuthCookies(authResponse, response)
  return addCorsHeaders(request, addSecurityHeaders(response))
}

type SupabaseCookie = {
  name: string
  value: string
  options?: CookieOptions
}

export default async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname

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

  const isProtectedRoute = isProtectedPath(pathname)
  const isPublicRoute = isPublicPath(pathname)

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    if (isProtectedRoute) {
      const authUrl = new URL("/", request.url)
      authUrl.searchParams.set("error", "config")
      return addCorsHeaders(request, addSecurityHeaders(NextResponse.redirect(authUrl)))
    }
    return addCorsHeaders(request, addSecurityHeaders(NextResponse.next()))
  }

  let authResponse = NextResponse.next({
    request,
  })

  try {
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: SupabaseCookie[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))

          authResponse = NextResponse.next({
            request,
          })

          cookiesToSet.forEach(({ name, value, options }) => {
            authResponse.cookies.set(name, value, options)
          })
        },
      },
    })

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    const isAuthenticated = !!user && !authError

    if (isAuthenticated && pathname === "/") {
      return secureRedirect(request, new URL("/dashboard", request.url), authResponse)
    }

    if (isAuthenticated && pathname === "/app-launch") {
      const redirectPath = getSafeRedirectPath(request.nextUrl.searchParams.get("next"), "/dashboard")
      return secureRedirect(request, new URL(redirectPath, request.url), authResponse)
    }

    if (
      isAuthenticated &&
      !isProtectedRoute &&
      !isPublicRoute &&
      !pathname.startsWith("/api/auth") &&
      pathname !== "/not-found"
    ) {
      return secureRedirect(request, new URL("/dashboard", request.url), authResponse)
    }

    if (!isAuthenticated && isProtectedRoute) {
      const referrer = request.headers.get("referer")
      const url = request.nextUrl
      const isPostAuthRequest =
        !!referrer &&
        (referrer.includes("/api/auth/callback") ||
          referrer.includes("/auth/callback") ||
          url.searchParams.has("code") ||
          url.searchParams.has("error"))

      if (!isPostAuthRequest) {
        const authUrl = new URL("/", request.url)
        authUrl.searchParams.set("next", pathname)
        return secureRedirect(request, authUrl, authResponse)
      }
    }

    if (isAuthenticated && user) {
      authResponse.headers.set("x-user-id", user.id)
      // NOTE: x-user-email intentionally omitted from response headers
      // to avoid leaking PII in browser DevTools Network tab.
      // Server-side auth reads email directly from Supabase session.
    }

    return addCorsHeaders(request, addSecurityHeaders(authResponse))
  } catch (error) {
    console.error("Proxy error:", error)
    if (isProtectedRoute) {
      const authUrl = new URL("/", request.url)
      authUrl.searchParams.set("error", "exception")
      return secureRedirect(request, authUrl, authResponse)
    }
    return addCorsHeaders(request, addSecurityHeaders(authResponse))
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api|opengraph-image|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
