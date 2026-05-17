'use server'

import { prisma } from '@/lib/prisma'
import { getUserId } from './auth-utils'
import { cloneDefaultTemplateLayout } from '@/lib/dashboard/default-template-layout'
import { logger } from '@/lib/logger'

type PrismaClientLike = typeof prisma

export async function ensureActiveTemplateForUser(userId: string, client: PrismaClientLike = prisma) {
  return client.$transaction(async (tx) => {
    const activeTemplate = await tx.dashboardTemplate.findFirst({
      where: { userId, isActive: true },
      select: {
        id: true,
        userId: true,
        name: true,
        isDefault: true,
        isActive: true,
        layout: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (activeTemplate) return activeTemplate

    const defaultTemplate = await tx.dashboardTemplate.findFirst({
      where: { userId, isDefault: true },
      select: {
        id: true,
        userId: true,
        name: true,
        isDefault: true,
        isActive: true,
        layout: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (defaultTemplate) {
      return tx.dashboardTemplate.update({
        where: { id: defaultTemplate.id },
        data: { isActive: true },
        select: {
          id: true,
          userId: true,
          name: true,
          isDefault: true,
          isActive: true,
          layout: true,
          createdAt: true,
          updatedAt: true,
        },
      })
    }

    const firstTemplate = await tx.dashboardTemplate.findFirst({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        userId: true,
        name: true,
        isDefault: true,
        isActive: true,
        layout: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (firstTemplate) {
      return tx.dashboardTemplate.update({
        where: { id: firstTemplate.id },
        data: { isActive: true },
        select: {
          id: true,
          userId: true,
          name: true,
          isDefault: true,
          isActive: true,
          layout: true,
          createdAt: true,
          updatedAt: true,
        },
      })
    }

    return tx.dashboardTemplate.create({
      data: {
        id: crypto.randomUUID(),
        updatedAt: new Date(),
        userId,
        name: 'Default',
        isDefault: true,
        isActive: true,
        layout: cloneDefaultTemplateLayout() as any,
      },
      select: {
        id: true,
        userId: true,
        name: true,
        isDefault: true,
        isActive: true,
        layout: true,
        createdAt: true,
        updatedAt: true,
      },
    })
  })
}

export async function ensureDefaultTemplate() {
  try {
    const userId = await getUserId()
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    })

    if (!userExists) return

    await ensureActiveTemplateForUser(userId)
  } catch (error: any) {
    if (error?.code === 'P2002') return
    logger.warn('Default dashboard template initialization failed', { error: error?.message }, 'server')
  }
}
