import { describe, expect, it } from 'vitest'
import { buildFeedbackAttachmentPath, buildTradeImagePath, isOwnerPrefixedPath } from '@/lib/storage/paths'

describe('storage path builders', () => {
  it('builds owner-scoped trade image paths', () => {
    expect(buildTradeImagePath({ folder: 'trades', userId: 'user-1', tradeId: 'trade-1', fileName: 'chart.png' })).toBe(
      'trades/user-1/trade-1/chart.png'
    )
  })

  it('builds owner-scoped feedback attachment paths', () => {
    const path = buildFeedbackAttachmentPath({ ownerId: 'auth-user-1', submissionId: 'submission-1', fileName: 'shot.png' })

    expect(path).toBe('auth-user-1/submission-1/shot.png')
    expect(isOwnerPrefixedPath(path, 'auth-user-1')).toBe(true)
  })

  it('sanitizes unsafe path segments', () => {
    expect(buildFeedbackAttachmentPath({ ownerId: '../user', submissionId: 'sub/id', fileName: 'a b.png' })).toBe(
      '.._user/sub_id/a_b.png'
    )
  })
})
