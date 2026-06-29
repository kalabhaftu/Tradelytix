import { Suspense } from 'react'
import { JournalClient } from './components/journal-client'
import { JournalPageSkeleton } from './components/journal-page-skeleton'

// Enable dynamic rendering to respect account filters
export const dynamic = 'force-dynamic'

export default function JournalPage() {
  return (
    <Suspense fallback={<JournalPageSkeleton />}>
      <JournalClient />
    </Suspense>
  )
}
