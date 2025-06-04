'use client';

import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { useInvoiceContext } from '../context/InvoiceContext';
import OrangeInvoiceTemplate from '@/components/orders/invoice/OrangeInvoiceTemplate';
import { toSimplifiedSettings } from '@/components/orders/invoice/types';
import { generateExactPdf } from '../utils/exactPdfGenerator';
import { useToast } from '@/components/ui/use-toast';
import { QualitySelector, InvoiceQuality } from './QualitySelectorFixed';
import { InvoiceDatePicker } from './InvoiceDatePicker';
import { PdfGenerationOverlay } from './PdfGenerationOverlay';

/**
 * Component for previewing and downloading the invoice
 */
const InvoicePreview: React.FC = () => {
  const { order, settings } = useInvoiceContext();
  
  // Check if settings are empty (no company name means not configured)
  const hasValidSettings = settings && settings.companyName && settings.companyName.trim().length > 0;
  const previewRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedQuality, setSelectedQuality] = useState<InvoiceQuality>('digital');
  const [invoiceDate, setInvoiceDate] = useState<Date>(
    order?.created_at ? new Date(order.created_at) : new Date()
  );
  const [generationStage, setGenerationStage] = useState<'preparing' | 'generating' | 'downloading' | 'complete'>('preparing');

  // Handle download button click
  const handleDownload = async () => {
    if (!previewRef.current) return;

    setIsGenerating(true);
    setProgress(0);
    setGenerationStage('preparing');

    // Small delay to show preparing stage
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      // Get the template container directly using the data attribute
      const templateContainer = previewRef.current.querySelector('[data-pdf-container="true"]');

      if (!templateContainer) {
        throw new Error('Template container not found');
      }

      setGenerationStage('generating');
      setProgress(10);

      // Generate and download the PDF with exact capture
      await generateExactPdf(
        templateContainer as HTMLElement,
        order,
        {
          quality: selectedQuality,
          // Set DPI based on quality
          dpi: selectedQuality === 'print' ? 300 : 96
        },
        (downloadProgress) => {
          // Update UI with download progress
          if (downloadProgress > 80) {
            setGenerationStage('downloading');
          }
          setProgress(downloadProgress);
        }
      );

      setGenerationStage('complete');
      setProgress(100);
      
      // Show complete stage briefly before closing
      setTimeout(() => {
        setIsGenerating(false);
        setProgress(0);
      }, 1500);
    } catch (error) {
      console.error('Error downloading invoice:', error);

      toast({
        title: 'Download Failed',
        description: error instanceof Error ? error.message : 'There was an error downloading your invoice. Please try again.',
        variant: 'destructive',
      });
      
      setIsGenerating(false);
      setProgress(0);
    }
  };

  // Handle cancel during preparation
  const handleCancel = () => {
    setIsGenerating(false);
    setProgress(0);
  };

  // Show settings required message if no valid settings
  if (!hasValidSettings) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="max-w-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Invoice Settings Required
          </h3>
          <p className="text-gray-600 mb-4">
            You need to configure your invoice settings before you can preview or generate invoices. 
            Please go to the Settings tab to add your company information.
          </p>
          <p className="text-sm text-gray-500">
            At minimum, you need to provide a company name to generate invoices.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <PdfGenerationOverlay
        isVisible={isGenerating}
        progress={progress}
        quality={selectedQuality}
        stage={generationStage}
        onCancel={generationStage === 'preparing' ? handleCancel : undefined}
      />
      
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <QualitySelector
              selectedQuality={selectedQuality}
              onQualityChange={setSelectedQuality}
              disabled={isGenerating}
            />
            <InvoiceDatePicker
              date={invoiceDate}
              onDateChange={setInvoiceDate}
              disabled={isGenerating}
            />
          </div>
          <Button
            onClick={handleDownload}
            disabled={isGenerating}
            className="bg-[#F97316] hover:bg-[#F97316]/90 text-white"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating... {Math.round(progress)}%
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Download {selectedQuality === 'print' ? 'Print' : 'Digital'} PDF
              </>
            )}
          </Button>
        </div>

        <div className="flex-1 overflow-auto bg-gray-100 rounded-md p-4 flex flex-col items-center">
          <div className="text-center mb-2 text-sm text-muted-foreground">
            <span>Scroll to view the entire invoice</span>
          </div>

          <div className="relative w-full max-w-[210mm] mx-auto shadow-md">
            <div
              className="pb-[141.4%] w-full"
              style={{ maxHeight: 'calc(100vh - 180px)' }}
            ></div>

            <div
              className="absolute top-0 left-0 right-0 bottom-0 overflow-auto bg-white"
              ref={previewRef}
            >
              <OrangeInvoiceTemplate 
                order={order} 
                settings={toSimplifiedSettings(settings)} 
                customDate={invoiceDate}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoicePreview;
