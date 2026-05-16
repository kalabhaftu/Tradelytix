import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

interface DailyJournalQuery {
  accountId?: string | null
  startDate?: Date | string
  endDate?: Date | string
  sortOrder?: Prisma.SortOrder
}

type DailyNoteClient = Pick<typeof prisma, 'dailyNote'>

export function normalizeJournalDate(date: Date | string) {
  const normalized = new Date(date)
  normalized.setHours(0, 0, 0, 0)
  return normalized
}

export function buildDailyJournalWhere(
  userId: string,
  { accountId, startDate, endDate }: DailyJournalQuery = {}
): Prisma.DailyNoteWhereInput {
  const where: Prisma.DailyNoteWhereInput = { userId }

  if (accountId !== undefined) {
    where.accountId = accountId || null
  }

  if (startDate || endDate) {
    where.date = {}

    if (startDate) {
      where.date.gte = normalizeJournalDate(startDate)
    }

    if (endDate) {
      where.date.lte = normalizeJournalDate(endDate)
    }
  }

  return where
}

export async function getDailyJournalEntry(
  userId: string,
  date: Date | string,
  accountId?: string | null,
  client: DailyNoteClient = prisma
) {
  return client.dailyNote.findFirst({
    where: buildDailyJournalWhere(userId, {
      startDate: date,
      endDate: date,
      accountId,
    }),
  })
}

export async function listDailyJournalEntries(
  userId: string,
  query: DailyJournalQuery = {},
  client: DailyNoteClient = prisma
) {
  return client.dailyNote.findMany({
    where: buildDailyJournalWhere(userId, query),
    orderBy: { date: query.sortOrder || 'desc' },
    include: {
      Account: {
        select: {
          id: true,
          name: true,
          number: true,
        },
      },
    },
  })
}
