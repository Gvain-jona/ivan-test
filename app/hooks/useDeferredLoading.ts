'use client';

import { useEffect, useRef, useState } from 'react';

interface DeferredLoadingOptions {
  /** Wait this long before showing the skeleton (ms). Suppresses warm-cache flashes. */
  delay?: number;
  /** Once shown, keep the skeleton at least this long (ms). Prevents a one-frame stutter. */
  min?: number;
}

/**
 * Turns a raw `isLoading` into a `showSkeleton` that ignores blinks and never
 * stutters (LOAD-05).
 *
 *   - Stays `false` until `isLoading` has held for `delay` ms — so a warm SWR
 *     cache that resolves in tens of milliseconds never shows a skeleton at all,
 *     and we render nothing for that sub-perceptible moment instead of flashing.
 *   - Once `true`, stays `true` for at least `min` ms — so a skeleton that does
 *     appear is on screen long enough to read, never a single frame.
 *
 * The instant-shell list screens don't need this: their row skeleton is gated on
 * `isLoading && items.length === 0`, and their chrome renders immediately. Reach
 * for it on detail fetches and any read that can hit a warm cache.
 */
export function useDeferredLoading(
  isLoading: boolean,
  { delay = 200, min = 400 }: DeferredLoadingOptions = {},
): boolean {
  const [show, setShow] = useState(false);
  const shownAt = useRef<number | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    if (isLoading) {
      // Already showing → nothing to schedule; the min-hold below governs exit.
      if (!show) {
        timer = setTimeout(() => {
          shownAt.current = Date.now();
          setShow(true);
        }, delay);
      }
    } else if (show) {
      // Loading finished while the skeleton is up: hold it for the remainder of `min`.
      const elapsed = Date.now() - (shownAt.current ?? Date.now());
      timer = setTimeout(() => {
        shownAt.current = null;
        setShow(false);
      }, Math.max(0, min - elapsed));
    }

    return () => clearTimeout(timer);
  }, [isLoading, show, delay, min]);

  return show;
}
