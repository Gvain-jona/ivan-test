'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useNavigation } from '@/context/navigation-context';

interface NavigationErrorProps {
  className?: string;
}

/**
 * Component to display navigation errors with retry functionality
 */
export function NavigationError({ className }: NavigationErrorProps) {
  const { navigationError, cancelNavigation, startNavigation, previousPath } = useNavigation();
  const [visible, setVisible] = useState(false);

  // Show the error when navigationError is set
  useEffect(() => {
    if (navigationError) {
      setVisible(true);

      // Auto-hide after 10 seconds
      const timeout = setTimeout(() => {
        setVisible(false);
      }, 10000);

      return () => clearTimeout(timeout);
    } else {
      setVisible(false);
    }
  }, [navigationError]);

  // If no error or not visible, don't render
  if (!navigationError || !visible) {
    return null;
  }

  // Handle retry
  const handleRetry = () => {
    // Get the target path from the error message
    const match = navigationError.message.match(/(?:Failed|Falling back) to (?:navigate|direct navigation) to (.+)$/);
    const targetPath = match ? match[1] : undefined;

    // Cancel the current navigation attempt
    cancelNavigation();

    // If we have a target path, retry the navigation
    if (targetPath) {
      startNavigation(targetPath);
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

        <div className="flex gap-2 mt-3">
          <Button
            variant="secondary"
            size="sm"
            className="h-8 px-3 text-xs"
            onClick={handleRetry}
          >
            Retry
          </Button>

          {/* Extract target path for direct navigation */}
          {(() => {
            const match = navigationError.message.match(/(?:Failed|Falling back) to (?:navigate|direct navigation) to (.+)$/);
            const targetPath = match ? match[1] : null;

            if (targetPath) {
              return (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 text-xs"
                  asChild
                >
                  <a href={targetPath}>Direct Link</a>
                </Button>
              );
            }
            return null;
          })()}

          {previousPath && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-3 text-xs"
              onClick={() => {
                cancelNavigation();
                startNavigation(previousPath);
              }}
            >
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
