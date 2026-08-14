'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Sparkles, X } from 'lucide-react';
import { useOrganization } from '@/hooks/organization/useOrganization';
import { apiRequest, PLATFORM_API } from '@/lib/api/client';

/**
 * The "Continue setup" badge — the design-language half of the first-run
 * decision (2026-08-14). A1 collects the business's details; this carries the
 * rest, without ever spelling it out: the app prepared the common setup for the
 * owner, and this is the standing, dismissible invitation to review or extend it
 * when they wish. It sits in the Home feed just under the greeting, exactly
 * where the H1 frame draws it (the frame shows it on Home only).
 *
 * Shown only to an owner who hasn't dismissed it — staff can't change fields or
 * settings, and `onboarding_completed_at` (set on dismiss) is what retires it.
 * The column no longer gates entry; it only governs this badge.
 */
export default function ContinueSetupBanner() {
  const router = useRouter();
  const { orgRole, onboardingCompleted, isLoading, mutate } = useOrganization();
  const [dismissing, setDismissing] = useState(false);

  // Owners only, once the org is known, until it's dismissed.
  if (isLoading || onboardingCompleted || orgRole !== 'owner') return null;

  const dismiss = async () => {
    setDismissing(true);
    // Optimistic: the badge is a nudge, not a transaction — clear it locally at
    // once and let the write settle; a failed write just means it returns on the
    // next load, which is harmless.
    await mutate(
      async current => {
        await apiRequest(PLATFORM_API.ORGANIZATION, 'PATCH', { onboarding_completed: true });
        return current;
      },
      { revalidate: true },
    ).catch(() => setDismissing(false));
  };

  if (dismissing) return null;

  return (
    <div className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3">
      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Sparkles className="h-[18px] w-[18px]" />
      </span>

      <button
        type="button"
        onClick={() => router.push('/dashboard/products')}
        className="min-w-0 flex-1 text-left focus-visible:outline-none"
      >
        <div className="flex items-center gap-1 text-[13.5px] font-semibold text-foreground">
          Continue setup
          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <p className="mt-0.5 truncate text-[12px] text-muted-foreground">
          We&apos;ve prepared the essentials — review your products, clients and stages, or add your
          first records.
        </p>
      </button>

      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss setup"
        className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
