import { SETUP_PATH } from './steps';

/** Landing for a user who has finished A1 but is still on the setup screen. */
export const POST_SETUP_PATH = '/dashboard/home';

/**
 * Where a signed-in, provisioned user should be, given first-run state —
 * a path to redirect to, or null to stay put. Pure, so the gate's whole
 * decision is unit-testable without a router.
 *
 * The only gate is A1 (business details). Its one required field is currency —
 * v2.issue_document refuses to raise a document without settings.locale.currency
 * — so "currency present" ⟺ "A1 submitted", and that is the entire entry
 * condition. Everything the app needs to run is seeded at provisioning; every-
 * thing the user might refine is an in-app invitation behind the "Continue
 * setup" badge, not a checkpoint. A finished user is sent off the bare,
 * chromeless setup form so it can't become a dead end.
 */
export function firstRunRedirect({
  currency,
  pathname,
}: {
  currency: string | null;
  pathname: string | null;
}): string | null {
  const businessDone = currency != null;
  const onSetup = pathname === SETUP_PATH;

  if (!businessDone && !onSetup) return SETUP_PATH;
  if (businessDone && onSetup) return POST_SETUP_PATH;
  return null;
}
