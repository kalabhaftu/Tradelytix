'use server'

import { prisma } from '@/lib/prisma'
import { getUserId } from './auth-utils'
import { cloneDefaultTemplateLayout } from '@/lib/dashboard/default-template-layout'

/**
 * Ensure the current user has a default template
 * Called on first dashboard load
 */
export async function ensureDefaultTemplate() {
  try {
    const userId = await getUserId()

    // Ensure user exists before creating template
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true }
    })

    if (!userExists) {
      return // User doesn't exist yet, skip template creation
    }

    // Check if user has any templates
    const existingTemplates = await prisma.dashboardTemplate.findMany({
      where: { userId },
    })

    if (existingTemplates.length === 0) {
      // Create default template
      await prisma.dashboardTemplate.create({
        data: {
          id: crypto.randomUUID(),
          updatedAt: new Date(),
          userId,
          name: 'Default',
          isDefault: true,
          isActive: true,
          layout: cloneDefaultTemplateLayout() as any,
        },
      })
    } else {
      // Ensure there's an active template
      const hasActive = existingTemplates.some(t => t.isActive)
      if (!hasActive) {
        const defaultTemplate = existingTemplates.find(t => t.isDefault) || existingTemplates[0]
        await prisma.dashboardTemplate.update({
          where: { id: defaultTemplate.id },
          data: { isActive: true },
        })
      }
    }
  } catch (error) {
    // Template creation failed, continue without it
  }
}
