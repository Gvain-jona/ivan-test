import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { FilePlus, Loader2, Download, Printer, Eye } from 'lucide-react';
import { Order } from '@/types/orders';
import { InvoiceSettings } from './types';
import OrangeInvoiceTemplate from './OrangeInvoiceTemplate';
import A5PreviewContainer from './A5PreviewContainer';
import useEnhancedInvoiceGeneration from './hooks/useEnhancedInvoiceGeneration';
import './styles/scrollbar-hide.css';
import './styles/print.css';
import './styles/pdf-styles.css';

interface EnhancedInvoicePreviewProps {
  order: Order;
  settings: InvoiceSettings;
  showPreviewButton?: boolean;
}

/**
 * Enhanced invoice preview component with improved PDF generation
 */
const EnhancedInvoicePreview: React.FC<EnhancedInvoicePreviewProps> = ({
  order,
  settings,
  showPreviewButton = false
}) => {
  const {
    generatePdf,
    generatePreview,
    isGenerating,
    progress,
    previewRef,
    previewUrl
  } = useEnhancedInvoiceGeneration();

  // Handle print functionality
  const handlePrint = () => {
    if (previewUrl) {
      // Open the PDF in a new window for printing
      const printWindow = window.open(previewUrl, '_blank');
      if (printWindow) {
        printWindow.addEventListener('load', () => {
          printWindow.print();
        });
      }
    } else {
      // Generate preview first if not available
      generatePreview();
    }
  };

  // Handle download
  const handleDownload = () => {
    generatePdf(order);
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 overflow-auto scrollbar-hide bg-gray-100 rounded-md p-4 flex justify-center relative">
        <div className="w-full max-w-[800px] mx-auto">
          {/* Scroll hint message */}
          <div className="text-center mb-2 text-sm text-muted-foreground">
            <span>Scroll to view the entire invoice</span>
          </div>

          {/* A5 Preview Container */}
          <A5PreviewContainer
            ref={previewRef}
            maxHeight="calc(100vh - 220px)"
            showBorder={true}
            hideScrollbars={false}
            className="pdf-ready"
          >
            <OrangeInvoiceTemplate order={order} settings={settings} />
          </A5PreviewContainer>

          {/* Loading indicator */}
          {isGenerating && (
            <div className="mt-4 flex justify-center">
              <div className="flex items-center gap-2 bg-orange-500/10 text-orange-500 px-4 py-2 rounded-md">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>
                  {progress < 100
                    ? `Generating PDF... ${progress}%`
                    : 'Finalizing...'}
                </span>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="mt-4 flex justify-center gap-2">
            {showPreviewButton && (
              <Button
                onClick={generatePreview}
                disabled={isGenerating}
                variant="outline"
                className="bg-white"
              >
                <Eye className="mr-2 h-4 w-4" />
                Preview PDF
              </Button>
            )}
            <Button
              onClick={handleDownload}
              disabled={isGenerating}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
            <Button
              onClick={handlePrint}
              disabled={isGenerating}
              variant="outline"
              className="bg-white"
            >
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
          </div>

          {/* PDF Preview iframe (only shown when preview is generated) */}
          {previewUrl && (
            <div className="mt-4 border border-gray-200 rounded-md overflow-hidden">
              <iframe
                src={previewUrl}
                className="w-full h-[600px]"
                title="Invoice Preview"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedInvoicePreview;
