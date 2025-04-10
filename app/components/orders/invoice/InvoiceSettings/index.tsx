import React from 'react';
import { Form } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { InvoiceSettingsProps } from '../types';
import InvoiceLayoutSection from './InvoiceLayoutSection';
import FormatOptionsSection from './FormatOptionsSection';
import AdditionalContentSection from './AdditionalContentSection';

/**
 * Main component for invoice settings
 *
 * Combines all settings sections into a single form
 */
const InvoiceSettings: React.FC<InvoiceSettingsProps> = ({ form }) => {
  return (
    <Form {...form}>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InvoiceLayoutSection control={form.control} />
          <FormatOptionsSection control={form.control} />
        </div>

        <Separator className="bg-border/40" />

        <AdditionalContentSection control={form.control} />
      </div>
    </Form>
  );
};

export default InvoiceSettings;
