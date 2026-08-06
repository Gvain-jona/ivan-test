import BrandColorPicker from '@/components/organization/BrandColorPicker';
import ThemePreference from '@/components/organization/ThemePreference';

export const metadata = { title: 'Organization settings' };

/**
 * Organization settings.
 *
 * A new surface rather than a tab on /dashboard/settings: that page is
 * legacy-era throughout — it reads and writes public.user_settings through
 * the Supabase browser client, which has had no session since the Clerk
 * cutover, and its Save button has no handler. Nothing org-scoped should be
 * built on it.
 *
 * Appearance is the first section. The identity / tax / documents blocks
 * that onboarding never collects (see docs/v2-migration/STATE.md) belong
 * here too, and this is the surface they should land on.
 */
export default function OrganizationSettingsPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
      <header className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">Organization settings</h1>
        <p className="text-[13px] text-muted-foreground">
          Appearance and branding for everyone in this organization.
        </p>
      </header>

      <div className="space-y-8 rounded-xl border border-border bg-card p-4 sm:p-6">
        <BrandColorPicker />
        <div className="h-px bg-border" />
        <ThemePreference />
      </div>
    </div>
  );
}
