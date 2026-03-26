'use server'

import { prisma, safeDbOperation } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getUserId } from './auth-utils'
import { cloneDefaultTemplateLayout } from '@/lib/dashboard/default-template-layout'

export interface WidgetLayout {
  i: string
  type: string
  size: string
  x: number
  y: number
  w: number
  h: number
}

export interface DashboardTemplate {
  id: string
  userId: string
  name: string
  isDefault: boolean
  isActive: boolean
  layout: WidgetLayout[]
  createdAt: Date
  updatedAt: Date
}

const getCanonicalDefaultLayout = (): WidgetLayout[] =>
  cloneDefaultTemplateLayout() as WidgetLayout[]

/**
 * Get the default layout - used for default template and new templates
 */
export async function getDefaultLayout(): Promise<WidgetLayout[]> {
  return getCanonicalDefaultLayout()
}

/**
 * Get all templates for the current user
 */
export async function getUserTemplates(): Promise<DashboardTemplate[]> {
  const userId = await getUserId()

  const templates = await safeDbOperation(
    () => prisma.dashboardTemplate.findMany({
      where: { userId },
      orderBy: [
        { isDefault: 'desc' },
        { isActive: 'desc' },
        { createdAt: 'asc' },
      ],
    }),
    [] // Return empty array if database is unavailable
  )

  return (templates || []).map(t => JSON.parse(JSON.stringify({
    ...t,
    layout: t.layout as unknown as WidgetLayout[],
  })))
}

/**
 * Get the active template for the current user
 */
export async function getActiveTemplate(): Promise<DashboardTemplate | null> {
  try {
    const userId = await getUserId()
    if (!userId) return null

    const template = await safeDbOperation(
      () => prisma.dashboardTemplate.findFirst({
        where: {
          userId,
          isActive: true,
        },
      }),
      null
    )

    if (!template) return null

    // If it's the default template, always return the canonical default layout
    if (template.isDefault) {
      return JSON.parse(JSON.stringify({
        ...template,
        layout: getCanonicalDefaultLayout(),
      }))
    }

    return JSON.parse(JSON.stringify({
      ...template,
      layout: template.layout as unknown as WidgetLayout[],
    }))
  } catch (error) {
    console.error('getActiveTemplate failed:', error)
    return null
  }
}

/**
 * Initialize default template for new users
 */
export async function initializeDefaultTemplate(userId: string): Promise<DashboardTemplate> {
  const existingDefault = await safeDbOperation(
    () => prisma.dashboardTemplate.findFirst({
      where: {
        userId,
        isDefault: true,
      },
    }),
    null
  )

  if (existingDefault) {
    return {
      ...existingDefault,
      layout: existingDefault.layout as unknown as WidgetLayout[],
    }
  }

  // Get the default layout first
  const layout = await getDefaultLayout()

  const template = await safeDbOperation(
    () => prisma.dashboardTemplate.create({
      data: {
        id: crypto.randomUUID(),
        updatedAt: new Date(),
        userId,
        name: 'Default',
        isDefault: true,
        isActive: true,
        layout: layout as any,
      },
    }),
    null
  )

  if (!template) {
    throw new Error('Failed to create default template')
  }

  return {
    ...template,
    layout: template.layout as unknown as WidgetLayout[],
  }
}

/**
 * Create a new template for the current user
 */
export async function createTemplate(name: string): Promise<DashboardTemplate> {
  try {
    const userId = await getUserId()
    if (!userId) throw new Error('Authentication required')

    // Check if name already exists for this user
    const existing = await safeDbOperation(
      () => prisma.dashboardTemplate.findFirst({
        where: {
          userId,
          name: {
            equals: name,
            mode: 'insensitive'
          }
        },
      }),
      null
    )

    if (existing) {
      throw new Error(`A template with the name "${name}" already exists.`)
    }

    // Deactivate current active template
    await safeDbOperation(() =>
      prisma.dashboardTemplate.updateMany({
        where: { userId, isActive: true },
        data: { isActive: false },
      })
    )

    // Create new template
    const template = await safeDbOperation(() =>
      prisma.dashboardTemplate.create({
        data: {
          id: crypto.randomUUID(),
          updatedAt: new Date(),
          userId,
          name,
          isActive: true,
          isDefault: false,
          layout: getCanonicalDefaultLayout() as any,
        },
      })
    )

    if (!template) {
      throw new Error('Failed to create template record')
    }

    revalidatePath('/dashboard')

    // Explicitly serialize to plain object for Vercel stability
    return JSON.parse(JSON.stringify({
      ...template,
      layout: template.layout as unknown as WidgetLayout[],
    }))
  } catch (error) {
    console.error('createTemplate failed:', error)
    throw error // Re-throw for client-side catch
  }
}

/**
 * Delete a template
 */
export async function deleteTemplate(id: string): Promise<void> {
  try {
    const userId = await getUserId()
    if (!userId) throw new Error('Authentication required')

    const template = await safeDbOperation(() =>
      prisma.dashboardTemplate.findUnique({
        where: { id },
      })
    )

    if (!template || template.userId !== userId) {
      throw new Error('Template not found')
    }

    if (template.isDefault) {
      throw new Error('Cannot delete default template')
    }

    // If deleting active template, make default active
    if (template.isActive) {
      await safeDbOperation(() =>
        prisma.dashboardTemplate.updateMany({
          where: { userId, isDefault: true },
          data: { isActive: true },
        })
      )
    }

    await safeDbOperation(() =>
      prisma.dashboardTemplate.delete({
        where: { id },
      })
    )

    revalidatePath('/dashboard')
  } catch (error) {
    console.error('deleteTemplate failed:', error)
    throw error
  }
}

/**
 * Switch to a different template
 */
export async function switchTemplate(id: string): Promise<DashboardTemplate> {
  try {
    const userId = await getUserId()
    if (!userId) throw new Error('Authentication required')

    // Deactivate all
    await safeDbOperation(() =>
      prisma.dashboardTemplate.updateMany({
        where: { userId, isActive: true },
        data: { isActive: false },
      })
    )

    // Activate the selected one
    const template = await safeDbOperation(() =>
      prisma.dashboardTemplate.update({
        where: { id },
        data: { isActive: true },
      })
    )

    if (!template) {
      throw new Error('Template not found')
    }

    revalidatePath('/dashboard')

    return JSON.parse(JSON.stringify({
      ...template,
      layout: template.isDefault ? getCanonicalDefaultLayout() : (template.layout as unknown as WidgetLayout[]),
    }))
  } catch (error) {
    console.error('switchTemplate failed:', error)
    throw error
  }
}

/**
 * Update the layout of a template
 */
export async function updateTemplateLayout(id: string, layout: WidgetLayout[]): Promise<DashboardTemplate> {
  try {
    const userId = await getUserId()
    if (!userId) throw new Error('Authentication required')

    const template = await safeDbOperation(() =>
      prisma.dashboardTemplate.findUnique({
        where: { id },
      })
    )

    if (!template || template.userId !== userId) {
      throw new Error('Template not found')
    }

    if (template.isDefault) {
      throw new Error('Cannot modify default template layout')
    }

    const updated = await safeDbOperation(() =>
      prisma.dashboardTemplate.update({
        where: { id },
        data: {
          layout: layout as any,
          updatedAt: new Date()
        },
      })
    )

    if (!updated) {
      throw new Error('Failed to update template layout')
    }

    revalidatePath('/dashboard')

    return JSON.parse(JSON.stringify({
      ...updated,
      layout: updated.layout as unknown as WidgetLayout[],
    }))
  } catch (error) {
    console.error('updateTemplateLayout failed:', error)
    throw error
  }
}
