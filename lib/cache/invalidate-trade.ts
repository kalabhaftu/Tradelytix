import { invalidateAccountCache } from './helpers'
import { db } from '../db/client'

export async function invalidateTradesCache(userId: string, accountId?: string | null) {
  if (accountId) {
    await invalidateAccountCache(userId, accountId)
    return
  }

  // If no account ID is provided, invalidate all accounts for the user
  const accounts = await db.query.Account.findMany({
    where: (table, { eq }) => eq(table.userId, userId),
    columns: { id: true }
  })
  
  await Promise.all(
    accounts.map(acc => invalidateAccountCache(userId, acc.id))
  )
}
