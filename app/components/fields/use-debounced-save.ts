'use client';

import { useEffect, useRef, useState } from 'react';
import type { SaveStatus } from './field-editor-parts';

/**
 * Persist a value a short while after it stops changing.
 *
 * The inline editor has no Save button — there's no dialog to dismiss, so
 * there's no moment at which "apply" would naturally happen. This is what
 * stands in for that moment, and what the Saved indicator reports on.
 *
 * Skips the initial value (nothing has been edited yet) and skips while
 * `blocked` is true, so an invalid draft is never written.
 */
export function useDebouncedSave<T>(
  value: T,
  save: (value: T) => Promise<void>,
  { delayMs = 700, blocked = false }: { delayMs?: number; blocked?: boolean } = {},
) {
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [failure, setFailure] = useState<string | null>(null);

  // Refs so a new callback identity or a newer value doesn't restart the timer
  // for reasons unrelated to the edit itself.
  const latest = useRef(value);
  latest.current = value;
  const saveRef = useRef(save);
  saveRef.current = save;
  const pristine = useRef(true);

  useEffect(() => {
    if (pristine.current) {
      pristine.current = false;
      return;
    }
    if (blocked) return;

    const timer = window.setTimeout(async () => {
      setStatus('saving');
      setFailure(null);
      try {
        await saveRef.current(latest.current);
        setStatus('saved');
      } catch (error) {
        setStatus('idle');
        setFailure(error instanceof Error ? error.message : 'Could not save');
      }
    }, delayMs);

    return () => window.clearTimeout(timer);
  }, [value, blocked, delayMs]);

  /** Call when the value changes, so the indicator drops out of "saved". */
  const markDirty = () => setStatus('idle');

  return { status, failure, markDirty };
}
