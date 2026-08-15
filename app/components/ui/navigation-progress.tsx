'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useNavigation } from '@/context/navigation-context';

interface NavigationProgressProps {
  className?: string;
}

/**
 * A progress bar that appears at the top of the page during navigation.
 * Uses the navigation context to track navigation state.
 *
 * The progress is *simulated* (an eased curve to 90%, then a jump to 100% on
 * completion) — this is deliberate (LOAD-06): a client route transition has no
 * real percentage to report, and a moving bar reads as progress where a static
 * one reads as a hang. The curve deliberately never reaches 100% on its own, so
 * it can't claim "done" before navigation actually completes; it also never
 * fully stalls, since the increment stays positive up to 90%. This pairs with
 * the corner `NavigationIndicator` spinner — two signals for one event, kept
 * intentionally: the bar reads at a glance, the spinner confirms activity on
 * long transitions.
 */
export function NavigationProgress({ className }: NavigationProgressProps = {}) {
  const { isNavigating, navigationError } = useNavigation();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let progressInterval: NodeJS.Timeout;
    let visibilityTimeout: NodeJS.Timeout;

    if (isNavigating) {
      // Reset progress and make visible immediately
      setProgress(0);
      setVisible(true);

      // Simulate progress with a non-linear curve that slows down as it approaches 90%
      progressInterval = setInterval(() => {
        setProgress(prevProgress => {
          if (prevProgress < 90) {
            // Move faster at the beginning, slower as it approaches 90%
            const increment = Math.max(0.5, 10 * (1 - prevProgress / 100));
            return Math.min(90, prevProgress + increment);
          }
          return prevProgress;
        });
      }, 100);
    } else {
      // If navigation is complete or failed, quickly finish the progress bar
      setProgress(100);

      // Hide after animation completes
      visibilityTimeout = setTimeout(() => {
        setVisible(false);
        // Reset progress after hiding
        setTimeout(() => setProgress(0), 100);
      }, 500); // Match the transition duration
    }

    return () => {
      clearInterval(progressInterval);
      clearTimeout(visibilityTimeout);
    };
  }, [isNavigating, navigationError]);

  // Theme tokens, not literals (LOAD-03): the progress bar follows the org's
  // brand (which may not be orange) and holds in light mode; the error state
  // uses the destructive token. `bg-red-500`/`bg-orange-500` did neither.
  const barColor = navigationError ? 'bg-destructive' : 'bg-primary';

  if (!visible && !isNavigating) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 h-1 z-50 bg-border/60",
        className
      )}
    >
      <div
        className={cn(
          "h-full transition-all duration-300 ease-out",
          barColor
        )}
        style={{
          width: `${progress}%`,
          opacity: visible ? 1 : 0,
          transition: 'width 300ms ease-out, opacity 300ms ease-in-out'
        }}
      />
    </div>
  );
}
