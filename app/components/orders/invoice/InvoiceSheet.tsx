// ⚠️ DEPRECATED: This file is no longer used in the app
// The app now uses /app/features/invoices/components/InvoiceSheet.tsx
// This file should be removed in future cleanup

import React, { useState, useEffect, useCallback } from 'react';
import { useOrdersPage } from '@/app/dashboard/orders/_context';
import { useForm } from 'react-hook-form';
import { useInvoiceSettings } from './hooks/useInvoiceSettings';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { FileText, FilePlus, Download, Printer, Loader2, Settings2 } from 'lucide-react';
import { motion } from 'framer-motion';
import OrderSheet from '@/components/ui/sheets/OrderSheet';
import { InvoiceSheetProps, InvoiceSettings as InvoiceSettingsType } from './types';
import InvoicePreview from './InvoicePreview';
import EnhancedInvoicePreview from './EnhancedInvoicePreview';
import InvoiceSettingsComponent from './InvoiceSettings';
import useSimpleInvoiceGeneration, { PdfQuality } from './hooks/useSimpleInvoiceGeneration';
import LoadingOverlay from './LoadingOverlay';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

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

  // PDF quality state
  const [pdfQuality, setPdfQuality] = useState<PdfQuality>('high');

  // Get the active modal state from context
  const { activeModal } = useOrdersPage();

  // Load saved settings with caching
  const { defaultSettings, isLoading: settingsLoading } = useInvoiceSettings();

  // Form setup
  const form = useForm<InvoiceSettingsType>({
    defaultValues: defaultSettings?.settings || {
      // Display options
      includeHeader: true,
      includeFooter: true,
      includeLogo: true,
      includeSignature: false,
      format: 'a4',
      template: 'standard',

      // Item display options
      showItemCategory: true,
      showItemName: true,
      showItemSize: true,
      itemDisplayFormat: 'combined' as 'combined' | 'separate',

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
      companyName: 'IVAN PRINTS',
      companyEmail: 'sherilex256@gmail.com',
      companyPhone: '0755 541 373',
      companyAddress: 'Printing, Designing, Branding.',
      companyLogo: '/images/default-logo.svg',
      
      // Logo settings
      logoSize: 'medium' as 'small' | 'medium' | 'large',
      logoShowBorder: true,
      logoZoom: 1.0,

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

  // Effect to update form when default settings change
  useEffect(() => {
    if (defaultSettings?.settings) {
      form.reset(defaultSettings.settings);
    }
  }, [defaultSettings, form]);

  // We're now using the enhanced invoice preview component which has its own PDF generation
  // This is kept for backward compatibility with the footer buttons
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const error = null;

  // Event handlers
  const handleGenerate = async (quality: PdfQuality = pdfQuality) => {
    // Switch to preview tab first
    setActiveTab('preview');

    // The actual PDF generation is now handled by the EnhancedInvoicePreview component
    // This is just a placeholder to maintain compatibility
    setIsGenerating(true);

    // Simulate progress for UI feedback
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 10;
      setProgress(Math.min(currentProgress, 90));
      if (currentProgress >= 90) clearInterval(interval);
    }, 200);

    // Simulate completion after a short delay
    setTimeout(() => {
      clearInterval(interval);
      setProgress(100);
      setTimeout(() => {
        setIsGenerating(false);
        setProgress(0);
      }, 500);
    }, 2000);
  };

  // Handle close with cleanup
  const handleClose = useCallback(() => {
    // Call the original onClose handler
    if (onClose) {
      onClose();
    }
  }, [onClose]);

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
        onClose={handleClose}
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
              {/* Use the enhanced invoice preview component */}
              <EnhancedInvoicePreview
                order={order}
                settings={form.getValues()}
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
          <div className="flex gap-1">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    className="bg-orange-500 hover:bg-orange-600 text-white flex items-center"
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating PDF...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        Download PDF
                      </>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => {
                    setPdfQuality('high');
                    handleGenerate('high');
                  }}>
                    <Settings2 className="mr-2 h-4 w-4" />
                    High Quality PDF (2x)
                    {pdfQuality === 'high' && <span className="ml-2 text-xs text-green-500">✓</span>}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    setPdfQuality('standard');
                    handleGenerate('standard');
                  }}>
                    <Settings2 className="mr-2 h-4 w-4" />
                    Standard Quality PDF (1x)
                    {pdfQuality === 'standard' && <span className="ml-2 text-xs text-green-500">✓</span>}
                  </DropdownMenuItem>
                  {/* Image download removed to simplify implementation */}
                </DropdownMenuContent>
              </DropdownMenu>
            </motion.div>
          </div>

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
