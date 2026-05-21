import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { SharedReportView } from './shared-report-view'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const report = await prisma.sharedReport.findUnique({
    where: { slug },
    select: { title: true },
  })
  return {
    title: report?.title ? `${report.title} | Tradelytix` : 'Shared Trading Report | Tradelytix',
    description: 'View this shared trading performance report',
  }
}

export default async function SharedReportPage({ params }: Props) {
  const { slug } = await params
  const report = await prisma.sharedReport.findUnique({
    where: { slug },
  })

  if (!report || !report.isPublic) {
    notFound()
  }

  if (report.expiresAt && report.expiresAt < new Date()) {
    notFound()
  }

  return <SharedReportView report={report as any} />
}
