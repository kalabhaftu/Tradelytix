import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getResolvedUserIdentitySafe: vi.fn(),
  findUnique: vi.fn(),
  update: vi.fn(),
  upsert: vi.fn(),
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
    userSettings: {
      upsert: mocks.upsert,
    },
    $transaction: vi.fn().mockImplementation(async (cb: any) => {
      const tx = {
        user: { update: mocks.update },
        userSettings: { upsert: mocks.upsert },
      }
      return cb(tx)
    }),
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
  aiSettings: Record<string, unknown> | null
  onboardingStatus: Record<string, unknown> | null
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
      aiSettings: {
        autoGenerateInsights: false,
        includeAiInsightsInNotifications: false,
      },
      onboardingStatus: null,
    }

    mocks.getResolvedUserIdentitySafe.mockResolvedValue({
      authUserId: 'legacy-auth-id',
      internalUserId: 'internal-user-1',
    })

    mocks.findUnique.mockImplementation(async (args: any) => {
      if (args?.where?.id !== userRow.id) {
        return null
      }
      const base = pickSelected(userRow as Record<string, unknown>, args?.select)
      if (args?.select?.onboardingStatus) {
        base.onboardingStatus = userRow.onboardingStatus
      }
      if (args?.select?.settings) {
        base.settings = {
          timezone: 'America/New_York',
          theme: userRow.theme,
          accountFilterSettings: null,
          aiSettings: userRow.aiSettings,
          backtestInputMode: 'manual',
          breakEvenThreshold: userRow.breakEvenThreshold,
          pnlDisplayMode: 'net',
          accentPack: userRow.accentPack,
          autoAdjustAccountDate: userRow.autoAdjustAccountDate,
        }
      }
      return base
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

    mocks.upsert.mockImplementation(async (args: any) => {
      const patch = args?.update ?? {}
      userRow = { ...userRow, ...patch }
      return {
        timezone: 'America/New_York',
        theme: userRow.theme,
        accountFilterSettings: null,
        aiSettings: userRow.aiSettings,
        backtestInputMode: 'manual',
        breakEvenThreshold: userRow.breakEvenThreshold,
        pnlDisplayMode: 'net',
        accentPack: userRow.accentPack,
        autoAdjustAccountDate: userRow.autoAdjustAccountDate,
      }
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

  it('preserves AI settings when updating unrelated profile fields', async () => {
    userRow.aiSettings = {
      autoGenerateInsights: true,
      includeAiInsightsInNotifications: true,
    }

    const { PATCH, GET } = await import('@/app/api/auth/profile/route')

    const patchResponse = await PATCH(
      new Request('http://localhost/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: 'Marshall',
          lastName: 'Mathers',
          autoAdjustAccountDate: true,
        }),
      }) as any
    )

    const patchBody = await patchResponse.json()
    expect(patchResponse.status).toBe(200)
    expect(patchBody.data.aiSettings).toEqual({
      autoGenerateInsights: true,
      includeAiInsightsInNotifications: true,
    })

    const getResponse = await GET()
    const getBody = await getResponse.json()

    expect(getResponse.status).toBe(200)
    expect(getBody.data.aiSettings).toEqual({
      autoGenerateInsights: true,
      includeAiInsightsInNotifications: true,
    })
  })

  it('persists onboardingStatus and reads it back with GET', async () => {
    const { PATCH, GET } = await import('@/app/api/auth/profile/route')

    const statusObj = {
      core_onboarding_completed: true,
      version_2_1_feature_tour_completed: false,
    }

    const patchResponse = await PATCH(
      new Request('http://localhost/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ onboardingStatus: statusObj }),
      }) as any
    )

    const patchBody = await patchResponse.json()
    expect(patchResponse.status).toBe(200)
    expect(patchBody.data.onboardingStatus.core_onboarding_completed).toBe(true)

    const getResponse = await GET()
    const getBody = await getResponse.json()
    expect(getResponse.status).toBe(200)
    expect(getBody.data.onboardingStatus.core_onboarding_completed).toBe(true)
    expect(getBody.data.onboardingStatus.last_updated).toBeDefined()
  })
})