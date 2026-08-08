import InvoiceSettingsScreen from '@/components/settings/InvoiceSettingsScreen';

export const metadata = { title: 'Invoice settings' };

/**
 * F3 on the Pencil canvas. A destination off the organization settings hub
 * rather than a section within it: numbering, defaults, tax, letterhead,
 * payment instructions and printed fields are one subject — everything a
 * document says about itself — and they share a single Save.
 */
export default function InvoiceSettingsPage() {
  return <InvoiceSettingsScreen />;
}
