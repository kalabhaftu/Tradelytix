import { prisma } from '@/lib/prisma'
import { generateTradeHash } from '@/lib/utils'
import { PhaseEvaluationEngine } from '@/lib/prop-firm/phase-evaluation-engine'

const TRADE_IMPORT_CHUNK_SIZE = 250

interface TradeImportPayload {
  accountId: string
  trades: any[]
}

interface TradeImportJobState {
  kind: 'trade_import'
  index: number
  imported: number
  skipped: number
  accountType?: 'prop-firm' | 'live'
  accountName?: string
  propFirmName?: string
  evaluationType?: string
  phaseNumber?: number
  phaseAccountId?: string
  regularAccountId?: string
  accountNumber?: string
  masterAccountId?: string
  evaluation?: {
    isFailed: boolean
    isPassed?: boolean
    canAdvance?: boolean
    status?: string
    message?: string
    currentPhaseNumber?: number
    profitTargetProgress?: number
    currentPnL?: number
    evaluationType?: string
    propFirmName?: string
  }
}

const DEFAULT_TRADE_IMPORT_STATE: TradeImportJobState = {
  kind: 'trade_import',
  index: 0,
  imported: 0,
  skipped: 0,
}

function parseTradeImportState(state: unknown): TradeImportJobState {
  if (!state || typeof state !== 'object') return { ...DEFAULT_TRADE_IMPORT_STATE }

  const obj = state as Partial<TradeImportJobState>
  return {
    kind: 'trade_import',
    index: Number.isFinite(obj.index) ? Number(obj.index) : 0,
    imported: Number.isFinite(obj.imported) ? Number(obj.imported) : 0,
    skipped: Number.isFinite(obj.skipped) ? Number(obj.skipped) : 0,
    accountType: obj.accountType,
    accountName: obj.accountName,
    propFirmName: obj.propFirmName,
    evaluationType: obj.evaluationType,
    phaseNumber: Number.isFinite(obj.phaseNumber) ? Number(obj.phaseNumber) : undefined,
    phaseAccountId: obj.phaseAccountId,
    regularAccountId: obj.regularAccountId,
    accountNumber: obj.accountNumber,
    masterAccountId: obj.masterAccountId,
    evaluation: obj.evaluation,
  }
}

function parsePayload(fileData: unknown): TradeImportPayload {
  const buffer = Buffer.isBuffer(fileData)
    ? fileData
    : fileData instanceof Uint8Array
      ? Buffer.from(fileData)
      : Buffer.from(fileData as any)

  const parsed = JSON.parse(buffer.toString('utf-8')) as TradeImportPayload

  if (!parsed?.accountId || !Array.isArray(parsed.trades)) {
    throw new Error('Invalid trade import payload')
  }

  return parsed
}

function serializeTradeImportJob(job: any) {
  const state = parseTradeImportState(job.state)

  return {
    id: job.id,
    status: job.status,
    stage: job.stage,
    progress: job.progress,
    totalItems: job.totalItems,
    processedItems: job.processedItems,
    importedCount: job.importedCount,
    skippedCount: job.skippedCount,
    cancelRequested: job.cancelRequested,
    error: job.error,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    startedAt: job.startedAt,
    completedAt: job.completedAt,
    meta: {
      kind: state.kind,
      accountType: state.accountType,
      accountName: state.accountName,
      propFirmName: state.propFirmName,
      evaluationType: state.evaluationType,
      phaseNumber: state.phaseNumber,
      masterAccountId: state.masterAccountId,
      phaseAccountId: state.phaseAccountId,
      regularAccountId: state.regularAccountId,
      evaluation: state.evaluation,
    }
  }
}

function normalizeTrade(rawTrade: any, internalUserId: string, accountNumber: string) {
  if (!rawTrade || typeof rawTrade !== 'object') return null

  const trade = Object.fromEntries(
    Object.entries(rawTrade).filter(([, value]) => value !== undefined)
  ) as any

  if (!trade.instrument || !trade.entryDate || !trade.closeDate) {
    return null
  }

  const quantity = Number(trade.quantity ?? 0)
  const pnl = Number(trade.pnl ?? 0)
  const commission = Number(trade.commission ?? 0)
  const timeInPosition = Number(trade.timeInPosition ?? 0)

  const normalized = {
    ...trade,
    id: trade.id || generateTradeHash({
      userId: internalUserId,
      accountNumber,
      instrument: trade.instrument || '',
      entryDate: trade.entryDate || '',
      closeDate: trade.closeDate || '',
      quantity,
      entryId: trade.entryId || '',
      timeInPosition,
    } as any),
    userId: internalUserId,
    accountNumber,
    instrument: String(trade.instrument || ''),
    entryPrice: String(trade.entryPrice || ''),
    closePrice: String(trade.closePrice || ''),
    entryDate: String(trade.entryDate || ''),
    closeDate: String(trade.closeDate || ''),
    quantity,
    pnl,
    commission,
    timeInPosition,
    createdAt: trade.createdAt ? new Date(trade.createdAt) : new Date(),
    side: trade.side || '',
    entryId: trade.entryId || null,
    comment: trade.comment || null,
    groupId: trade.groupId || null,
    symbol: trade.symbol || null,
    entryTime: trade.entryTime ? new Date(trade.entryTime) : null,
    exitTime: trade.exitTime ? new Date(trade.exitTime) : null,
    closeReason: trade.closeReason || null,
    stopLoss: trade.stopLoss || null,
    takeProfit: trade.takeProfit || null,
    tags: Array.isArray(trade.tags) ? trade.tags : [],
    marketBias: trade.marketBias || null,
    modelId: trade.modelId || null,
    selectedRules: trade.selectedRules || null,
    outcome: trade.outcome || null,
    ruleBroken: typeof trade.ruleBroken === 'boolean' ? trade.ruleBroken : null,
    newsDay: typeof trade.newsDay === 'boolean' ? trade.newsDay : null,
    selectedNews: trade.selectedNews || null,
    newsTraded: typeof trade.newsTraded === 'boolean' ? trade.newsTraded : null,
    biasTimeframe: trade.biasTimeframe || null,
    narrativeTimeframe: trade.narrativeTimeframe || null,
    entryTimeframe: trade.entryTimeframe || null,
    structureTimeframe: trade.structureTimeframe || null,
    orderType: trade.orderType || null,
    chartLinks: trade.chartLinks || null,
    cardPreviewImage: trade.cardPreviewImage || null,
    imageOne: trade.imageOne || null,
    imageTwo: trade.imageTwo || null,
    imageThree: trade.imageThree || null,
    imageFour: trade.imageFour || null,
    imageFive: trade.imageFive || null,
    imageSix: trade.imageSix || null,
  }

  return normalized
}

function computeProgress(totalItems: number, processedItems: number): number {
  if (totalItems <= 0) return 100
  const pct = Math.floor((processedItems / totalItems) * 100)
  return Math.max(1, Math.min(100, pct))
}

export async function createTradeImportJob(params: {
  internalUserId: string
  accountId: string
  trades: any[]
}) {
  const model = (prisma as any).importJob
  const payload: TradeImportPayload = {
    accountId: params.accountId,
    trades: params.trades || [],
  }

  const payloadBytes = Buffer.from(JSON.stringify(payload), 'utf-8')

  const job = await model.create({
    data: {
      userId: params.internalUserId,
      status: 'queued',
      stage: 'queued',
      progress: 0,
      totalItems: payload.trades.length,
      processedItems: 0,
      importedCount: 0,
      skippedCount: 0,
      fileName: 'trade-import.json',
      fileSize: payloadBytes.byteLength,
      fileData: payloadBytes,
      state: DEFAULT_TRADE_IMPORT_STATE,
      cancelRequested: false,
    }
  })

  return serializeTradeImportJob(job)
}

export async function getTradeImportJobForUser(jobId: string, internalUserId: string) {
  const model = (prisma as any).importJob
  const job = await model.findFirst({
    where: { id: jobId, userId: internalUserId },
    select: {
      id: true,
      status: true,
      stage: true,
      progress: true,
      totalItems: true,
      processedItems: true,
      importedCount: true,
      skippedCount: true,
      cancelRequested: true,
      error: true,
      createdAt: true,
      updatedAt: true,
      startedAt: true,
      completedAt: true,
      state: true,
    }
  })

  return job ? serializeTradeImportJob(job) : null
}

export async function cancelTradeImportJob(jobId: string, internalUserId: string) {
  const model = (prisma as any).importJob
  const current = await model.findFirst({ where: { id: jobId, userId: internalUserId } })

  if (!current) {
    return { error: 'Import job not found', status: 404 as const }
  }

  if (current.status === 'completed' || current.status === 'failed' || current.status === 'cancelled') {
    return { job: serializeTradeImportJob(current), status: 200 as const }
  }

  const updated = await model.update({
    where: { id: current.id },
    data: current.status === 'queued'
      ? {
          cancelRequested: true,
          status: 'cancelled',
          stage: 'cancelled',
          completedAt: new Date(),
        }
      : {
          cancelRequested: true,
        }
  })

  return { job: serializeTradeImportJob(updated), status: 200 as const }
}

export async function processTradeImportJobChunk(jobId: string, internalUserId: string) {
  const model = (prisma as any).importJob

  const job = await model.findFirst({
    where: { id: jobId, userId: internalUserId },
    select: {
      id: true,
      userId: true,
      status: true,
      stage: true,
      progress: true,
      totalItems: true,
      processedItems: true,
      importedCount: true,
      skippedCount: true,
      cancelRequested: true,
      error: true,
      createdAt: true,
      updatedAt: true,
      startedAt: true,
      completedAt: true,
      state: true,
      fileData: true,
    }
  })

  if (!job) {
    return { error: 'Import job not found', status: 404 as const }
  }

  if (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') {
    return { job: serializeTradeImportJob(job), done: true, status: 200 as const }
  }

  if (job.cancelRequested) {
    const cancelled = await model.update({
      where: { id: job.id },
      data: { status: 'cancelled', stage: 'cancelled', completedAt: new Date() }
    })
    return { job: serializeTradeImportJob(cancelled), done: true, status: 200 as const }
  }

  try {
    const payload = parsePayload(job.fileData)
    let state = parseTradeImportState(job.state)

    if (job.status === 'queued') {
      await model.update({
        where: { id: job.id },
        data: {
          status: 'processing',
          stage: 'preparing',
          startedAt: new Date(),
          progress: 1,
        }
      })
    }

    if (!state.accountType) {
      const phaseAccount = await prisma.phaseAccount.findFirst({
        where: {
          id: payload.accountId,
          MasterAccount: { userId: internalUserId }
        },
        include: {
          MasterAccount: {
            select: {
              id: true,
              accountName: true,
              propFirmName: true,
              evaluationType: true,
              status: true,
            }
          }
        }
      })

      if (phaseAccount) {
        if (!phaseAccount.phaseId) {
          throw new Error('Current phase has no phase ID. Set phase ID before importing trades.')
        }

        state.accountType = 'prop-firm'
        state.phaseAccountId = phaseAccount.id
        state.accountNumber = phaseAccount.phaseId
        state.accountName = phaseAccount.MasterAccount.accountName
        state.propFirmName = phaseAccount.MasterAccount.propFirmName
        state.evaluationType = phaseAccount.MasterAccount.evaluationType
        state.phaseNumber = phaseAccount.phaseNumber
        state.masterAccountId = phaseAccount.MasterAccount.id
      } else {
        const account = await prisma.account.findFirst({
          where: { id: payload.accountId, userId: internalUserId },
          select: { id: true, number: true, name: true }
        })

        if (!account) {
          throw new Error('Target account not found')
        }

        state.accountType = 'live'
        state.regularAccountId = account.id
        state.accountNumber = account.number
        state.accountName = account.name || account.number
      }
    }

    const totalItems = payload.trades.length
    const endIndex = Math.min(totalItems, state.index + TRADE_IMPORT_CHUNK_SIZE)
    const chunk = payload.trades.slice(state.index, endIndex)

    const preparedRows = chunk
      .map((trade) => normalizeTrade(trade, internalUserId, state.accountNumber || ''))
      .filter(Boolean)
      .map((trade: any) => ({
        ...trade,
        accountId: state.accountType === 'live' ? state.regularAccountId || null : null,
        phaseAccountId: state.accountType === 'prop-firm' ? state.phaseAccountId || null : null,
      }))

    let inserted = 0
    if (preparedRows.length > 0) {
      const createManyResult = await prisma.trade.createMany({
        data: preparedRows,
        skipDuplicates: true,
      })
      inserted = createManyResult.count
    }

    state.imported += inserted
    state.skipped += chunk.length - inserted
    state.index = endIndex

    if (state.index >= totalItems) {
      if (state.accountType === 'prop-firm' && state.masterAccountId && state.phaseAccountId) {
        try {
          const evaluation = await PhaseEvaluationEngine.evaluatePhase(state.masterAccountId, state.phaseAccountId)
          const status = evaluation.isFailed
            ? 'failed'
            : evaluation.isPassed && evaluation.canAdvance
              ? 'ready_for_transition'
              : 'active'

          state.evaluation = {
            isFailed: evaluation.isFailed,
            isPassed: evaluation.isPassed,
            canAdvance: evaluation.canAdvance,
            status,
            message:
              evaluation.isFailed
                ? (evaluation.drawdown.breachType ? `Failed: ${evaluation.drawdown.breachType}` : 'Phase rules breached')
                : evaluation.isPassed && evaluation.canAdvance
                  ? 'Profit target reached. Ready to transition to the next phase.'
                  : 'Evaluation completed',
            currentPhaseNumber: state.phaseNumber,
            profitTargetProgress: evaluation.progress.profitTargetPercent,
            currentPnL: evaluation.progress.currentPnL,
            evaluationType: state.evaluationType,
            propFirmName: state.propFirmName,
          }
        } catch {
          // Keep import completion successful even if evaluation fails
        }
      }

      const completed = await model.update({
        where: { id: job.id },
        data: {
          status: 'completed',
          stage: 'completed',
          progress: 100,
          processedItems: totalItems,
          importedCount: state.imported,
          skippedCount: state.skipped,
          state,
          completedAt: new Date(),
        }
      })

      return { job: serializeTradeImportJob(completed), done: true, status: 200 as const }
    }

    const processedItems = state.index
    const processing = await model.update({
      where: { id: job.id },
      data: {
        status: 'processing',
        stage: 'trades-import',
        progress: computeProgress(totalItems, processedItems),
        processedItems,
        importedCount: state.imported,
        skippedCount: state.skipped,
        state,
      }
    })

    return { job: serializeTradeImportJob(processing), done: false, status: 200 as const }
  } catch (error) {
    const failed = await model.update({
      where: { id: job.id },
      data: {
        status: 'failed',
        stage: 'failed',
        error: error instanceof Error ? error.message.slice(0, 2000) : 'Trade import failed',
        completedAt: new Date(),
      }
    })

    return { job: serializeTradeImportJob(failed), done: true, status: 200 as const }
  }
}
