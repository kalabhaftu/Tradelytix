'use server'

import { prisma } from '@/lib/prisma'
import { getUserId } from './auth-utils'
import { cloneDefaultTemplateLayout } from '@/lib/dashboard/default-template-layout'
import { logger } from '@/lib/logger'

export async function ensureDefaultTemplate() {
  try {
    const userId = await getUserId()
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    })

    if (!userExists) return

    await prisma.$transaction(async (tx) => {
      const activeTemplate = await tx.dashboardTemplate.findFirst({
        where: { userId, isActive: true },
        select: { id: true },
      })

      if (activeTemplate) return

      const defaultTemplate = await tx.dashboardTemplate.findFirst({
        where: { userId, isDefault: true },
        select: { id: true },
      })

      if (defaultTemplate) {
        await tx.dashboardTemplate.update({
          where: { id: defaultTemplate.id },
          data: { isActive: true },
        })
        return
      }

      const firstTemplate = await tx.dashboardTemplate.findFirst({
        where: { userId },
        orderBy: { createdAt: 'asc' },
        select: { id: true },
      })

      if (firstTemplate) {
        await tx.dashboardTemplate.update({
          where: { id: firstTemplate.id },
          data: { isActive: true },
        })
        return
      }

      await tx.dashboardTemplate.create({
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
    })
  } catch (error: any) {
    if (error?.code === 'P2002') return
    logger.warn('Default dashboard template initialization failed', { error: error?.message }, 'server')
  }
}
