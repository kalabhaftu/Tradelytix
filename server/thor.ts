'use server'

import { revalidatePath } from 'next/cache'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { getResolvedUserIdentity } from '@/server/user-identity'

export async function generateThorToken() {
  try {
    const { internalUserId } = await getResolvedUserIdentity()

    if (!internalUserId) {
      throw new Error('Unauthorized')
    }

    // Generate a secure random token
    const token = crypto.randomBytes(32).toString('hex')
    
    // Update user with new token
    await prisma.user.update({
      where: {
        id: internalUserId
      },
      data: {
        thorToken: token
      }
    })

    revalidatePath('/dashboard')
    return { token }
  } catch (error) {
    console.error('Failed to generate Thor token:', error)
    return { error: 'Failed to generate token' }
  }
}

export async function getThorToken() {
  try {
    const { internalUserId } = await getResolvedUserIdentity()

    if (!internalUserId) {
      throw new Error('Unauthorized')
    }

    const userData = await prisma.user.findUnique({
      where: {
        id: internalUserId
      },
      select: {
        thorToken: true
      }
    })

    return { token: userData?.thorToken }
  } catch (error) {
    console.error('Failed to get Thor token:', error)
    return { error: 'Failed to get token' }
  }
}
