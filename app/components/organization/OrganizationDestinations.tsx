'use client';

import { Card, Divided, Section } from '@/components/patterns/screen';
import { LinkRow } from '@/components/patterns/settings-rows';
import { useOrganization } from '@/hooks/organization/useOrganization';
import { useCounters } from '@/hooks/organization/useCounters';

/**
 * The destinations half of the organization hub (E3 on the canvas).
 *
 * Each row summarises what's behind it rather than just naming it — "14 days ·
 * VAT 18%" tells an owner whether they need to go in at all, which is the
 * point of a hub. Only Invoice settings exists so far; the rest of E3's rows
 * (order stages, note types, team) arrive with their screens.
 */
export default function OrganizationDestinations() {
  const { settings } = useOrganization();
  const { counters } = useCounters();

  const invoiceCounter = counters.find(c => c.counter_key === 'doc:invoice');
  const terms = settings.documents?.terms_days;
  const tax = settings.tax;

  const summary = [
    terms === undefined ? null : `${terms} days`,
    tax?.registered ? `${tax.label ?? 'Tax'} ${tax.rate ?? 0}%` : null,
    invoiceCounter?.format ?? null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Section label="HOW YOU INVOICE">
      <Card>
        <Divided>
          <LinkRow
            label="Invoice details"
            value={summary || 'Not set up yet'}
            href="/dashboard/organization/invoice"
          />
        </Divided>
      </Card>
    </Section>
  );
}
