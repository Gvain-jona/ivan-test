'use client';

import { ApiRequestError } from '@/lib/api/client';
import { ScreenHeader } from '@/components/patterns/screen';
import { Button } from '@/components/ui/button';

/**
 * The error state for a detail record (order hub, client, product, document).
 *
 * These screens gate on `isLoading || !data`, which never goes false when the
 * fetch fails — the reader is left on an animated skeleton forever. That is the
 * case a real user hits: a flaky connection, or a deep link to a record that
 * was deleted or belongs to another org (a 404, per SEC-05). A 404 is
 * terminal, so it offers Back only; a transient error offers Try again.
 */
export function RecordError({
  noun,
  error,
  onBack,
  onRetry,
}: {
  /** The kind of record, lowercase — "order", "client", "product", "document". */
  noun: string;
  error: unknown;
  onBack: () => void;
  onRetry: () => void;
}) {
  const notFound = error instanceof ApiRequestError && error.status === 404;
  const title = notFound ? `This ${noun} isn’t available` : `Couldn’t load this ${noun}`;
  const message = notFound
    ? 'It may have been removed, or it isn’t in your organization.'
    : 'Something went wrong loading it. Check your connection and try again.';

  // Capitalised noun as the header title, so the bar carries a real heading
  // rather than an empty one (an empty <h1> reads as a blank heading to a
  // screen reader).
  const heading = noun.charAt(0).toUpperCase() + noun.slice(1);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col bg-background">
      <ScreenHeader title={heading} onBack={onBack} />
      <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 pb-16 text-center">
        <div className="space-y-1">
          <p className="text-[15px] font-semibold text-foreground">{title}</p>
          <p className="text-[13px] text-muted-foreground">{message}</p>
        </div>
        {notFound ? (
          <Button variant="outline" onClick={onBack}>
            Go back
          </Button>
        ) : (
          <Button variant="outline" onClick={onRetry}>
            Try again
          </Button>
        )}
      </div>
    </div>
  );
}
