import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { applyRateLimit, publicLimiter } from '@/lib/rate-limiter'
import { createErrorResponse, createSuccessResponse } from '@/lib/api-response'
import { logger } from '@/lib/logger'

interface Props {
  params: Promise<{ slug: string }>
}

const sharedReportSlugPattern = /^[a-z0-9]{10}$/

export async function POST(request: NextRequest, { params }: Props) {
  const rateLimitResponse = await applyRateLimit(request, publicLimiter)
  if (rateLimitResponse) return rateLimitResponse

  const { slug } = await params
  if (!sharedReportSlugPattern.test(slug)) {
    return createErrorResponse('Not found', 404)
  }

  const cookieName = `shared-report-viewed-${slug}`

  try {
    const report = await prisma.sharedReport.findUnique({
      where: { slug },
      select: { id: true, isPublic: true, expiresAt: true, viewCount: true },
    })

    if (!report || !report.isPublic || (report.expiresAt && report.expiresAt < new Date())) {
      return createErrorResponse('Not found', 404)
    }

    const alreadyCounted = request.cookies.get(cookieName)?.value === '1'
    if (alreadyCounted) {
      return createSuccessResponse({ viewCount: report.viewCount, counted: false })
    }

    const updated = await prisma.sharedReport.update({
      where: { slug },
      data: { viewCount: { increment: 1 } },
      select: { viewCount: true },
    })

    const response = createSuccessResponse({ viewCount: updated.viewCount, counted: true })
    response.cookies.set(cookieName, '1', {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,
      path: `/reports/shared/${slug}`,
    })
    return response
  } catch (error) {
    logger.error('Shared report view count failed', { slug }, 'api')
    return createErrorResponse('Internal server error', 500)
  }
}
