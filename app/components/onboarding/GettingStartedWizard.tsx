'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useOrganization as useClerkOrganization } from '@clerk/nextjs';
import { useOrganization } from '@/hooks/organization/useOrganization';
import { apiRequest, PLATFORM_API } from '@/lib/api/client';
import { POST_SETUP_PATH } from '@/lib/onboarding/first-run';
import BusinessDetailsStep, { type BusinessDetails } from './BusinessDetailsStep';

/**
 * First-run is one screen: A1, business details.
 *
 * Saving it does three things and then leaves: writes the business's identity
 * and currency, ensures the org's starter field_definitions exist (the safety
 * net for the provisioning-time seed — see seedOrgDefaults), and drops the user
 * into the app. There is no step 2: the baseline the app needs is seeded, and
 * everything the owner might refine is an in-app invitation behind the "Continue
 * setup" badge, not a gate. See docs/v2-migration/APP_REDESIGN.md → A1/H1.
 */
export default function GettingStartedWizard() {
  const router = useRouter();
  const { toast } = useToast();
  const { currency: savedCurrency, settings, isLoading: orgLoading, mutate } = useOrganization();
  const { organization: clerkOrg, isLoaded: clerkLoaded } = useClerkOrganization();

  const [business, setBusiness] = useState<BusinessDetails>(EMPTY_BUSINESS);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);

  // Seed the form from what the org already has, once.
  //
  // The business name falls back to the **Clerk organization name**, which is
  // already known by the time anyone reaches setup — it is what they typed to
  // create the org. Asking for it again on a blank line would be the app
  // pretending not to know something it does know. `provision_organization`
  // seeds `identity.legal_name` for new orgs, so this mainly catches the org
  // that predates that, which is exactly the one with a blank letterhead.
  //
  // Both sources have to have arrived before seeding, or the race decides the
  // form: Clerk resolving first would seed a blank currency from a
  // still-loading settings fetch, and Continue would then block on a decision
  // the user already made. `loaded` stops a later revalidation from re-seeding
  // over live edits.
  useEffect(() => {
    if (loaded || !clerkLoaded || orgLoading) return;
    const identity = settings.identity;
    setBusiness({
      legal_name: identity?.legal_name ?? clerkOrg?.name ?? '',
      industry: identity?.industry ?? '',
      address: identity?.address ?? '',
      phone: identity?.phone ?? '',
      email: identity?.email ?? '',
      currency: savedCurrency ?? '',
    });
    setLoaded(true);
  }, [loaded, clerkLoaded, orgLoading, clerkOrg?.name, settings.identity, savedCurrency]);

  const saveBusiness = async () => {
    // Required, not optional: v2.issue_document() refuses to raise an invoice
    // or quotation without settings.locale.currency, and currency is also the
    // one signal the gate reads (OnboardingGate). Continue is disabled without
    // one; this guard is the non-UI half of the same rule.
    if (!business.currency) return;
    setBusy(true);
    try {
      // Blocks, not top-level keys — the DB trigger whitelists identity / tax /
      // documents / locale / platform_access and rejects anything else. Empty
      // fields are omitted rather than sent as '': settings is frozen into
      // document snapshots, and a blank string asserts a blank phone number.
      await apiRequest(PLATFORM_API.ORGANIZATION, 'PATCH', {
        settings: {
          identity: identityPayload(business),
          locale: { currency: business.currency },
        },
      });
      // Safety net for the provisioning-time seed: idempotent, so it costs one
      // no-op upsert when the webhook already seeded, and backfills the org
      // whose organization.created arrived out of order or predates the seed.
      // Best-effort — a seed hiccup must not trap the user on the setup screen
      // when their details already saved; the webhook remains the primary path.
      try {
        await apiRequest(PLATFORM_API.ORGANIZATION_SEED_DEFAULTS, 'POST');
      } catch {
        // swallow — entry is gated on currency, which is now written
      }
      await mutate();
      router.replace(POST_SETUP_PATH);
    } catch (error) {
      toast({
        title: 'Could not save your details',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
      setBusy(false);
    }
  };

  // Hold the first paint until the org's existing details have arrived and
  // seeded the form. Without this the business name, currency and other saved
  // identity fields flash blank — an empty form rendered before Clerk and the
  // settings fetch resolve, then visibly filling in. `loaded` flips true once
  // both have arrived (or on error), so this resolves in a beat and never hangs.
  if (!loaded) return <SetupLoading />;

  return (
    <BusinessDetailsStep
      value={business}
      onChange={setBusiness}
      onContinue={saveBusiness}
      busy={busy}
    />
  );
}

/** Shown while the org's saved details load, before the form is seeded. */
function SetupLoading() {
  return (
    <div className="flex h-dvh items-center justify-center bg-background">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      <span className="sr-only">Loading your workspace…</span>
    </div>
  );
}

const EMPTY_BUSINESS: BusinessDetails = {
  legal_name: '',
  industry: '',
  address: '',
  phone: '',
  email: '',
  currency: '',
};

/**
 * The identity block, with blanks left out entirely.
 *
 * `settingsBlocks` rejects an empty string for these keys, and the route
 * deep-merges per block, so omitting a key means "leave it alone" — which is
 * the right behaviour for a field the user never filled in. It also keeps a
 * blank string out of the issuer block that `issue_document()` freezes onto
 * every invoice.
 */
function identityPayload(business: BusinessDetails): Record<string, string> {
  const entries: [string, string][] = [
    ['legal_name', business.legal_name],
    ['industry', business.industry],
    ['address', business.address],
    ['phone', business.phone],
    ['email', business.email],
  ];
  return Object.fromEntries(entries.filter(([, value]) => value.trim() !== ''));
}
