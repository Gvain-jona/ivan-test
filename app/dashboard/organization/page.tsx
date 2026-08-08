import BrandColorPicker from '@/components/organization/BrandColorPicker';
import ThemePreference from '@/components/organization/ThemePreference';
import OrganizationDestinations from '@/components/organization/OrganizationDestinations';

export const metadata = { title: 'Organization settings' };

/**
 * Organization settings.
 *
 * A new surface rather than a tab on /dashboard/settings: that page is
 * legacy-era throughout — it reads and writes public.user_settings through the
 * Supabase browser client, which has had no session since the Clerk cutover,
 * and its Save button has no handler. Nothing org-scoped should be built on it.
 *
 * Becoming the hub the E3 frame describes: a list of destinations plus the few
 * settings small enough to sit inline. Everything a *document* says about
 * itself moved to /dashboard/organization/invoice (F3) — it is one subject with
 * one Save, and three of its blocks previously lived here as separate forms
 * with three separate saves.
 */
export default function OrganizationSettingsPage() {
  return (
    <div className="mx-auto w-full max-w-lg px-4 py-6">
      <header className="mb-5">
        <h1 className="text-xl font-semibold text-foreground">Organization</h1>
        <p className="text-[13px] text-muted-foreground">
          Shared by everyone here. Owners can change them.
        </p>
      </header>

      <OrganizationDestinations />

      <div className="mt-[22px] space-y-8 rounded-2xl border border-border bg-card p-4">
        <BrandColorPicker />
        <div className="h-px bg-border" />
        <ThemePreference />
      </div>
    </div>
  );
}
