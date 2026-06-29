import crypto from 'crypto'

export function generateDeterministicTradeId(tradeData: {
  accountNumber: string
  entryId: string
  closeId: string
  instrument: string
  entryPrice: string
  closePrice: string
  entryDate: string
  closeDate: string
  quantity: number
  side: string
  userId: string
}): string {
  const tradeSignature = [
    tradeData.userId,
    tradeData.accountNumber,
    tradeData.entryId,
    tradeData.closeId,
    tradeData.instrument,
    tradeData.entryPrice,
    tradeData.closePrice,
    tradeData.entryDate,
    tradeData.closeDate,
    tradeData.quantity.toString(),
    tradeData.side
  ].join('|')
  
  const hash = crypto.createHash('sha256').update(tradeSignature).digest('hex')
  
  return [
    hash.substring(0, 8),
    hash.substring(8, 12),
    hash.substring(12, 16),
    hash.substring(16, 20),
    hash.substring(20, 32)
  ].join('-')
}
