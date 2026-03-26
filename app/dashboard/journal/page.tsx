import { Suspense } from 'react'
import { JournalClient } from './components/journal-client'
import { JournalRouteSkeleton } from '@/components/ui/non-dashboard-skeletons'

// Enable dynamic rendering to respect account filters
export const dynamic = 'force-dynamic'

// Client Component page - uses filtered data from context
export default function JournalPage() {
  return (
    <Suspense fallback={<JournalRouteSkeleton />}>
      <JournalClient />
    </Suspense>
  )
}
