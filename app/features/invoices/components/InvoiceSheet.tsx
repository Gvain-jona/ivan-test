'use client';

import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { FileText, Settings2, Save } from 'lucide-react';
import OrderSheet from '@/components/ui/sheets/OrderSheet';
import { InvoiceSheetProps } from '../types';
import { InvoiceProvider, defaultInvoiceSettings } from '../context/InvoiceContext';
import { useInvoiceSettings } from '../hooks/useInvoiceSettingsV2';
import InvoicePreview from './InvoicePreview';
import InvoiceSettings from './settings/InvoiceSettings';
import SettingsManager from './settings/SettingsManager';

/**
 * Main invoice sheet component
 * This is the entry point for the invoice system
 */
const InvoiceSheet: React.FC<InvoiceSheetProps> = ({
  open,
  onOpenChange,
  order,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<string>('preview');
  const { settings, isLoading } = useInvoiceSettings();

  // Handle close with confirmation if needed
  const handleClose = () => {
    // For now, just call the onClose prop
    // In the future, we might want to add confirmation if there are unsaved changes
    onClose();
  };

  return (
    <InvoiceProvider
      order={order}
      initialSettings={isLoading ? defaultInvoiceSettings : settings}>
      <OrderSheet
        open={open}
        onOpenChange={onOpenChange}
        title={`Invoice for Order #${order.order_number || order.id.substring(0, 8)}`}
        size="xxl"
        onClose={handleClose}
      >
        <div className="p-0 flex-1 flex flex-col overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col">
            <div className="border-b border-border/40 px-6 sticky top-0 bg-background z-10">
              <TabsList className="bg-transparent w-full justify-start">
                <TabsTrigger
                  value="preview"
                  className="data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-[#F97316] rounded-none text-[#6D6D80] px-4 py-2"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Preview
                </TabsTrigger>
                <TabsTrigger
                  value="settings"
                  className="data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-[#F97316] rounded-none text-[#6D6D80] px-4 py-2"
                >
                  <Settings2 className="h-4 w-4 mr-2" />
                  Settings
                </TabsTrigger>
                <TabsTrigger
                  value="saved"
                  className="data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-[#F97316] rounded-none text-[#6D6D80] px-4 py-2"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Saved Settings
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-auto">
              <TabsContent value="preview" className="h-full flex flex-col p-6">
                <InvoicePreview />
              </TabsContent>

              <TabsContent value="settings" className="h-full p-6">
                <InvoiceSettings />
              </TabsContent>

              <TabsContent value="saved" className="h-full p-6">
                <SettingsManager />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </OrderSheet>
    </InvoiceProvider>
  );
};

export default InvoiceSheet;
