export const TRADE_IMAGES_BUCKET = 'trade-images'
export const FEEDBACK_ATTACHMENTS_BUCKET = 'feedback-attachments'

function safeSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 160)
}

export function buildTradeImagePath(params: { userId: string; tradeId?: string; fileName: string; folder?: string }) {
  const folder = safeSegment(params.folder || 'trades')
  const userId = safeSegment(params.userId)
  const fileName = safeSegment(params.fileName)

  if (params.tradeId) {
    return `${folder}/${userId}/${safeSegment(params.tradeId)}/${fileName}`
  }

  return `${folder}/${userId}/${fileName}`
}

export function buildFeedbackAttachmentPath(params: { ownerId: string; submissionId: string; fileName: string }) {
  return `${safeSegment(params.ownerId)}/${safeSegment(params.submissionId)}/${safeSegment(params.fileName)}`
}

export function isOwnerPrefixedPath(path: string, ownerId: string) {
  return path.split('/')[0] === safeSegment(ownerId)
}
