import React, { forwardRef } from 'react';
import { Button } from '@/components/ui/button';
import { FilePlus, Loader2, Download, Printer } from 'lucide-react';
import { InvoicePreviewProps } from './types';
import InvoiceTemplatePreview from './InvoiceTemplatePreview';
import A4PreviewContainer from './A4PreviewContainer';
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
          {/* Use our improved A4PreviewContainer for perfect aspect ratio */}
          <A4PreviewContainer
            ref={ref}
            maxHeight="calc(100vh - 200px)"
            showBorder={true}
          >
            <InvoiceTemplatePreview order={order} settings={settings} />
          </A4PreviewContainer>

          {/* Loading indicator when generating PDF - Overlay on the preview */}
          {isGenerating && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-md z-10">
              <div className="bg-white p-4 rounded-lg shadow-lg text-center max-w-xs w-full">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-orange-500" />
                <p className="font-medium text-gray-800">Generating PDF...</p>
                <p className="text-sm text-gray-600 mt-1">This may take a few seconds</p>
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

// Helper function to convert number to words
function numberToWords(num: number): string {
  const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
  const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  const teens = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];

  function convertLessThanOneThousand(n: number): string {
    if (n === 0) return '';

    if (n < 10) return ones[n];

    if (n < 20) return teens[n - 10];

    if (n < 100) {
      return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
    }

    return ones[Math.floor(n / 100)] + ' hundred' + (n % 100 !== 0 ? ' ' + convertLessThanOneThousand(n % 100) : '');
  }

  if (num === 0) return 'zero';

  let words = '';

  if (num >= 1000000) {
    words += convertLessThanOneThousand(Math.floor(num / 1000000)) + ' million ';
    num %= 1000000;
  }

  if (num >= 1000) {
    words += convertLessThanOneThousand(Math.floor(num / 1000)) + ' thousand ';
    num %= 1000;
  }

  words += convertLessThanOneThousand(num);

  return words.trim();
}

export default InvoicePreview;
