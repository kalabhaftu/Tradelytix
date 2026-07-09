import { Metadata } from 'next'
import { GoalsPageClient } from './goals-page-client'

export const metadata: Metadata = {
  title: 'Goals | JJI',
  description: 'Set and track your trading performance goals',
}

export default function GoalsPage() {
  return <GoalsPageClient />
}
