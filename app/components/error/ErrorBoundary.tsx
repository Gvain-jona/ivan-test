'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary component to catch JavaScript errors anywhere in the child component tree
 * and display a fallback UI instead of crashing the whole app
 */
class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to an error reporting service
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback UI
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center min-h-[300px] p-6 bg-gray-900/50 rounded-lg border border-red-900/30">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Something went wrong</h2>
          <p className="text-gray-400 text-center mb-6 max-w-md">
            An error occurred while loading this content. This could be due to a temporary issue or a problem with the application.
          </p>
          
          {/* Error details (collapsed by default) */}
          <details className="mb-6 w-full max-w-md bg-gray-800/50 rounded-md p-3 text-sm">
            <summary className="cursor-pointer text-gray-300 font-medium">Error Details</summary>
            <div className="mt-2 p-2 bg-gray-950 rounded text-gray-400 overflow-auto max-h-[200px]">
              <p className="font-mono text-red-400">{this.state.error?.toString()}</p>
              {this.state.errorInfo && (
                <pre className="mt-2 text-xs">{this.state.errorInfo.componentStack}</pre>
              )}
            </div>
          </details>
          
          <div className="flex gap-4">
            <Button 
              variant="default" 
              onClick={this.handleReset}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
              className="flex items-center gap-2"
            >
              Reload Page
            </Button>
          </div>
        </div>
      );
    }

    // Render children if there's no error
    return this.props.children;
  }
}

export default ErrorBoundary;
