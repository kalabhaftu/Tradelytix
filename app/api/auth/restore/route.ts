import { type NextRequest, NextResponse } from "next/server"
import { createServerClient, type CookieOptions } from "@supabase/ssr"

import { ensureUserInDatabase } from "@/server/auth"

type SupabaseCookie = {
  name: string
  value: string
  options?: CookieOptions
}

export async function POST(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ authenticated: false, error: "config" }, { status: 500 })
  }

  const body = await request.json().catch(() => null)
  const accessToken = typeof body?.accessToken === "string" ? body.accessToken : ""
  const refreshToken = typeof body?.refreshToken === "string" ? body.refreshToken : ""

  if (!accessToken || !refreshToken) {
    return NextResponse.json({ authenticated: false, error: "missing_tokens" }, { status: 400 })
  }

  const pendingCookies: SupabaseCookie[] = []

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet: SupabaseCookie[]) {
        pendingCookies.splice(0, pendingCookies.length, ...cookiesToSet)
      },
    },
  })

  const { data, error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  })

  if (error || !data.session || !data.user) {
    const errorResponse = NextResponse.json(
      { authenticated: false, error: error?.message || "restore_failed" },
      { status: 401 },
    )
    pendingCookies.forEach(({ name, value, options }) => {
      errorResponse.cookies.set(name, value, options)
    })
    return errorResponse
  }

  try {
    await ensureUserInDatabase(data.user, "en")
  } catch {
    // Auth restoration should not fail because the profile sync is temporarily unavailable.
  }

  const response = NextResponse.json(
    {
      authenticated: true,
      userId: data.user.id,
    },
    { status: 200 },
  )

  pendingCookies.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options)
  })

  return response
}
