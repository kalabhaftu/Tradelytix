'use client';

import { PlugZap } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface EmptyTradeStateProps {
  onOpenAccountSelector?: () => void;
}

export function EmptyTradeState({ onOpenAccountSelector }: EmptyTradeStateProps) {
  const handleSelectAccount = () => {
    if (onOpenAccountSelector) {
      onOpenAccountSelector();
    } else {
      window.dispatchEvent(new Event('open-account-selector'));
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="mb-5 flex items-center justify-center rounded-full bg-muted p-4">
        <PlugZap className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mb-2 text-xl font-semibold tracking-tight">Connect Your Account</h3>
      <p className="mb-8 max-w-sm text-sm text-muted-foreground">
        No trades found. Connect your broker for automatic sync, import a trade history file, or select a different account.
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Button variant="outline" onClick={handleSelectAccount}>Select Account</Button>
        <Button asChild>
          <Link href="/dashboard/accounts">Connect Broker</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard/import">Import Trades</Link>
        </Button>
      </div>
    </div>
  );
}
