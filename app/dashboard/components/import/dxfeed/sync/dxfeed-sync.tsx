'use client'

import { DxFeedCredentialsManager } from './dxfeed-credentials-manager'

export function DxFeedSync() {
  return (
    <div className="flex flex-col space-y-6 p-6">
      <div className="flex flex-col space-y-2">
        <h2 className="text-lg font-semibold">DxFeed Auto Sync</h2>
        <p className="text-sm text-muted-foreground">
          Connect your DxFeed account to automatically synchronize your trades daily.
        </p>
      </div>
      <DxFeedCredentialsManager />
    </div>
  )
}
