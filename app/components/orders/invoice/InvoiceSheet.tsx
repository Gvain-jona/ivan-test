import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { FileText, FilePlus, Download, Printer, Loader2, FileDown, FileUp } from 'lucide-react';
import { motion } from 'framer-motion';
import OrderSheet from '@/components/ui/sheets/OrderSheet';
import { InvoiceSheetProps, InvoiceSettings as InvoiceSettingsType } from './types';
import InvoicePreview from './InvoicePreview';
import InvoiceSettingsComponent from './InvoiceSettings';
import useClientInvoiceGeneration from './hooks/useClientInvoiceGeneration';
import LoadingOverlay from './LoadingOverlay';

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
      // Display options
      includeHeader: true,
      includeFooter: true,
      includeLogo: true,
      includeSignature: false,
      format: 'a4',
      template: 'standard',

      // Tax and discount options
      includeTax: false,
      taxRate: 0,
      includeDiscount: false,
      discountRate: 0,

      // Content
      notes: `Thank you for your business!`,
      customHeader: '',
      customFooter: 'Making You Visible.',

      // Company information
      tinNumber: '1028570150',
      proformaNumber: order?.id.substring(0, 8) || '',
      companyName: 'IVAN PRINTS',
      companyEmail: 'sherilex256@gmail.com',
      companyPhone: '0755 541 373',
      companyAddress: 'Printing, Designing, Branding.',
      companyLogo: '/images/logo.png',

      // Payment details arrays
      bankDetails: [
        {
          id: '1',
          bankName: 'ABSA BANK',
          accountName: 'IVAN PRINTS',
          accountNumber: '6008084570',
        }
      ],
      mobileMoneyDetails: [
        {
          id: '1',
          provider: 'Airtel',
          phoneNumber: '0755 541 373',
          contactName: 'Vuule Abdul',
        }
      ],
    },
  });

  // Custom hooks for client-side PDF generation
  const {
    isGenerating,
    progress,
    error,
    previewRef,
    generateAndDownloadPdf
  } = useClientInvoiceGeneration({
    order
  });

  // Event handlers
  const handleGenerate = async (quality: number = 2) => {
    // Switch to preview tab first
    setActiveTab('preview');

    // Generate and download the PDF with specified quality
    await generateAndDownloadPdf(quality);
  };

  // If no order is provided, don't render anything
  if (!order) return null;

  // We now get progress directly from the hook

  return (
    <>
      <LoadingOverlay
        visible={isGenerating}
        progress={progress}
        message={progress > 80 ? "Preparing download..." : "Generating PDF..."}
      />
      <OrderSheet
        open={open}
        onOpenChange={onOpenChange}
        title={`Invoice for Order #${order.order_number || order.id.substring(0, 8)}`}
        size="xxl"
        onClose={onClose}
      >
      <div className="p-0 flex-1 flex flex-col overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col">
          <div className="border-b border-border/40 px-6 sticky top-0 bg-background z-10">
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
                ref={previewRef}
                order={order}
                invoiceUrl={null}
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

      <div className="border-t border-[#2B2B40] p-6 flex flex-wrap gap-3 justify-between sticky bottom-0 bg-background z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        <div className="flex gap-3">
          {/* Digital Quality (1x) - Faster, smaller file */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={() => handleGenerate(1)}
              className="bg-orange-500 hover:bg-orange-600 text-white flex items-center"
              disabled={isGenerating}
              title="Faster generation, smaller file size"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileDown className="mr-2 h-4 w-4" />
                  Digital PDF (1x)
                </>
              )}
            </Button>
          </motion.div>

          {/* Print Quality (2x) - Higher quality for printing */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={() => handleGenerate(2)}
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center"
              disabled={isGenerating}
              title="Higher quality for printing"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileUp className="mr-2 h-4 w-4" />
                  Print PDF (2x)
                </>
              )}
            </Button>
          </motion.div>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={() => window.print()}
              variant="outline"
              className="border-[#2B2B40] bg-transparent hover:bg-white/[0.02] text-[#6D6D80] hover:text-white flex items-center"
              disabled={isGenerating}
            >
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
          </motion.div>
        </div>

        <Button
          onClick={onClose}
          variant="outline"
          className="border-[#2B2B40] bg-transparent hover:bg-white/[0.02] text-[#6D6D80] hover:text-white"
        >
          Close
        </Button>
      </div>
    </OrderSheet>
    </>
  );
};

export default InvoiceSheet;
