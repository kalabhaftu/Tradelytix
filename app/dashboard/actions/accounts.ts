"use server"

import { db } from "@/lib/db/client"
import * as schema from "@/lib/db/schema"
import { createClient } from "@/server/auth"
import { revalidatePath } from "next/cache"

export async function ensureAccountAndAssignGroup(
  accountNumber: string,
  groupId: string | null
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "User not found" }
  }
  try {
    let account = await db.query.Account.findFirst({
      where: (table, { and, eq }) => and(
        eq(table.number, accountNumber),
        eq(table.userId, user.id)
      ),
    })

    // Create if it doesn't exist
    if (!account) {
      account = (await db.insert(schema.Account).values({
        id: crypto.randomUUID(),
        number: accountNumber,
        userId: user.id,
      }).returning())[0]
    }

    // Groups removed - no longer used
    // Account is created/ensured, no group assignment needed

    return { success: true }
  } catch (error) {
    return { success: false, error: "Failed to assign account to group" }
  }
} 

export async function getAccounts() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return []
  }
  try {
    const accounts = await db.query.Account.findMany({
      where: (table, { eq }) => eq(table.userId, user.id),
    })
    return accounts
  } catch (error) {
    return []
  }
}