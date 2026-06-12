import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const mocks = vi.hoisted(() => ({
  getResolvedUserIdentitySafe: vi.fn(),
  requireAdmin: vi.fn(),
  checkAIAccess: vi.fn(),
  findManyAIChat: vi.fn(),
  createAIChat: vi.fn(),
  findFirstAIChat: vi.fn(),
  updateAIChat: vi.fn(),
  findManyAISavedInsight: vi.fn(),
  createAISavedInsight: vi.fn(),
  findFirstAISavedInsight: vi.fn(),
  deleteAISavedInsight: vi.fn(),
  findUniqueAdminAISetting: vi.fn(),
  createAdminAISetting: vi.fn(),
  upsertAdminAISetting: vi.fn(),
  findManyAIChatUsageLog: vi.fn(),
}))

vi.mock('@/server/user-identity', () => ({
  getResolvedUserIdentitySafe: mocks.getResolvedUserIdentitySafe,
}))

vi.mock('@/server/admin-auth', () => ({
  requireAdmin: mocks.requireAdmin,
}))

vi.mock('@/lib/services/ai-guard', () => ({
  checkAIAccess: mocks.checkAIAccess,
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    aIChat: {
      findMany: mocks.findManyAIChat,
      create: mocks.createAIChat,
      findFirst: mocks.findFirstAIChat,
      update: mocks.updateAIChat,
    },
    aISavedInsight: {
      findMany: mocks.findManyAISavedInsight,
      create: mocks.createAISavedInsight,
      findFirst: mocks.findFirstAISavedInsight,
      delete: mocks.deleteAISavedInsight,
    },
    adminAISetting: {
      findUnique: mocks.findUniqueAdminAISetting,
      create: mocks.createAdminAISetting,
      upsert: mocks.upsertAdminAISetting,
    },
    aIChatUsageLog: {
      findMany: mocks.findManyAIChatUsageLog,
    },
  },
}))

vi.mock('@/lib/rate-limiter', () => ({
  applyRateLimit: vi.fn().mockResolvedValue(null),
  apiLimiter: {},
  adminLimiter: {},
}))

describe('AI Assistant APIs', () => {
  const userId = 'user-1'
  const identity = { authUserId: 'auth-1', internalUserId: userId }

  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getResolvedUserIdentitySafe.mockResolvedValue(identity)
    mocks.checkAIAccess.mockResolvedValue({ hasAccess: true })
  })

  describe('GET /api/v1/ai/chats', () => {
    it('returns 401 when unauthorized', async () => {
      mocks.getResolvedUserIdentitySafe.mockResolvedValueOnce(null)
      const { GET } = await import('@/app/api/v1/ai/chats/route')
      const req = new NextRequest('http://localhost/api/v1/ai/chats')
      const res = await GET(req)
      expect(res.status).toBe(401)
    })

    it('returns 403 when user is paywalled', async () => {
      mocks.checkAIAccess.mockResolvedValueOnce({ hasAccess: false, reason: 'AI requires subscription' })
      const { GET } = await import('@/app/api/v1/ai/chats/route')
      const req = new NextRequest('http://localhost/api/v1/ai/chats')
      const res = await GET(req)
      expect(res.status).toBe(403)
      const body = await res.json()
      expect(body.error).toBe('AI requires subscription')
    })

    it('returns chats successfully', async () => {
      const mockChats = [
        { id: 'chat-1', title: 'Trading Chat 1', isPinned: true },
        { id: 'chat-2', title: 'Trading Chat 2', isPinned: false },
      ]
      mocks.findManyAIChat.mockResolvedValueOnce(mockChats)
      const { GET } = await import('@/app/api/v1/ai/chats/route')
      const req = new NextRequest('http://localhost/api/v1/ai/chats')
      const res = await GET(req)
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.success).toBe(true)
      expect(body.data).toEqual(mockChats)
    })
  })

  describe('POST /api/v1/ai/chats', () => {
    it('creates a chat successfully', async () => {
      const chatInput = {
        title: 'Strategy Discussion',
        accounts: ['ACC-1'],
        dateRange: 'last-30-days',
        dataSources: ['trades'],
      }
      const mockChat = { id: 'new-chat-id', ...chatInput }
      mocks.createAIChat.mockResolvedValueOnce(mockChat)

      const { POST } = await import('@/app/api/v1/ai/chats/route')
      const req = new NextRequest('http://localhost/api/v1/ai/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(chatInput),
      })
      const res = await POST(req)
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.success).toBe(true)
      expect(body.data).toEqual(mockChat)
      expect(mocks.createAIChat).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId,
            title: 'Strategy Discussion',
          }),
        })
      )
    })
  })

  describe('/api/v1/ai/chats/[chatId]', () => {
    const chatId = 'chat-123'
    const mockParams = Promise.resolve({ chatId })

    it('GET: returns 404 when chat not found', async () => {
      mocks.findFirstAIChat.mockResolvedValueOnce(null)
      const { GET } = await import('@/app/api/v1/ai/chats/[chatId]/route')
      const req = new NextRequest(`http://localhost/api/v1/ai/chats/${chatId}`)
      const res = await GET(req, { params: mockParams })
      expect(res.status).toBe(404)
    })

    it('GET: returns chat details and messages', async () => {
      const mockChat = { id: chatId, title: 'Test Chat', messages: [{ id: 'msg-1', content: 'hello' }] }
      mocks.findFirstAIChat.mockResolvedValueOnce(mockChat)

      const { GET } = await import('@/app/api/v1/ai/chats/[chatId]/route')
      const req = new NextRequest(`http://localhost/api/v1/ai/chats/${chatId}`)
      const res = await GET(req, { params: mockParams })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.success).toBe(true)
      expect(body.data).toEqual(mockChat)
    })

    it('PATCH: updates chat settings', async () => {
      const mockChat = { id: chatId, title: 'Old Title' }
      mocks.findFirstAIChat.mockResolvedValueOnce(mockChat)

      const updatedChat = { id: chatId, title: 'New Title', isPinned: true }
      mocks.updateAIChat.mockResolvedValueOnce(updatedChat)

      const { PATCH } = await import('@/app/api/v1/ai/chats/[chatId]/route')
      const req = new NextRequest(`http://localhost/api/v1/ai/chats/${chatId}`, {
        method: 'PATCH',
        body: JSON.stringify({ title: 'New Title', isPinned: true }),
      })
      const res = await PATCH(req, { params: mockParams })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.success).toBe(true)
      expect(body.data).toEqual(updatedChat)
    })

    it('DELETE: marks chat as deleted', async () => {
      const mockChat = { id: chatId, title: 'To Delete' }
      mocks.findFirstAIChat.mockResolvedValueOnce(mockChat)

      const { DELETE } = await import('@/app/api/v1/ai/chats/[chatId]/route')
      const req = new NextRequest(`http://localhost/api/v1/ai/chats/${chatId}`, {
        method: 'DELETE',
      })
      const res = await DELETE(req, { params: mockParams })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.success).toBe(true)
      expect(mocks.updateAIChat).toHaveBeenCalledWith({
        where: { id: chatId },
        data: { isDeleted: true },
      })
    })
  })

  describe('AI Saved Insights', () => {
    it('GET: returns insights list', async () => {
      const mockInsights = [{ id: 'ins-1', title: 'Keep Risk Low', content: 'Use 1% max risk.' }]
      mocks.findManyAISavedInsight.mockResolvedValueOnce(mockInsights)

      const { GET } = await import('@/app/api/v1/ai/insights/route')
      const req = new NextRequest('http://localhost/api/v1/ai/insights')
      const res = await GET(req)
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.success).toBe(true)
      expect(body.data).toEqual(mockInsights)
    })

    it('POST: returns 400 when missing parameters', async () => {
      const { POST } = await import('@/app/api/v1/ai/insights/route')
      const req = new NextRequest('http://localhost/api/v1/ai/insights', {
        method: 'POST',
        body: JSON.stringify({ title: 'Only Title' }),
      })
      const res = await POST(req)
      expect(res.status).toBe(400)
    })

    it('POST: creates a saved insight successfully', async () => {
      const insightData = { title: 'Rule #1', content: 'Follow plan', category: 'psychology' }
      mocks.createAISavedInsight.mockResolvedValueOnce({ id: 'ins-new', ...insightData })

      const { POST } = await import('@/app/api/v1/ai/insights/route')
      const req = new NextRequest('http://localhost/api/v1/ai/insights', {
        method: 'POST',
        body: JSON.stringify(insightData),
      })
      const res = await POST(req)
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.success).toBe(true)
      expect(body.data.id).toBe('ins-new')
    })

    it('DELETE: removes saved insight', async () => {
      const insightId = 'ins-123'
      const mockParams = Promise.resolve({ insightId })

      mocks.findFirstAISavedInsight.mockResolvedValueOnce({ id: insightId })

      const { DELETE } = await import('@/app/api/v1/ai/insights/[insightId]/route')
      const req = new NextRequest(`http://localhost/api/v1/ai/insights/${insightId}`, {
        method: 'DELETE',
      })
      const res = await DELETE(req, { params: mockParams })
      expect(res.status).toBe(200)
      expect(mocks.deleteAISavedInsight).toHaveBeenCalledWith({
        where: { id: insightId },
      })
    })
  })

  describe('Admin AI Settings', () => {
    beforeEach(() => {
      mocks.requireAdmin.mockResolvedValue({ internalUserId: 'admin-1' })
    })

    it('GET: returns settings and calculated analytics', async () => {
      const mockSettings = { id: 'global', enabled: true, maxMessagesPerDay: 50 }
      const mockLogs = [
        {
          id: 'log-1',
          userId: 'user-1',
          promptTokens: 100,
          completionTokens: 200,
          totalTokens: 300,
          estimatedCost: 0.005,
          responseTimeMs: 800,
          createdAt: new Date(),
        },
      ]

      mocks.findUniqueAdminAISetting.mockResolvedValueOnce(mockSettings)
      mocks.findManyAIChatUsageLog.mockResolvedValueOnce(mockLogs)

      const { GET } = await import('@/app/api/v1/admin/ai-settings/route')
      const req = new NextRequest('http://localhost/api/v1/admin/ai-settings')
      const res = await GET(req)
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.success).toBe(true)
      expect(body.data.settings).toEqual(mockSettings)
      expect(body.data.analytics.totalRequests).toBe(1)
      expect(body.data.analytics.totalTokens).toBe(300)
    })

    it('PATCH: updates global settings', async () => {
      const updateData = { enabled: false, maxMessagesPerDay: 10 }
      mocks.upsertAdminAISetting.mockResolvedValueOnce({ id: 'global', ...updateData })

      const { PATCH } = await import('@/app/api/v1/admin/ai-settings/route')
      const req = new NextRequest('http://localhost/api/v1/admin/ai-settings', {
        method: 'PATCH',
        body: JSON.stringify(updateData),
      })
      const res = await PATCH(req)
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.success).toBe(true)
      expect(body.data.enabled).toBe(false)
      expect(body.data.maxMessagesPerDay).toBe(10)
    })
  })
})
