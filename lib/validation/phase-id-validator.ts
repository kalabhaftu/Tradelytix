/**
 * Internal Phase ID Validation System
 * Prevents duplicate phase IDs within a user's active accounts
 */

import { db } from '@/lib/db/client'
import { PhaseAccount } from '@/lib/db/schema'
import { eq, and, inArray } from 'drizzle-orm'

export interface PhaseIdValidationResult {
  isValid: boolean
  error?: string
  conflictingAccount?: {
    id: string
    accountName: string
    phaseNumber: number
  }
}

/**
 * Validates that a phase ID is not already in use by the user's active phases
 * This prevents accidental linking of trades to wrong accounts
 */
export async function validatePhaseId(
  userId: string,
  phaseId: string,
  excludeAccountId?: string
): Promise<PhaseIdValidationResult> {
  

  try {
    // Trim and normalize the phase ID
    const normalizedPhaseId = phaseId.trim()
    
    if (!normalizedPhaseId) {
      return {
        isValid: false,
        error: 'Phase ID cannot be empty'
      }
    }

    // Check for existing phase accounts with this ID
    const existingPhaseAccountsRaw = await db.query.PhaseAccount.findMany({
      where: and(
        eq(PhaseAccount.phaseId, normalizedPhaseId),
        inArray(PhaseAccount.status, ['active', 'pending'])
      ),
      with: {
        MasterAccount: {
          columns: {
            id: true,
            accountName: true,
            status: true,
            userId: true
          }
        }
      }
    })

    const existingPhaseAccount = existingPhaseAccountsRaw.find(p => 
      p.MasterAccount?.userId === userId && 
      p.MasterAccount?.status !== 'failed' && 
      (!excludeAccountId || p.MasterAccount?.id !== excludeAccountId)
    )

    if (existingPhaseAccount) {

      return {
        isValid: false,
        error: `Phase ID "${normalizedPhaseId}" is already in use`,
        conflictingAccount: {
          id: existingPhaseAccount.MasterAccount!.id,
          accountName: existingPhaseAccount.MasterAccount!.accountName,
          phaseNumber: existingPhaseAccount.phaseNumber as number
        }
      }
    }


    return {
      isValid: true
    }

  } catch (error) {
    
    return {
      isValid: false,
      error: 'Failed to validate phase ID'
    }
  }
}

/**
 * Validates multiple phase IDs at once (for account creation with multiple phases)
 */
async function validateMultiplePhaseIds(
  userId: string,
  phaseIds: { phaseNumber: number; phaseId: string }[],
  excludeAccountId?: string
): Promise<{ [key: number]: PhaseIdValidationResult }> {
  
  const results: { [key: number]: PhaseIdValidationResult } = {}
  
  // Check for duplicates within the provided IDs
  const providedIds = new Set<string>()
  const duplicatesWithinSet = new Set<string>()
  
  for (const { phaseNumber, phaseId } of phaseIds) {
    const normalizedId = phaseId.trim()
    if (providedIds.has(normalizedId)) {
      duplicatesWithinSet.add(normalizedId)
    }
    providedIds.add(normalizedId)
  }
  
  // Validate each phase ID
  for (const { phaseNumber, phaseId } of phaseIds) {
    const normalizedId = phaseId.trim()
    
    // Check for duplicates within the provided set first
    if (duplicatesWithinSet.has(normalizedId)) {
      results[phaseNumber] = {
        isValid: false,
        error: `Duplicate phase ID "${normalizedId}" provided in request`
      }
      continue
    }
    
    // Validate against database
    results[phaseNumber] = await validatePhaseId(userId, normalizedId, excludeAccountId)
  }
  
  return results
}

