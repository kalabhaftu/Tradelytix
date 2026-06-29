import { db } from '@/lib/db/client'
import { PhaseAccount, MasterAccount, BreachRecord } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { PhaseEvaluationEngine } from '@/lib/prop-firm/phase-evaluation-engine'

/**
 * Phase Service
 * Handles bulk evaluation and management of prop firm phase accounts.
 */

export async function evaluateAllActivePhases() {
  const results = {
    totalPhases: 0,
    evaluated: 0,
    failed: 0,
    passed: 0,
    errors: [] as string[]
  }

  try {
    const activePhasesRaw = await db.query.PhaseAccount.findMany({
      where: eq(PhaseAccount.status, 'active'),
      with: {
        MasterAccount: {
          columns: {
            id: true,
            accountName: true,
            status: true
          }
        }
      }
    })
    
    // Filter to those whose MasterAccount is also active
    const activePhases = activePhasesRaw.filter(p => p.MasterAccount?.status === 'active')

    results.totalPhases = activePhases.length

    // Evaluate each active phase
    for (const phase of activePhases) {
      try {
        const evaluation = await PhaseEvaluationEngine.evaluatePhase(
          phase.masterAccountId,
          phase.id
        )

        results.evaluated++

        // If account failed, mark phase and master account as failed, and record breach
        if (evaluation.isFailed) {
          await db.transaction(async (tx) => {
            await tx.update(PhaseAccount)
              .set({
                status: 'failed',
                endDate: new Date()
              })
              .where(eq(PhaseAccount.id, phase.id))

            await tx.update(MasterAccount)
              .set({ status: 'failed' })
              .where(eq(MasterAccount.id, phase.masterAccountId))

            await tx.insert(BreachRecord).values({
              id: crypto.randomUUID(),
              phaseAccountId: phase.id,
              breachType: evaluation.drawdown.breachType || 'max_drawdown',
              breachAmount: evaluation.drawdown.breachAmount || 0,
              breachTime: new Date(),
              currentEquity: evaluation.drawdown.currentEquity,
              accountSize: evaluation.drawdown.dailyStartBalance || 0,
              dailyStartBalance: evaluation.drawdown.dailyStartBalance,
              highWaterMark: evaluation.drawdown.highWaterMark,
              notes: `Auto-detected breach during background evaluation. ${evaluation.drawdown.breachType?.replace('_', ' ')} exceeded by $${evaluation.drawdown.breachAmount?.toFixed(2)}`,
              updatedAt: new Date()
            })
          })

          results.failed++
        }

        // If account passed (profit target met)
        if (evaluation.isPassed && !evaluation.isFailed) {
          results.passed++
        }

      } catch (error) {
        const errorMsg = `Phase ${phase.id} (${phase.MasterAccount.accountName}): evaluation failed`
        results.errors.push(errorMsg)
      }
    }
  } catch (err) {
    results.errors.push(`General Evaluation Error: ${err instanceof Error ? err.message : 'unknown error'}`)
  }

  return results
}
