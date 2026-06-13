'use client'

import { TradovateCredentialsManager } from './tradovate-credentials-manager'

export function TradovateSync() {
  return (
    <div className="flex flex-col space-y-6 p-6">
      <div className="flex flex-col space-y-2">
        <h2 className="text-lg font-semibold">Tradovate Auto Sync</h2>
        <p className="text-sm text-muted-foreground">
          Connect your Tradovate account to automatically synchronize your trades daily.
        </p>
      </div>
      <TradovateCredentialsManager />
    </div>
  )
}
