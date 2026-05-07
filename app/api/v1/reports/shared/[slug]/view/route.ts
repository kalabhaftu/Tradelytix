import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface Props {
  params: Promise<{ slug: string }>
}

export async function POST(_request: NextRequest, { params }: Props) {
  const { slug } = await params
  const cookieName = `shared-report-viewed-${slug}`

  try {
    const report = await prisma.sharedReport.findUnique({
      where: { slug },
      select: { id: true, isPublic: true, expiresAt: true, viewCount: true },
    })

    if (!report || !report.isPublic || (report.expiresAt && report.expiresAt < new Date())) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const alreadyCounted = _request.cookies.get(cookieName)?.value === '1'
    if (alreadyCounted) {
      return NextResponse.json({ viewCount: report.viewCount, counted: false })
    }

    const updated = await prisma.sharedReport.update({
      where: { slug },
      data: { viewCount: { increment: 1 } },
      select: { viewCount: true },
    })

    const response = NextResponse.json({ viewCount: updated.viewCount, counted: true })
    response.cookies.set(cookieName, '1', {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,
      path: `/reports/shared/${slug}`,
    })
    return response
  } catch (error) {
    console.error('[Shared Report View POST]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
