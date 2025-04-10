import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { FileText, FilePlus, Download, Printer } from 'lucide-react';
import { motion } from 'framer-motion';
import OrderSheet from '@/components/ui/sheets/OrderSheet';
import { InvoiceSheetProps, InvoiceSettings as InvoiceSettingsType } from './types';
import InvoicePreview from './InvoicePreview';
import InvoiceSettingsComponent from './InvoiceSettings';
import useInvoiceGeneration from './hooks/useInvoiceGeneration';
import useInvoiceActions from './hooks/useInvoiceActions';

/**
 * Main container component for the invoice sheet
 *
 * Manages the tab state, form state, and coordinates between child components
 */
const InvoiceSheet: React.FC<InvoiceSheetProps> = ({
  open,
  onOpenChange,
  order,
  onClose,
}) => {
  // Tab state
  const [activeTab, setActiveTab] = useState<string>('preview');

  // Form setup
  const form = useForm<InvoiceSettingsType>({
    defaultValues: {
      includeHeader: true,
      includeFooter: true,
      includeLogo: true,
      includeSignature: false,
      format: 'a4',
      template: 'standard',
      notes: `Thank you for your business!`,
      paymentTerms: 'Payment due within 30 days.',
      customHeader: '',
      customFooter: 'Making You Visible.',
      tinNumber: '1028570150',
      proformaNumber: order?.id.substring(0, 8) || '',
      companyName: 'IVAN PRINTS',
      companyEmail: 'sherilex256@gmail.com',
      companyPhone: '0755 541 373',
      companyAddress: 'Printing, Designing, Branding.',
      companyLogo: '/images/logo.png',
      // Bank details from the image
      bankName: 'ABSA BANK',
      accountName: 'IVAN PRINTS',
      accountNumber: '6008084570',
      // Mobile money details from the image
      mobileProvider: 'Airtel',
      mobilePhone: '0755 541 373',
      mobileContact: '(Vuule Abdul)',
    },
  });

  // Custom hooks
  const {
    invoiceUrl,
    isGenerating,
    error,
    generateInvoiceWithSettings,
    resetInvoice
  } = useInvoiceGeneration({
    orderId: order?.id || '',
    order: order
  });

  const { handleDownload, handlePrint } = useInvoiceActions({
    invoiceUrl
  });

  // Event handlers
  const handleGenerate = async () => {
    const settings = form.getValues();
    await generateInvoiceWithSettings(settings);
    // Only switch to preview if no error occurred
    if (!error) {
      setActiveTab('preview');
    }
  };

  // If no order is provided, don't render anything
  if (!order) return null;

  return (
    <OrderSheet
      open={open}
      onOpenChange={onOpenChange}
      title={`Invoice for Order #${order.id.substring(0, 8)}`}
      size="lg"
      onClose={onClose}
    >
      <div className="p-0 flex-1 flex flex-col overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col">
          <div className="border-b border-border/40 px-6">
            <TabsList className="bg-transparent w-full justify-start">
              <TabsTrigger
                value="preview"
                className="data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none text-muted-foreground px-4 py-2"
              >
                <FileText className="h-4 w-4 mr-2" />
                Preview
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                className="data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none text-muted-foreground px-4 py-2"
              >
                <FilePlus className="h-4 w-4 mr-2" />
                Settings
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-auto">
            <TabsContent value="preview" className="h-full flex flex-col p-6">
              <InvoicePreview
                order={order}
                invoiceUrl={invoiceUrl}
                isGenerating={isGenerating}
                error={error}
                settings={form.getValues()}
                onGenerate={handleGenerate}
              />
            </TabsContent>

            <TabsContent value="settings" className="h-full p-6">
              <InvoiceSettingsComponent form={form} />
            </TabsContent>
          </div>
        </Tabs>
      </div>

      <div className="border-t border-[#2B2B40] p-6 flex flex-wrap gap-3 justify-between">
        <div className="flex gap-3">
          {invoiceUrl && (
            <>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={handleDownload}
                  className="bg-orange-500 hover:bg-orange-600 text-white flex items-center"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
              </motion.div>

              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={handlePrint}
                  variant="outline"
                  className="border-[#2B2B40] bg-transparent hover:bg-white/[0.02] text-[#6D6D80] hover:text-white flex items-center"
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Print
                </Button>
              </motion.div>
            </>
          )}

          {!invoiceUrl && activeTab === 'settings' && (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={handleGenerate}
                className="bg-orange-500 hover:bg-orange-600 text-white flex items-center"
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Generate Invoice
                  </>
                )}
              </Button>
            </motion.div>
          )}
        </div>
        
        <div>
          {error && (
            <div className="flex-1 p-3 bg-red-500/10 text-red-400 rounded border border-red-500/20 max-w-md">
              <p className="font-semibold mb-1">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          )}
        </div>
      </div>
    </OrderSheet>
  );
};

export default InvoiceSheet;
