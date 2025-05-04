'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle, X, RefreshCw, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useNavigation } from '@/context/navigation-context';

interface NavigationErrorProps {
  className?: string;
}

/**
 * Enhanced component to display navigation errors with improved retry functionality
 */
export function NavigationError({ className }: NavigationErrorProps) {
  const { navigationError, cancelNavigation, startNavigation, previousPath } = useNavigation();
  const [visible, setVisible] = useState(false);

  // Show the error when navigationError is set
  useEffect(() => {
    if (navigationError) {
      setVisible(true);

      // Auto-hide after 8 seconds
      const timeout = setTimeout(() => {
        setVisible(false);
      }, 8000);

      return () => clearTimeout(timeout);
    } else {
      setVisible(false);
    }
  }, [navigationError]);

  // If no error or not visible, don't render
  if (!navigationError || !visible) {
    return null;
  }

  // Extract target path from error message
  const getTargetPath = () => {
    // Improved regex to handle different error message formats
    const match = navigationError.message.match(/(?:Failed|Falling back|failed) to (?:navigate|direct navigation) to (.+?)(?:$|\s)/i);
    return match ? match[1] : null;
  };

  const targetPath = getTargetPath();

  // Handle retry with Next.js router
  const handleRetry = () => {
    if (targetPath) {
      // Cancel the current navigation attempt
      cancelNavigation();
      // Retry the navigation
      startNavigation(targetPath);
    }
  };

  // Handle direct navigation (fallback)
  const handleDirectNavigation = () => {
    if (targetPath) {
      // Use window.location for direct navigation
      window.location.href = targetPath;
    }
  };

  // Handle go back
  const handleGoBack = () => {
    if (previousPath) {
      cancelNavigation();
      startNavigation(previousPath);
    }
  };

  // Handle dismiss
  const handleDismiss = () => {
    setVisible(false);
    cancelNavigation();
  };

  return (
    <div
      className={cn(
        "fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-[90%] max-w-md",
        "bg-destructive text-destructive-foreground p-4 rounded-md shadow-lg",
        "flex items-start gap-3 animate-in fade-in slide-in-from-top-5 duration-300",
        className
      )}
    >
      <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />

      <div className="flex-1">
        <h4 className="font-medium text-sm">Navigation Failed</h4>
        <p className="text-xs mt-1 opacity-90">
          {navigationError.message.replace(/^Navigation timeout: /, '')}
        </p>

        <div className="flex flex-wrap gap-2 mt-3">
          <Button
            variant="secondary"
            size="sm"
            className="h-8 px-3 text-xs flex items-center gap-1"
            onClick={handleRetry}
          >
            <RefreshCw className="h-3 w-3" />
            Retry
          </Button>

          {targetPath && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs"
              onClick={handleDirectNavigation}
            >
              Direct Link
            </Button>
          )}

          {previousPath && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-3 text-xs flex items-center gap-1"
              onClick={handleGoBack}
            >
              <ArrowLeft className="h-3 w-3" />
              Go Back
            </Button>
          )}
        </div>
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0 rounded-full"
        onClick={handleDismiss}
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Dismiss</span>
      </Button>
    </div>
  );
}
