import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getResolvedUserIdentitySafe: vi.fn(),
  findUnique: vi.fn(),
  update: vi.fn(),
  logActivity: vi.fn(),
  getClientIp: vi.fn().mockReturnValue('127.0.0.1'),
}))

vi.mock('@/server/user-identity', () => ({
  getResolvedUserIdentitySafe: mocks.getResolvedUserIdentitySafe,
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: mocks.findUnique,
      update: mocks.update,
    },
  },
}))

vi.mock('@/lib/activity-logger', () => ({
  logActivity: mocks.logActivity,
  getClientIp: mocks.getClientIp,
}))

type MockUser = {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  accentPack: string
  theme: string
  autoAdjustAccountDate: boolean
  breakEvenThreshold: number
  calendarDisplayStats: string[]
  showWeeklySummary: boolean
  aiSettings: Record<string, unknown> | null
}

function pickSelected<T extends Record<string, unknown>>(row: T, select?: Record<string, boolean>) {
  if (!select) {
    return row
  }

  const selected: Record<string, unknown> = {}
  for (const key of Object.keys(select)) {
    if (select[key]) {
      selected[key] = row[key]
    }
  }

  return selected
}

describe('GET/PATCH /api/auth/profile', () => {
  let userRow: MockUser

  beforeEach(() => {
    vi.clearAllMocks()

    userRow = {
      id: 'internal-user-1',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      accentPack: 'classic',
      theme: 'system',
      autoAdjustAccountDate: false,
      breakEvenThreshold: 10,
      calendarDisplayStats: ['pnl', 'trades'],
      showWeeklySummary: true,
      aiSettings: {
        weeklyReviewAutomationEnabled: false,
        autoGenerateInsights: false,
        includeAiInsightsInNotifications: true,
      },
    }

    mocks.getResolvedUserIdentitySafe.mockResolvedValue({
      authUserId: 'legacy-auth-id',
      internalUserId: 'internal-user-1',
    })

    mocks.findUnique.mockImplementation(async (args: any) => {
      if (args?.where?.id !== userRow.id) {
        return null
      }
      return pickSelected(userRow as Record<string, unknown>, args?.select)
    })

    mocks.update.mockImplementation(async (args: any) => {
      if (args?.where?.id !== userRow.id) {
        throw new Error('Wrong user id in update')
      }

      userRow = {
        ...userRow,
        ...(args?.data ?? {}),
      }

      return pickSelected(userRow as Record<string, unknown>, args?.select)
    })
  })

  it('persists autoAdjustAccountDate=true and reads it back with GET', async () => {
    const { PATCH, GET } = await import('@/app/api/auth/profile/route')

    const patchResponse = await PATCH(
      new Request('http://localhost/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoAdjustAccountDate: true }),
      }) as any
    )

    const patchBody = await patchResponse.json()
    expect(patchResponse.status).toBe(200)
    expect(patchBody.data.autoAdjustAccountDate).toBe(true)
    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'internal-user-1' },
      })
    )

    const getResponse = await GET()
    const getBody = await getResponse.json()

    expect(getResponse.status).toBe(200)
    expect(getBody.data.autoAdjustAccountDate).toBe(true)
  })

  it('persists autoAdjustAccountDate=false and reads it back with GET', async () => {
    userRow.autoAdjustAccountDate = true

    const { PATCH, GET } = await import('@/app/api/auth/profile/route')

    const patchResponse = await PATCH(
      new Request('http://localhost/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoAdjustAccountDate: false }),
      }) as any
    )

    const patchBody = await patchResponse.json()
    expect(patchResponse.status).toBe(200)
    expect(patchBody.data.autoAdjustAccountDate).toBe(false)

    const getResponse = await GET()
    const getBody = await getResponse.json()

    expect(getResponse.status).toBe(200)
    expect(getBody.data.autoAdjustAccountDate).toBe(false)
  })

  it('persists breakEvenThreshold and reads it back with GET', async () => {
    const { PATCH, GET } = await import('@/app/api/auth/profile/route')

    const patchResponse = await PATCH(
      new Request('http://localhost/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ breakEvenThreshold: 23.5 }),
      }) as any
    )

    const patchBody = await patchResponse.json()
    expect(patchResponse.status).toBe(200)
    expect(patchBody.data.breakEvenThreshold).toBe(23.5)

    const getResponse = await GET()
    const getBody = await getResponse.json()
    expect(getResponse.status).toBe(200)
    expect(getBody.data.breakEvenThreshold).toBe(23.5)
  })
})
