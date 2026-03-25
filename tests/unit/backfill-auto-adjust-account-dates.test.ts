import { describe, expect, it, vi } from 'vitest'

import {
  normalizeToStartOfDay,
  runBackfillAutoAdjustAccountDates,
  shouldApplyBackwardOnly,
} from '@/scripts/backfill-auto-adjust-account-dates'

type MockData = {
  users: Array<{ id: string }>
  accounts: Array<{ id: string; userId: string; number: string; createdAt: Date }>
  masters: Array<{ id: string; userId: string; createdAt: Date }>
  phases: Array<{ id: string; masterAccountId: string; startDate: Date; masterUserId: string }>
  regularTrades: Array<{ userId: string; accountNumber: string; entryTime: Date | null; entryDate: string }>
  phaseTrades: Array<{ phaseAccountId: string | null; entryTime: Date | null; entryDate: string }>
}

function createMockDb(data: MockData) {
  const accountUpdate = vi.fn().mockResolvedValue({})
  const masterUpdate = vi.fn().mockResolvedValue({})
  const phaseUpdate = vi.fn().mockResolvedValue({})

  const db: any = {
    user: {
      findMany: vi.fn(async (args?: any) => {
        const userId = args?.where?.id
        if (!userId) {
          return data.users
        }
        return data.users.filter((user) => user.id === userId)
      }),
    },
    account: {
      findMany: vi.fn(async (args?: any) => {
        const userId = args?.where?.userId
        if (!userId) {
          return data.accounts
        }
        return data.accounts.filter((account) => account.userId === userId)
      }),
      update: accountUpdate,
    },
    masterAccount: {
      findMany: vi.fn(async (args?: any) => {
        const userId = args?.where?.userId
        if (!userId) {
          return data.masters
        }
        return data.masters.filter((master) => master.userId === userId)
      }),
      update: masterUpdate,
    },
    phaseAccount: {
      findMany: vi.fn(async (args?: any) => {
        const filteredUserId = args?.where?.MasterAccount?.userId
        if (!filteredUserId) {
          return data.phases.map((phase) => ({
            id: phase.id,
            masterAccountId: phase.masterAccountId,
            startDate: phase.startDate,
          }))
        }
        return data.phases
          .filter((phase) => phase.masterUserId === filteredUserId)
          .map((phase) => ({
            id: phase.id,
            masterAccountId: phase.masterAccountId,
            startDate: phase.startDate,
          }))
      }),
      update: phaseUpdate,
    },
    trade: {
      findMany: vi.fn(async (args?: any) => {
        if (args?.where?.phaseAccountId === null) {
          return data.regularTrades
        }
        if (args?.where?.phaseAccountId?.not === null) {
          return data.phaseTrades
        }
        return []
      }),
    },
    $disconnect: vi.fn().mockResolvedValue(undefined),
  }

  return {
    db,
    accountUpdate,
    masterUpdate,
    phaseUpdate,
  }
}

describe('backfill-auto-adjust-account-dates script logic', () => {
  it('dry-run mode does not write and keeps phase dates phase-specific (no mixing)', async () => {
    const mock = createMockDb({
      users: [{ id: 'u1' }],
      accounts: [
        {
          id: 'a1',
          userId: 'u1',
          number: '1001',
          createdAt: new Date('2024-03-10T12:30:00.000Z'),
        },
      ],
      masters: [
        {
          id: 'm1',
          userId: 'u1',
          createdAt: new Date('2024-03-09T00:00:00.000Z'),
        },
      ],
      phases: [
        {
          id: 'p1',
          masterAccountId: 'm1',
          startDate: new Date('2024-03-08T00:00:00.000Z'),
          masterUserId: 'u1',
        },
        {
          id: 'p2',
          masterAccountId: 'm1',
          startDate: new Date('2024-03-08T00:00:00.000Z'),
          masterUserId: 'u1',
        },
      ],
      regularTrades: [
        {
          userId: 'u1',
          accountNumber: '1001',
          entryTime: null,
          entryDate: '2024-03-01',
        },
      ],
      phaseTrades: [
        {
          phaseAccountId: 'p1',
          entryTime: null,
          entryDate: '2024-03-02',
        },
      ],
    })

    const summary = await runBackfillAutoAdjustAccountDates({ apply: false }, mock.db)

    expect(summary.regular_account_updates).toBe(1)
    expect(summary.phase_startdate_updates).toBe(1)
    expect(summary.master_account_updates).toBe(1)
    expect(summary.phase_startdate_skipped_no_trades).toBe(1)

    expect(summary.writes_applied).toBe(0)
    expect(mock.accountUpdate).not.toHaveBeenCalled()
    expect(mock.phaseUpdate).not.toHaveBeenCalled()
    expect(mock.masterUpdate).not.toHaveBeenCalled()
  })

  it('apply mode enforces backward-only updates and normalizes to start-of-day', async () => {
    const mock = createMockDb({
      users: [{ id: 'u2' }],
      accounts: [
        {
          id: 'a2',
          userId: 'u2',
          number: '2001',
          createdAt: new Date('2024-03-10T12:30:00.000Z'),
        },
      ],
      masters: [
        {
          id: 'm2',
          userId: 'u2',
          createdAt: new Date('2024-03-10T10:00:00.000Z'),
        },
      ],
      phases: [
        {
          id: 'p3',
          masterAccountId: 'm2',
          startDate: new Date('2024-03-10T11:00:00.000Z'),
          masterUserId: 'u2',
        },
      ],
      regularTrades: [
        {
          userId: 'u2',
          accountNumber: '2001',
          entryTime: null,
          entryDate: '2024-03-05T16:45:00.000Z',
        },
      ],
      phaseTrades: [
        {
          phaseAccountId: 'p3',
          entryTime: null,
          entryDate: '2024-03-04T09:00:00.000Z',
        },
      ],
    })

    const summary = await runBackfillAutoAdjustAccountDates({ apply: true }, mock.db)

    expect(summary.writes_applied).toBe(3)
    expect(mock.accountUpdate).toHaveBeenCalledTimes(1)
    expect(mock.phaseUpdate).toHaveBeenCalledTimes(1)
    expect(mock.masterUpdate).toHaveBeenCalledTimes(1)

    const regularDate = mock.accountUpdate.mock.calls[0][0].data.createdAt as Date
    const phaseDate = mock.phaseUpdate.mock.calls[0][0].data.startDate as Date
    const masterDate = mock.masterUpdate.mock.calls[0][0].data.createdAt as Date

    expect(regularDate.getHours()).toBe(0)
    expect(phaseDate.getHours()).toBe(0)
    expect(masterDate.getHours()).toBe(0)

    expect(summary.regular_account_skipped_backward_only).toBe(0)
    expect(summary.phase_startdate_skipped_backward_only).toBe(0)
    expect(summary.master_account_skipped_backward_only).toBe(0)
  })

  it('utility helpers enforce backward-only semantics', () => {
    const current = new Date('2024-03-10T12:00:00.000Z')
    const older = normalizeToStartOfDay(new Date('2024-03-09T08:00:00.000Z'))
    const newer = normalizeToStartOfDay(new Date('2024-03-11T08:00:00.000Z'))

    expect(shouldApplyBackwardOnly(current, older)).toBe(true)
    expect(shouldApplyBackwardOnly(current, newer)).toBe(false)
    expect(shouldApplyBackwardOnly(current, null)).toBe(false)
  })
})
