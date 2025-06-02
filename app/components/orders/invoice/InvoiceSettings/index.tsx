// ⚠️ DEPRECATED: This file is no longer used in the app
// The app now uses /app/features/invoices/components/settings/InvoiceSettings.tsx
// This file should be removed in future cleanup

import React from 'react';
import { Form } from '@/components/ui/form';
import { InvoiceSettingsProps } from '../types';
import CompanyInformationSection from './CompanyInformationSection';
import PaymentDetailsSettings from '../PaymentDetailsSettings';
import SaveSettingsButton from '../SaveSettingsButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Simplified invoice settings component
 * Focuses only on essential settings for WYSIWYG invoice generation
 */
const InvoiceSettings: React.FC<InvoiceSettingsProps> = ({ form }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Invoice Settings</h2>
        <SaveSettingsButton settings={form.getValues()} />
      </div>

      <Form {...form}>
        <div className="space-y-6">
          {/* Company Information - Simplified */}
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
            </CardHeader>
            <CardContent>
              <CompanyInformationSection control={form.control} />
            </CardContent>
          </Card>

          {/* Payment Details - Simplified */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
            </CardHeader>
            <CardContent>
              <PaymentDetailsSettings />
            </CardContent>
          </Card>
        </div>
      </Form>
    </div>
  );
};

export default InvoiceSettings;
