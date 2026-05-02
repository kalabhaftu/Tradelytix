import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { SharedReportView } from './shared-report-view'

interface Props {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const report = await prisma.sharedReport.findUnique({
    where: { slug: params.slug },
    select: { title: true },
  })
  return {
    title: report?.title ? `${report.title} | Deltalytix` : 'Shared Trading Report | Deltalytix',
    description: 'View this shared trading performance report',
  }
}

export default async function SharedReportPage({ params }: Props) {
  const report = await prisma.sharedReport.findUnique({
    where: { slug: params.slug },
  })

  if (!report || !report.isPublic) {
    notFound()
  }

  if (report.expiresAt && report.expiresAt < new Date()) {
    notFound()
  }

  // Increment view count
  await prisma.sharedReport.update({
    where: { slug: params.slug },
    data: { viewCount: { increment: 1 } },
  }).catch(() => {})

  return <SharedReportView report={report as any} />
}
