'use client'

import React, { Component, type ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface WidgetErrorBoundaryProps {
  children: ReactNode
  widgetId?: string
  title?: string
}

interface WidgetErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class WidgetErrorBoundary extends Component<WidgetErrorBoundaryProps, WidgetErrorBoundaryState> {
  constructor(props: WidgetErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): WidgetErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`Widget Error (${this.props.title || this.props.widgetId || 'Unknown'}):`, error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card className="h-full w-full border-red-500/20 bg-red-500/5 dark:bg-red-500/10">
          <CardContent className="flex h-full flex-col items-center justify-center space-y-4 p-6 text-center">
            <div className="rounded-full bg-red-500/20 p-3">
              <AlertCircle className="h-6 w-6 text-red-500" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Failed to load widget
              </h3>
              <p className="text-xs text-red-600/80 dark:text-red-300/80 max-w-[200px] truncate">
                {this.state.error?.message || 'An unexpected error occurred'}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-2 h-8 border-red-500/20 text-red-600 hover:bg-red-500/10 hover:text-red-700"
              onClick={() => this.setState({ hasError: false, error: null })}
            >
              Try again
            </Button>
          </CardContent>
        </Card>
      )
    }

    return this.props.children
  }
}
