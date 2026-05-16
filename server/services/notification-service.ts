import { prisma } from '@/lib/prisma'
import { NotificationType } from '@prisma/client'
import { revalidateTag } from 'next/cache'

export type NotificationData = {
    type: NotificationType
    title: string
    message: string
    userId: string
    data?: Record<string, any>
    actionRequired?: boolean
    referenceId?: string
    invalidationKey?: string
}

export class NotificationService {
    static async send(payload: NotificationData) {
        const { userId, type, title, message, data, actionRequired, referenceId, invalidationKey } = payload

        if (invalidationKey) {
            const existing = await prisma.notification.findFirst({
                where: {
                    userId,
                    isRead: false,
                    invalidationKey,
                }
            })

            if (existing) {
                const updated = await prisma.notification.update({
                    where: { id: existing.id },
                    data: {
                        title,
                        message,
                        type,
                        actionRequired: actionRequired ?? existing.actionRequired,
                        invalidationKey,
                        data: { ...(existing.data as object || {}), ...data, referenceId },
                    }
                })
                revalidateTag(`notifications-${userId}`, 'max')
                return updated
            }
        }

        const notification = await prisma.notification.create({
            data: {
                userId,
                type,
                title,
                message,
                actionRequired: actionRequired ?? false,
                invalidationKey,
                data: { ...data, referenceId }
            }
        })

        revalidateTag(`notifications-${userId}`, 'max')
        return notification
    }

    static async bulkInvalidate(userId: string, type: NotificationType) {
        await prisma.notification.updateMany({
            where: {
                userId,
                type,
                isRead: false
            },
            data: { isRead: true }
        })
        revalidateTag(`notifications-${userId}`, 'max')
    }
}
