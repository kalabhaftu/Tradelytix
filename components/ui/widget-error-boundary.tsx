'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import logger from '@/lib/logger';

interface Props {
  children?: ReactNode;
  title?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class WidgetErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error({ err: error, errorInfo }, 'Widget error caught:');
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-6 border border-red-900/30 bg-red-900/10 rounded-lg min-h-[200px]">
          <AlertTriangle className="w-8 h-8 text-red-500 mb-2" />
          <h3 className="text-lg font-medium text-red-400">
            {this.props.title || 'Widget Failed to Load'}
          </h3>
          <p className="text-sm text-zinc-400 mt-2 text-center">
            {this.state.error?.message || 'An unexpected error occurred in this component.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-4 px-4 py-2 bg-red-950 hover:bg-red-900 text-red-200 rounded text-sm transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
