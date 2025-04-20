import React, { useEffect } from 'react';
import { Form } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { InvoiceSettingsProps } from '../types';
import InvoiceLayoutSection from './InvoiceLayoutSection';
import FormatOptionsSection from './FormatOptionsSection';
import AdditionalContentSection from './AdditionalContentSection';
import CompanyInformationSection from './CompanyInformationSection';
import ItemDisplayOptionsSection from './ItemDisplayOptionsSection';
import PaymentDetailsSettings from '../PaymentDetailsSettings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SaveSettingsButton from '../SaveSettingsButton';
import { useInvoiceSettings } from '../hooks/useInvoiceSettings';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Main component for invoice settings
 *
 * Combines all settings sections into a single form
 */
const InvoiceSettings: React.FC<InvoiceSettingsProps> = ({ form }) => {
  const { defaultSettings, isLoading, loadSettings } = useInvoiceSettings();

  // Load default settings if available
  useEffect(() => {
    if (defaultSettings && defaultSettings.settings) {
      // Reset the form with the default settings
      form.reset(defaultSettings.settings);
    }
  }, [defaultSettings, form]);

  return (
    <div className="space-y-6">
      {/* Loading indicator */}
      {isLoading && (
        <div className="flex justify-center items-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
          <span>Loading settings...</span>
        </div>
      )}

      {/* Settings header with save button */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Invoice Settings</h2>
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => loadSettings()}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Refresh
          </Button>
          <SaveSettingsButton settings={form.getValues()} />
        </div>
      </div>

      <Form {...form}>
        <Tabs defaultValue="company" className="w-full">
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="company">Company Information</TabsTrigger>
            <TabsTrigger value="layout">Invoice Layout</TabsTrigger>
            <TabsTrigger value="payment">Payment Details</TabsTrigger>
          </TabsList>

        {/* Company Information Tab */}
        <TabsContent value="company" className="space-y-6">
          <CompanyInformationSection control={form.control} />
        </TabsContent>

        {/* Invoice Layout Tab */}
        <TabsContent value="layout" className="space-y-8">
          <div className="grid grid-cols-1 gap-8">
            <InvoiceLayoutSection control={form.control} />
            <FormatOptionsSection control={form.control} />
            <ItemDisplayOptionsSection control={form.control} />
          </div>

          <Separator className="bg-border/40" />

          <AdditionalContentSection control={form.control} />
        </TabsContent>

        {/* Payment Details Tab */}
        <TabsContent value="payment" className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Payment Details</h2>
            <PaymentDetailsSettings />
          </div>
        </TabsContent>
      </Tabs>
    </Form>
    </div>
  );
};

export default InvoiceSettings;
