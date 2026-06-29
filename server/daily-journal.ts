import { db } from '@/lib/db/client'

interface DailyJournalQuery {
  accountId?: string | null
  startDate?: Date | string
  endDate?: Date | string
  sortOrder?: 'asc' | 'desc'
}

export function normalizeJournalDate(date: Date | string) {
  const normalized = new Date(date)
  normalized.setHours(0, 0, 0, 0)
  return normalized
}

export function buildDailyJournalWhere(
  userId: string,
  { accountId, startDate, endDate }: DailyJournalQuery = {}
) {
  const conditions: any[] = [{ userId }]

  if (accountId !== undefined) {
    conditions.push({ accountId: accountId || null })
  }

  if (startDate || endDate) {
    const dateConditions: any = {}
    if (startDate) {
      dateConditions.gte = normalizeJournalDate(startDate)
    }
    if (endDate) {
      dateConditions.lte = normalizeJournalDate(endDate)
    }
    conditions.push({ date: dateConditions })
  }

  return conditions
}

export async function getDailyJournalEntry(
  userId: string,
  date: Date | string,
  accountId?: string | null
) {
  return db.query.DailyNote.findFirst({
    where: (table, { eq, and, isNull }) =>
      and(
        eq(table.userId, userId),
        eq(table.date, normalizeJournalDate(date)),
        accountId !== undefined ? (accountId ? eq(table.accountId, accountId) : isNull(table.accountId)) : undefined
      ),
  })
}

export async function listDailyJournalEntries(
  userId: string,
  query: DailyJournalQuery = {}
) {
  const sortOrder = query.sortOrder || 'desc'
  return db.query.DailyNote.findMany({
    where: (table, { eq, and, gte, lte, isNull }) => {
      const conditions = [eq(table.userId, userId)]
      if (query.accountId !== undefined) {
        conditions.push(query.accountId ? eq(table.accountId, query.accountId) : isNull(table.accountId))
      }
      if (query.startDate) {
        conditions.push(gte(table.date, normalizeJournalDate(query.startDate)))
      }
      if (query.endDate) {
        conditions.push(lte(table.date, normalizeJournalDate(query.endDate)))
      }
      return and(...conditions)
    },
    orderBy: (table, { desc, asc }) =>
      sortOrder === 'desc' ? [desc(table.date)] : [asc(table.date)],
    with: {
      Account: {
        columns: {
          id: true,
          name: true,
          number: true,
        },
      },
    },
  })
}