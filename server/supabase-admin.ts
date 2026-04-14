import { createClient, type User as SupabaseAuthUser } from '@supabase/supabase-js'

let supabaseAdminClient:
  | ReturnType<typeof createClient>
  | null = null

export function getSupabaseAdminClient() {
  if (supabaseAdminClient) {
    return supabaseAdminClient
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase admin client is not configured')
  }

  supabaseAdminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  return supabaseAdminClient
}

type AuthUserMetadata = {
  full_name?: string
  first_name?: string
  last_name?: string
  name?: string
}

export type AuthDirectoryUser = {
  id: string
  email: string | null
  created_at: string | null
  last_sign_in_at: string | null
  deleted_at: string | null
  user_metadata?: AuthUserMetadata | null
}

export async function listAllAuthUsers(): Promise<AuthDirectoryUser[]> {
  const supabaseAdmin = getSupabaseAdminClient()
  const users: AuthDirectoryUser[] = []
  const perPage = 200
  let page = 1

  while (true) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage,
    })

    if (error) {
      throw new Error(`Failed to load Supabase auth users: ${error.message}`)
    }

    const batch = (data?.users || []).map((user) => ({
      id: user.id,
      email: user.email ?? null,
      created_at: user.created_at ?? null,
      last_sign_in_at: user.last_sign_in_at ?? null,
      deleted_at: user.deleted_at ?? null,
      user_metadata: (user.user_metadata as AuthUserMetadata | undefined) ?? null,
    }))

    users.push(...batch)

    if (batch.length < perPage) {
      break
    }

    page += 1
  }

  return users
}
