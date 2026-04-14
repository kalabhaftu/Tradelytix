import { prisma } from '@/lib/prisma'
import { listAllAuthUsers, type AuthDirectoryUser } from '@/server/supabase-admin'

type DbUserSummary = {
  id: string
  email: string
  auth_user_id: string
  firstName?: string | null
  lastName?: string | null
}

export async function getAuthBackedUserDirectory() {
  const [dbUsers, authUsers] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        email: true,
        auth_user_id: true,
        firstName: true,
        lastName: true,
      },
    }),
    listAllAuthUsers(),
  ])

  const authUsersById = new Map(authUsers.map((user) => [user.id, user]))
  const dbUsersByAuthId = new Map(dbUsers.map((user) => [user.auth_user_id, user]))
  const activeDbUsers = dbUsers.filter((user) => authUsersById.has(user.auth_user_id))
  const orphanedDbUsers = dbUsers.filter((user) => !authUsersById.has(user.auth_user_id))
  const authUsersMissingDbRows = authUsers.filter((user) => !dbUsersByAuthId.has(user.id))

  return {
    authUsers,
    authUsersById,
    dbUsers,
    dbUsersByAuthId,
    activeDbUsers,
    orphanedDbUsers,
    authUsersMissingDbRows,
  }
}

export function getAuthUserForDbUser(
  authUsersById: Map<string, AuthDirectoryUser>,
  user: DbUserSummary
) {
  return authUsersById.get(user.auth_user_id) ?? null
}
