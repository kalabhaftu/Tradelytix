'use server'
import { db } from "@/lib/db/client"
import * as schema from '@/lib/db/schema'
import { getResolvedUserIdentity } from "@/server/user-identity"
import { and, eq } from 'drizzle-orm'

export async function getRithmicSynchronizations() {
  const { internalUserId } = await getResolvedUserIdentity()
  const synchronizations = await db.query.Synchronization.findMany({
    where: (table, { eq, and }) => and(eq(table.userId, internalUserId), eq(table.service, "rithmic")),
  })
  return synchronizations
}

export async function setRithmicSynchronization(synchronization: any) {
  const { internalUserId } = await getResolvedUserIdentity()
  await db.insert(schema.Synchronization).values({
    ...synchronization,
    service: synchronization.service || 'rithmic',
    accountId: synchronization.accountId || '',
    lastSyncedAt: synchronization.lastSyncedAt || new Date(),
    userId: internalUserId,
    includedFeeTypes: undefined,
  }).onConflictDoUpdate({
    target: [schema.Synchronization.userId, schema.Synchronization.service, schema.Synchronization.accountId],
    set: {
      ...synchronization,
      userId: internalUserId,
      includedFeeTypes: undefined,
    },
  })
}

export async function removeRithmicSynchronization(accountId: string) {
  const { internalUserId } = await getResolvedUserIdentity()

  await db.delete(schema.Synchronization).where(
    and(eq(schema.Synchronization.userId, internalUserId), eq(schema.Synchronization.service, "rithmic"), eq(schema.Synchronization.accountId, accountId))
  )
}