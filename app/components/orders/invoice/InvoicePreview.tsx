import React, { forwardRef } from 'react';
import { Button } from '@/components/ui/button';
import { FilePlus, Loader2, Download, Printer } from 'lucide-react';
import { InvoicePreviewProps } from './types';
import OrangeInvoiceTemplate from './OrangeInvoiceTemplate';
import A5PreviewContainer from './A5PreviewContainer';
import './styles/scrollbar-hide.css';
import './styles/print.css';

/**
 * Renders a preview of the invoice or a placeholder if not yet generated
 */
const InvoicePreview = forwardRef<HTMLDivElement, InvoicePreviewProps>((
  { order, invoiceUrl, isGenerating, error, settings, onGenerate },
  ref
) => {
  // Loading state is now handled by the LoadingOverlay component

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="bg-red-500/10 text-red-400 rounded border border-red-500/20 p-4 mb-4 max-w-md">
          <p className="font-medium">Error generating invoice</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
        <Button onClick={onGenerate} className="bg-orange-500 hover:bg-orange-600 text-white">
          <FilePlus className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    );
  }

  // Show the template preview immediately without any overlay
  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 overflow-auto scrollbar-hide bg-gray-100 rounded-md p-4 flex justify-center relative">
        <div className="w-full max-w-[800px] mx-auto">
          {/* Scroll hint message */}
          <div className="text-center mb-2 text-sm text-muted-foreground">
            <span>Scroll to view the entire invoice</span>
          </div>

          {/* Use our improved A5PreviewContainer for perfect aspect ratio */}
          <A5PreviewContainer
            ref={ref}
            maxHeight="calc(100vh - 220px)" /* Adjusted for the scroll hint */
            showBorder={true}
            hideScrollbars={false} /* Show scrollbars for better UX */
            className="pdf-ready" /* Add class for PDF generation */
          >
            <OrangeInvoiceTemplate order={order} settings={settings} />
          </A5PreviewContainer>

          {/* Loading indicator when generating PDF */}
          {isGenerating && (
            <div className="mt-4 flex justify-center">
              <div className="flex items-center gap-2 bg-orange-500/10 text-orange-500 px-4 py-2 rounded-md">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Generating PDF...</span>
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="mt-4 p-3 bg-red-500/10 text-red-400 rounded border border-red-500/20">
              <p className="font-semibold mb-1">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

// Add display name for better debugging
InvoicePreview.displayName = 'InvoicePreview';

export default InvoicePreview;
