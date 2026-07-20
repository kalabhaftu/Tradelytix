import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

// Use this in every server component, server action, and API route
// that needs the authenticated user. Never use getSession() - it's
// client-side only and doesn't verify the JWT server-side.
export async function getServerUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
}

// Use this in server actions that must be authenticated
// Redirects to login if not authenticated
export async function requireUser() {
  const user = await getServerUser()
  if (!user) redirect('/auth/login')
  return user
}
