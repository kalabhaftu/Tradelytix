import JSZip from 'jszip'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/server/auth'

const TRADE_CHUNK_SIZE = 25
const BACKTEST_CHUNK_SIZE = 25

export type ImportJobStage = 'queued' | 'preparing' | 'trades' | 'backtests' | 'completed' | 'failed' | 'cancelled'

interface ImportJobState {
  phase: 'preparing' | 'trades' | 'backtests' | 'completed'
  tradeIndex: number
  backtestIndex: number
  imported: number
  skipped: number
}

const DEFAULT_JOB_STATE: ImportJobState = {
  phase: 'preparing',
  tradeIndex: 0,
  backtestIndex: 0,
  imported: 0,
  skipped: 0,
}

function parseJobState(state: unknown): ImportJobState {
  if (!state || typeof state !== 'object') return { ...DEFAULT_JOB_STATE }

  const obj = state as Partial<ImportJobState>
  return {
    phase: obj.phase ?? 'preparing',
    tradeIndex: Number.isFinite(obj.tradeIndex) ? Number(obj.tradeIndex) : 0,
    backtestIndex: Number.isFinite(obj.backtestIndex) ? Number(obj.backtestIndex) : 0,
    imported: Number.isFinite(obj.imported) ? Number(obj.imported) : 0,
    skipped: Number.isFinite(obj.skipped) ? Number(obj.skipped) : 0,
  }
}

function toBuffer(data: unknown): Buffer {
  if (Buffer.isBuffer(data)) return data
  if (data instanceof Uint8Array) return Buffer.from(data)
  if (Array.isArray(data)) return Buffer.from(data)
  throw new Error('Invalid import file data')
}

function findImageFile(zipFiles: { [key: string]: JSZip.JSZipObject }, folder: string, id: string, suffix: string) {
  const extensions = ['png', 'jpg', 'jpeg', 'webp', 'gif']
  for (const ext of extensions) {
    const path = `images/${folder}/${id}_${suffix}.${ext}`
    if (zipFiles[path]) return { file: zipFiles[path], ext }
  }
  return null
}

function computeProcessingProgress(totalItems: number, processedItems: number): number {
  if (totalItems <= 0) return 95
  const clamped = Math.max(0, Math.min(processedItems, totalItems))
  return Math.min(95, 10 + Math.floor((clamped / totalItems) * 85))
}

async function uploadImage(
  zip: JSZip,
  internalUserId: string,
  supabase: Awaited<ReturnType<typeof createClient>>,
  zipFolder: string,
  originalId: string,
  suffix: string,
  newId: string,
) {
  const result = findImageFile(zip.files, zipFolder, originalId, suffix)
  if (!result) return null

  const buffer = await result.file.async('arraybuffer')
  const path = `trades/${internalUserId}/${newId}/${suffix}.${result.ext}`

  const { data: uploadData, error } = await supabase.storage
    .from('trade-images')
    .upload(path, buffer, {
      contentType: `image/${result.ext}`,
      upsert: true,
    })

  if (error || !uploadData) return null

  const {
    data: { publicUrl },
  } = supabase.storage.from('trade-images').getPublicUrl(path)

  return publicUrl
}

async function uploadTradeImages(
  zip: JSZip,
  internalUserId: string,
  supabase: Awaited<ReturnType<typeof createClient>>,
  trade: any,
  newId: string,
) {
  const suffixes = ['1', '2', '3', '4', '5', '6', 'preview']
  const results: Record<string, string> = {}

  for (const suffix of suffixes) {
    const field =
      suffix === 'preview'
        ? 'cardPreviewImage'
        : `image${['One', 'Two', 'Three', 'Four', 'Five', 'Six'][parseInt(suffix, 10) - 1]}`

    const url = await uploadImage(
      zip,
      internalUserId,
      supabase,
      'trades',
      trade.originalId || trade.id,
      suffix,
      newId,
    )

    if (url) results[field] = url
  }

  return results
}

async function uploadBacktestImages(
  zip: JSZip,
  internalUserId: string,
  supabase: Awaited<ReturnType<typeof createClient>>,
  backtestTrade: any,
  newId: string,
) {
  const suffixes = ['1', '2', '3', '4', '5', '6', 'preview']
  const results: Record<string, string> = {}

  for (const suffix of suffixes) {
    const field =
      suffix === 'preview'
        ? 'cardPreviewImage'
        : `image${['One', 'Two', 'Three', 'Four', 'Five', 'Six'][parseInt(suffix, 10) - 1]}`

    const url = await uploadImage(
      zip,
      internalUserId,
      supabase,
      'backtest',
      backtestTrade.id,
      suffix,
      newId,
    )

    if (url) results[field] = url
  }

  return results
}

async function resolveLookupMaps(data: any, internalUserId: string) {
  const accountNumbers: string[] = Array.from(
    new Set((data.accounts || []).map((account: any) => account.number).filter(Boolean)),
  )

  const modelNames: string[] = Array.from(
    new Set((data.tradingModels || []).map((model: any) => model.name).filter(Boolean)),
  )

  const phaseIds: string[] = Array.from(
    new Set(
      (data.masterAccounts || [])
        .flatMap((master: any) => master?.PhaseAccount || [])
        .map((phase: any) => phase?.phaseId)
        .filter((phaseId: any) => typeof phaseId === 'string' && phaseId.trim().length > 0),
    ),
  )

  const [accounts, models, phaseAccounts] = await Promise.all([
    accountNumbers.length
      ? prisma.account.findMany({
          where: { userId: internalUserId, number: { in: accountNumbers } },
          select: { id: true, number: true },
        })
      : [],
    modelNames.length
      ? prisma.tradingModel.findMany({
          where: { userId: internalUserId, name: { in: modelNames } },
          select: { id: true, name: true },
        })
      : [],
    phaseIds.length
      ? prisma.phaseAccount.findMany({
          where: {
            phaseId: { in: phaseIds },
            MasterAccount: { userId: internalUserId },
          },
          select: { id: true, phaseId: true },
        })
      : [],
  ])

  const accountMap = new Map<string, string>()
  accounts.forEach((account) => accountMap.set(account.number, account.id))

  const modelNameMap = new Map<string, string>()
  models.forEach((model) => modelNameMap.set(model.name, model.id))

  const phaseMap = new Map<string, string>()
  phaseAccounts.forEach((phase) => {
    if (phase.phaseId) {
      phaseMap.set(phase.phaseId, phase.id)
    }
  })

  return { accountMap, modelNameMap, phaseMap }
}

async function runPreparation(data: any, internalUserId: string) {
  if (data.user) {
    const userUpdateData: any = {
      timezone: data.user.timezone,
      theme: data.user.theme,
      firstName: data.user.firstName,
      lastName: data.user.lastName,
      accountFilterSettings: data.user.accountFilterSettings,
      aiSettings: data.user.aiSettings,
      backtestInputMode: data.user.backtestInputMode,
      accentPack: data.user.accentPack,
      autoAdjustAccountDate: data.user.autoAdjustAccountDate,
      breakEvenThreshold: data.user.breakEvenThreshold,
      pnlDisplayMode: data.user.pnlDisplayMode,
    }

    await prisma.user.update({
      where: { id: internalUserId },
      data: userUpdateData,
    })
  }

  if (data.tradeTags) {
    for (const tag of data.tradeTags) {
      await prisma.tradeTag.upsert({
        where: { name_userId: { name: tag.name, userId: internalUserId } },
        update: { color: tag.color },
        create: {
          id: crypto.randomUUID(),
          userId: internalUserId,
          name: tag.name,
          color: tag.color,
          updatedAt: new Date(),
        },
      })
    }
  }

  if (data.tradingModels) {
    for (const model of data.tradingModels) {
      await prisma.tradingModel.upsert({
        where: { userId_name: { userId: internalUserId, name: model.name } },
        update: { rules: model.rules, notes: model.notes },
        create: {
          id: crypto.randomUUID(),
          userId: internalUserId,
          name: model.name,
          rules: model.rules ?? [],
          notes: model.notes,
        },
      })
    }
  }

  if (data.dashboardTemplates) {
    for (const template of data.dashboardTemplates) {
      await prisma.dashboardTemplate.upsert({
        where: { userId_name: { userId: internalUserId, name: template.name } },
        update: { layout: template.layout, isActive: template.isActive, isDefault: template.isDefault },
        create: {
          id: crypto.randomUUID(),
          userId: internalUserId,
          name: template.name,
          layout: template.layout,
          isActive: template.isActive,
          isDefault: template.isDefault,
          updatedAt: new Date(),
        },
      })
    }
  }

  const accountMap = new Map<string, string>()
  if (data.accounts) {
    for (const account of data.accounts) {
      const target = await prisma.account.upsert({
        where: { number_userId: { number: account.number, userId: internalUserId } },
        update: {
          name: account.name,
          broker: account.broker,
          startingBalance: account.startingBalance,
          isArchived: account.isArchived,
        },
        create: {
          id: crypto.randomUUID(),
          userId: internalUserId,
          number: account.number,
          name: account.name,
          broker: account.broker,
          startingBalance: account.startingBalance || 0,
          isArchived: account.isArchived || false,
        },
      })

      accountMap.set(account.number, target.id)
    }
  }

  const phaseMap = new Map<string, string>()
  const masterMap = new Map<string, string>()

  if (data.masterAccounts) {
    for (const masterAccount of data.masterAccounts) {
      const targetMasterAccount = await prisma.masterAccount.upsert({
        where: { userId_accountName: { userId: internalUserId, accountName: masterAccount.accountName } },
        update: {
          propFirmName: masterAccount.propFirmName,
          accountSize: masterAccount.accountSize,
          evaluationType: masterAccount.evaluationType,
          currentPhase: masterAccount.currentPhase,
          status: masterAccount.status,
          isArchived: masterAccount.isArchived,
        },
        create: {
          id: crypto.randomUUID(),
          userId: internalUserId,
          accountName: masterAccount.accountName,
          propFirmName: masterAccount.propFirmName,
          accountSize: masterAccount.accountSize,
          evaluationType: masterAccount.evaluationType,
          currentPhase: masterAccount.currentPhase,
          status: masterAccount.status,
          isArchived: masterAccount.isArchived,
        },
      })

      masterMap.set(masterAccount.accountName, targetMasterAccount.id)

      if (masterAccount.PhaseAccount) {
        for (const phase of masterAccount.PhaseAccount) {
          const targetPhase = await prisma.phaseAccount.upsert({
            where: {
              masterAccountId_phaseNumber: {
                masterAccountId: targetMasterAccount.id,
                phaseNumber: phase.phaseNumber,
              },
            },
            update: {
              phaseId: phase.phaseId,
              status: phase.status,
              profitTargetPercent: phase.profitTargetPercent,
              dailyDrawdownPercent: phase.dailyDrawdownPercent,
              maxDrawdownPercent: phase.maxDrawdownPercent,
              startDate: phase.startDate ? new Date(phase.startDate) : undefined,
            },
            create: {
              id: crypto.randomUUID(),
              masterAccountId: targetMasterAccount.id,
              phaseNumber: phase.phaseNumber,
              phaseId: phase.phaseId,
              profitTargetPercent: phase.profitTargetPercent,
              dailyDrawdownPercent: phase.dailyDrawdownPercent,
              maxDrawdownPercent: phase.maxDrawdownPercent,
              status: phase.status,
              startDate: phase.startDate ? new Date(phase.startDate) : undefined,
            },
          })

          if (phase.phaseId) {
            phaseMap.set(phase.phaseId, targetPhase.id)
          }
        }
      }
    }
  }

  if (data.liveAccountTransactions) {
    for (const transaction of data.liveAccountTransactions) {
      const targetAccountId = accountMap.get(transaction.accountNumber)
      if (!targetAccountId) continue

      const existing = await prisma.liveAccountTransaction.findFirst({
        where: {
          accountId: targetAccountId,
          amount: transaction.amount,
          createdAt: new Date(transaction.createdAt),
        },
      })

      if (!existing) {
        await prisma.liveAccountTransaction.create({
          data: {
            id: crypto.randomUUID(),
            accountId: targetAccountId,
            userId: internalUserId,
            type: transaction.type,
            amount: transaction.amount,
            description: transaction.description,
            createdAt: new Date(transaction.createdAt),
          },
        })
      }
    }
  }

  if (data.breachRecords) {
    for (const breachRecord of data.breachRecords) {
      const targetPhaseId = phaseMap.get(breachRecord.phaseId)
      if (!targetPhaseId) continue

      const existing = await prisma.breachRecord.findFirst({
        where: {
          phaseAccountId: targetPhaseId,
          breachType: breachRecord.breachType,
          breachTime: new Date(breachRecord.breachTime),
        },
      })

      if (!existing) {
        await prisma.breachRecord.create({
          data: {
            id: crypto.randomUUID(),
            phaseAccountId: targetPhaseId,
            breachType: breachRecord.breachType,
            breachAmount: breachRecord.breachAmount,
            breachTime: new Date(breachRecord.breachTime),
            currentEquity: breachRecord.currentEquity,
            accountSize: breachRecord.accountSize,
            dailyStartBalance: breachRecord.dailyStartBalance,
            highWaterMark: breachRecord.highWaterMark,
            notes: breachRecord.notes,
          },
        })
      }
    }
  }

  if (data.dailyAnchors) {
    for (const anchor of data.dailyAnchors) {
      const targetPhaseId = phaseMap.get(anchor.phaseId)
      if (!targetPhaseId) continue

      await prisma.dailyAnchor.upsert({
        where: {
          phaseAccountId_date: {
            phaseAccountId: targetPhaseId,
            date: new Date(anchor.date),
          },
        },
        update: { anchorEquity: anchor.anchorEquity },
        create: {
          id: crypto.randomUUID(),
          phaseAccountId: targetPhaseId,
          date: new Date(anchor.date),
          anchorEquity: anchor.anchorEquity,
        },
      })
    }
  }

  if (data.payouts) {
    for (const payout of data.payouts) {
      const targetMasterId = masterMap.get(payout.accountName)
      const targetPhaseId = payout.phaseId ? phaseMap.get(payout.phaseId) : null
      if (!targetMasterId || !targetPhaseId) continue

      const existing = await prisma.payout.findFirst({
        where: {
          masterAccountId: targetMasterId,
          phaseAccountId: targetPhaseId,
          amount: payout.amount,
          requestDate: new Date(payout.requestDate),
        },
      })

      if (!existing) {
        await prisma.payout.create({
          data: {
            id: crypto.randomUUID(),
            masterAccountId: targetMasterId,
            phaseAccountId: targetPhaseId,
            amount: payout.amount,
            status: payout.status,
            requestDate: new Date(payout.requestDate),
            approvedDate: payout.approvedDate ? new Date(payout.approvedDate) : null,
            paidDate: payout.paidDate ? new Date(payout.paidDate) : null,
            rejectedDate: payout.rejectedDate ? new Date(payout.rejectedDate) : null,
            notes: payout.notes,
            rejectionReason: payout.rejectionReason,
          },
        })
      }
    }
  }
}

async function updateJob(jobId: string, data: Record<string, any>) {
  const model = (prisma as any).importJob
  return model.update({
    where: { id: jobId },
    data,
  })
}

export function serializeImportJob(job: any) {
  if (!job) return null

  return {
    id: job.id,
    status: job.status,
    stage: job.stage,
    progress: job.progress,
    totalItems: job.totalItems,
    processedItems: job.processedItems,
    importedCount: job.importedCount,
    skippedCount: job.skippedCount,
    fileName: job.fileName,
    fileSize: job.fileSize,
    cancelRequested: job.cancelRequested,
    error: job.error,
    startedAt: job.startedAt,
    completedAt: job.completedAt,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
  }
}

export async function getImportJobForUser(jobId: string, internalUserId: string) {
  const model = (prisma as any).importJob
  return model.findFirst({
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
      fileName: true,
      fileSize: true,
      cancelRequested: true,
      error: true,
      startedAt: true,
      completedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  })
}

export async function createImportJob(params: {
  internalUserId: string
  fileName: string
  fileSize: number
  fileData: ArrayBuffer
}) {
  const model = (prisma as any).importJob

  const job = await model.create({
    data: {
      userId: params.internalUserId,
      status: 'queued',
      stage: 'queued',
      progress: 0,
      fileName: params.fileName,
      fileSize: params.fileSize,
      fileData: Buffer.from(params.fileData),
      totalItems: 0,
      processedItems: 0,
      importedCount: 0,
      skippedCount: 0,
      state: DEFAULT_JOB_STATE,
      cancelRequested: false,
    },
  })

  return serializeImportJob(job)
}

export async function cancelImportJob(jobId: string, internalUserId: string) {
  const model = (prisma as any).importJob
  const current = await model.findFirst({
    where: { id: jobId, userId: internalUserId },
  })

  if (!current) {
    return { error: 'Import job not found', status: 404 as const }
  }

  if (current.status === 'completed' || current.status === 'failed' || current.status === 'cancelled') {
    return { job: serializeImportJob(current), status: 200 as const }
  }

  const cancelledImmediately = current.status === 'queued'

  const updated = await model.update({
    where: { id: current.id },
    data: cancelledImmediately
      ? {
          cancelRequested: true,
          status: 'cancelled',
          stage: 'cancelled',
          progress: current.progress,
          completedAt: new Date(),
        }
      : {
          cancelRequested: true,
        },
  })

  return { job: serializeImportJob(updated), status: 200 as const }
}

export async function processImportJobChunk(jobId: string, internalUserId: string) {
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
      fileName: true,
      fileData: true,
      state: true,
      cancelRequested: true,
      startedAt: true,
      completedAt: true,
      createdAt: true,
      updatedAt: true,
      fileSize: true,
      error: true,
    },
  })

  if (!job) {
    return { error: 'Import job not found', status: 404 as const }
  }

  if (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') {
    return { job: serializeImportJob(job), done: true, status: 200 as const }
  }

  if (job.cancelRequested) {
    const cancelled = await updateJob(job.id, {
      status: 'cancelled',
      stage: 'cancelled',
      completedAt: new Date(),
    })

    return { job: serializeImportJob(cancelled), done: true, status: 200 as const }
  }

  try {
    const zip = await JSZip.loadAsync(toBuffer(job.fileData))
    const manifestFile = zip.file('data.json')

    if (!manifestFile) {
      const failed = await updateJob(job.id, {
        status: 'failed',
        stage: 'failed',
        error: 'Invalid export file (missing data.json)',
        completedAt: new Date(),
      })
      return { job: serializeImportJob(failed), done: true, status: 200 as const }
    }

    const manifestContent = await manifestFile.async('string')
    const data = JSON.parse(manifestContent)

    const totalItems = (data.trades?.length || 0) + (data.backtestTrades?.length || 0)
    let state = parseJobState(job.state)

    if (job.status === 'queued') {
      await updateJob(job.id, {
        status: 'processing',
        stage: 'preparing',
        progress: 1,
        totalItems,
        startedAt: new Date(),
      })
    }

    if (state.phase === 'preparing') {
      await runPreparation(data, internalUserId)

      state.phase = 'trades'

      await updateJob(job.id, {
        status: 'processing',
        stage: 'trades',
        progress: totalItems > 0 ? 10 : 95,
        totalItems,
        processedItems: 0,
        importedCount: state.imported,
        skippedCount: state.skipped,
        state,
      })
    }

    const { accountMap, modelNameMap, phaseMap } = await resolveLookupMaps(data, internalUserId)
    const supabase = await createClient()

    if (state.phase === 'trades') {
      const trades = data.trades || []
      const endIndex = Math.min(trades.length, state.tradeIndex + TRADE_CHUNK_SIZE)

      for (let index = state.tradeIndex; index < endIndex; index++) {
        const trade = trades[index]

        const existing = await prisma.trade.findFirst({
          where: {
            userId: internalUserId,
            accountNumber: trade.accountNumber,
            instrument: trade.instrument,
            entryDate: trade.entryDate,
            entryPrice: trade.entryPrice,
            side: trade.side,
            quantity: parseFloat(trade.quantity || 0),
          },
        })

        if (existing) {
          state.skipped += 1
          continue
        }

        const newId = crypto.randomUUID()
        const images = await uploadTradeImages(zip, internalUserId, supabase, trade, newId)

        const accountId = accountMap.get(trade.accountNumber) || null
        const phaseAccountId = phaseMap.get(trade.phaseId || trade.accountNumber) || null
        const modelId = trade.modelName ? modelNameMap.get(trade.modelName) : null

        const { id, userId, originalId, modelName, ...rest } = trade

        await prisma.trade.create({
          data: {
            ...rest,
            ...images,
            id: newId,
            userId: internalUserId,
            accountId,
            phaseAccountId,
            modelId,
            quantity: parseFloat(trade.quantity || 0),
            pnl: parseFloat(trade.pnl || 0),
          },
        })

        state.imported += 1
      }

      state.tradeIndex = endIndex
      if (state.tradeIndex >= trades.length) {
        state.phase = 'backtests'
      }
    }

    if (state.phase === 'backtests') {
      const backtests = data.backtestTrades || []
      const endIndex = Math.min(backtests.length, state.backtestIndex + BACKTEST_CHUNK_SIZE)

      for (let index = state.backtestIndex; index < endIndex; index++) {
        const backtestTrade = backtests[index]

        const existing = await prisma.backtestTrade.findFirst({
          where: {
            userId: internalUserId,
            pair: backtestTrade.pair,
            dateExecuted: backtestTrade.dateExecuted,
            entryPrice: backtestTrade.entryPrice,
            direction: backtestTrade.direction,
          },
        })

        if (existing) {
          state.skipped += 1
          continue
        }

        const newId = crypto.randomUUID()
        const images = await uploadBacktestImages(zip, internalUserId, supabase, backtestTrade, newId)
        const { id, userId, ...rest } = backtestTrade

        await prisma.backtestTrade.create({
          data: {
            ...rest,
            ...images,
            userId: internalUserId,
            id: newId,
          },
        })

        state.imported += 1
      }

      state.backtestIndex = endIndex
      if (state.backtestIndex >= backtests.length) {
        state.phase = 'completed'
      }
    }

    const processedItems = state.tradeIndex + state.backtestIndex

    if (state.phase === 'completed') {
      const completed = await updateJob(job.id, {
        status: 'completed',
        stage: 'completed',
        progress: 100,
        processedItems,
        importedCount: state.imported,
        skippedCount: state.skipped,
        state,
        completedAt: new Date(),
      })

      return { job: serializeImportJob(completed), done: true, status: 200 as const }
    }

    const processing = await updateJob(job.id, {
      status: 'processing',
      stage: state.phase,
      progress: computeProcessingProgress(totalItems, processedItems),
      totalItems,
      processedItems,
      importedCount: state.imported,
      skippedCount: state.skipped,
      state,
    })

    return {
      job: serializeImportJob(processing),
      done: false,
      status: 200 as const,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Import processing failed'
    const failed = await updateJob(job.id, {
      status: 'failed',
      stage: 'failed',
      error: message.slice(0, 2000),
      completedAt: new Date(),
    })

    return { job: serializeImportJob(failed), done: true, status: 200 as const }
  }
}
