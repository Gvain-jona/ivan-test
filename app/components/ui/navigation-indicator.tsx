'use client';

import { useNavigation } from '@/context/navigation-context';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface NavigationIndicatorProps {
  className?: string;
  showSpinner?: boolean;
}

/**
 * A navigation indicator that shows a spinner in the corner during navigation
 */
export function NavigationIndicator({
  className,
  showSpinner = true
}: NavigationIndicatorProps = {}) {
  const { isNavigating, navigationError } = useNavigation();
  const [visible, setVisible] = useState(false);

  // Control visibility with a slight delay to prevent flashing
  useEffect(() => {
    let timeout: NodeJS.Timeout;

    if (isNavigating) {
      // Small delay before showing to prevent flashing for quick navigations
      timeout = setTimeout(() => {
        setVisible(true);
      }, 100);
    } else {
      // Hide with a small delay to allow for animation
      timeout = setTimeout(() => {
        setVisible(false);
      }, 300);
    }

    return () => {
      clearTimeout(timeout);
    };
  }, [isNavigating]);

  if (!visible && !isNavigating) return null;

  return (
    <div
      className={cn(
        "fixed bottom-20 right-4 z-50 transition-opacity duration-300",
        visible ? "opacity-100" : "opacity-0",
        className
      )}
    >
      {showSpinner && (
        <div className="bg-gray-900/80 backdrop-blur-sm p-2 rounded-full shadow-lg">
          <Loader2 className="h-6 w-6 text-orange-500 animate-spin" />
        </div>
      )}
    </div>
  );
}
