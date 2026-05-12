'use server'

import { prisma } from '@/lib/prisma'
import { getUserIdSafe } from '@/server/auth'
import { ImageCompressor } from '@/lib/image-compression'
import { deletePublicStorageUrls } from '@/server/storage-admin'

/**
 * Delete a trade by ID
 */
export async function deleteTrade(tradeId: string) {
  try {
    const userId = await getUserIdSafe()
    
    if (!userId) {
      return {
        success: false,
        error: 'User not authenticated'
      }
    }

    // 1. Fetch the trade to get image URLs
    const trade = await prisma.trade.findUnique({
      where: {
        id: tradeId,
        userId: userId
      },
      select: {
        imageOne: true,
        imageTwo: true,
        imageThree: true,
        imageFour: true,
        imageFive: true,
        imageSix: true,
        cardPreviewImage: true
      }
    })

    if (trade) {
      // 2. Collect all non-null image URLs
      const imageUrls = [
        trade.imageOne,
        trade.imageTwo,
        trade.imageThree,
        trade.imageFour,
        trade.imageFive,
        trade.imageSix,
        trade.cardPreviewImage
      ].filter((url): url is string => !!url)

      // 3. Delete from storage if any URLs found
      if (imageUrls.length > 0) {
        try {
          await deletePublicStorageUrls(imageUrls)
        } catch (storageError) {
          console.error('[Delete Trade] Storage deletion failed:', storageError)
          // Continue with DB deletion even if storage fails
        }
      }
    }

    // 4. Delete the trade from database
    await prisma.trade.delete({
      where: {
        id: tradeId,
        userId: userId
      }
    })

    return {
      success: true,
      message: 'Trade deleted successfully'
    }
  } catch (error) {
    return {
      success: false,
      error: 'Failed to delete trade'
    }
  }
}

/**
 * Update trade image field (Supabase storage URL)
 */
export async function updateTradeImage(
  tradeIds: string[],
  imageUrl: string | null,
  fieldName: 'cardPreviewImage' | 'imageOne' | 'imageTwo' | 'imageThree' | 'imageFour' | 'imageFive' | 'imageSix'
) {
  try {
    const userId = await getUserIdSafe()
    
    if (!userId) {
      throw new Error('User not authenticated')
    }

  let processedImage = imageUrl

    // Update all specified trades
    await prisma.trade.updateMany({
      where: {
        id: { in: tradeIds },
        userId: userId
      },
      data: {
        [fieldName]: processedImage
      }
    })

    return {
      success: true,
      message: 'Trade image updated successfully'
    }
  } catch (error) {
    throw error
  }
}

/**
 * Update a trade by ID
 */
export async function updateTradeAction(tradeId: string, data: any) {
  try {
    const userId = await getUserIdSafe()
    if (!userId) {
      throw new Error('User not authenticated')
    }

    const updated = await prisma.trade.update({
      where: {
        id: tradeId,
        userId: userId
      },
      data: data
    })

    return {
      success: true,
      data: JSON.parse(JSON.stringify(updated))
    }
  } catch (error) {
    console.error('[Update Trade Action] Error:', error)
    throw error
  }
}
