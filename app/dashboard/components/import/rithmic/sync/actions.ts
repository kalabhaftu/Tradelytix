'use server'
import { prisma } from "@/lib/prisma"
import { getResolvedUserIdentity } from "@/server/user-identity"
import { Synchronization } from "@prisma/client"

export async function getRithmicSynchronizations() {
  const { internalUserId } = await getResolvedUserIdentity()
  const synchronizations = await prisma.synchronization.findMany({
    where: { userId: internalUserId, service: "rithmic" },
  })
  return synchronizations
}

export async function setRithmicSynchronization(synchronization: Partial<Synchronization>) {
  const { internalUserId } = await getResolvedUserIdentity()
  await prisma.synchronization.upsert({
    where: { 
      userId_service_accountId: {
        userId: internalUserId,
        service: synchronization.service || 'rithmic',
        accountId: synchronization.accountId || ''
      }
    },
    update: {
      ...synchronization,
      userId: internalUserId,
      includedFeeTypes: undefined,
    },
    create: {
      ...synchronization,
      service: synchronization.service || 'rithmic',
      accountId: synchronization.accountId || '',
      lastSyncedAt: synchronization.lastSyncedAt || new Date(),
      userId: internalUserId,
      includedFeeTypes: undefined,
    },
  })
}

export async function removeRithmicSynchronization(accountId: string) {
  const { internalUserId } = await getResolvedUserIdentity()

  await prisma.synchronization.deleteMany({
    where: {
      userId: internalUserId,
      service: "rithmic",
      accountId,
    },
  })
}
