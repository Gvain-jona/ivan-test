import BrandColorPicker from '@/components/organization/BrandColorPicker';
import BusinessIdentityForm from '@/components/organization/BusinessIdentityForm';
import DocumentDefaultsForm from '@/components/organization/DocumentDefaultsForm';
import DocumentFieldsForm from '@/components/organization/DocumentFieldsForm';
import TaxSettingsForm from '@/components/organization/TaxSettingsForm';
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
 * Ordered by consequence, not by category. Business details come first
 * because they are the only settings that can be *too late*: issue_document()
 * freezes them into a document's snapshot, and an issued snapshot is
 * immutable — so an invoice sent before they're filled in keeps a blank
 * letterhead permanently. Appearance is last because it is always reversible.
 */
export default function OrganizationSettingsPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
      <header className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">Organization settings</h1>
        <p className="text-[13px] text-muted-foreground">
          Shared by everyone in this organization. Owners can change them.
        </p>
      </header>

      <div className="space-y-8 rounded-xl border border-border bg-card p-4 sm:p-6">
        <BusinessIdentityForm />
        <div className="h-px bg-border" />
        <TaxSettingsForm />
        <div className="h-px bg-border" />
        <DocumentDefaultsForm />
        <div className="h-px bg-border" />
        <DocumentFieldsForm />
        <div className="h-px bg-border" />
        <BrandColorPicker />
        <div className="h-px bg-border" />
        <ThemePreference />
      </div>
    </div>
  );
}
