import { inngest } from '@/lib/inngest/client'
import { db } from '@/lib/db/client'
import { masterAccounts } from '@/lib/db/schema'

async function main() {
  const accounts = await db.select().from(masterAccounts)

  for (const account of accounts) {
    await inngest.send({
      name: 'zella/recompute.requested',
      data: { userId: account.userId, accountId: account.id },
    })
  }

  console.log(`Queued recompute for ${accounts.length} accounts`)
}

main()
