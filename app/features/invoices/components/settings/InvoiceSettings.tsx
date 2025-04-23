'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Form } from '@/components/ui/form';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Building2, Layout, CreditCard } from 'lucide-react';
import { InvoiceSettings as InvoiceSettingsType } from '../../types';
import { useInvoiceContext } from '../../context/InvoiceContext';
import CompanySection from './CompanySection';
import LayoutSection from './LayoutSection';
import PaymentSection from './PaymentSection';
import SaveSettingsButton from './SaveSettingsButton';
import { useToast } from '@/components/ui/use-toast';

/**
 * Main settings component for the invoice
 * Contains tabs for different settings sections
 */
const InvoiceSettings: React.FC = () => {
  const { settings, updateSettings } = useInvoiceContext();
  const { toast } = useToast();

  // Create form with react-hook-form
  const form = useForm<InvoiceSettingsType>({
    defaultValues: settings,
  });

  // Initialize storage buckets
  useEffect(() => {
    const initializeStorage = async () => {
      try {
        const response = await fetch('/api/storage/init');
        if (!response.ok) {
          console.warn('Failed to initialize storage buckets');
        }
      } catch (error) {
        console.error('Error initializing storage:', error);
      }
    };

    initializeStorage();
  }, []);

  // Watch for form changes and update context
  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      if (name && type === 'change') {
        updateSettings(name as keyof InvoiceSettingsType, value[name as keyof InvoiceSettingsType]);
      }
    });

    return () => subscription.unsubscribe();
  }, [form, updateSettings]);

  return (
    <div className="h-full overflow-auto">
      <div className="flex justify-end mb-4">
        <SaveSettingsButton variant="default" />
      </div>
      <Form {...form}>
        <Tabs defaultValue="company" className="w-full">
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="company" className="data-[state=active]:bg-[#F97316] data-[state=active]:text-white">
              <Building2 className="h-4 w-4 mr-2" />
              Company Information
            </TabsTrigger>
            <TabsTrigger value="layout" className="data-[state=active]:bg-[#F97316] data-[state=active]:text-white">
              <Layout className="h-4 w-4 mr-2" />
              Invoice Layout
            </TabsTrigger>
            <TabsTrigger value="payment" className="data-[state=active]:bg-[#F97316] data-[state=active]:text-white">
              <CreditCard className="h-4 w-4 mr-2" />
              Payment Details
            </TabsTrigger>
          </TabsList>

          {/* Company Information Tab */}
          <TabsContent value="company" className="space-y-6">
            <CompanySection control={form.control} />
          </TabsContent>

          {/* Invoice Layout Tab */}
          <TabsContent value="layout" className="space-y-8">
            <LayoutSection control={form.control} />
          </TabsContent>

          {/* Payment Details Tab */}
          <TabsContent value="payment" className="space-y-6">
            <PaymentSection control={form.control} />
          </TabsContent>
        </Tabs>
      </Form>
    </div>
  );
};

export default InvoiceSettings;
