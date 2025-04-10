import React from 'react';
import { Button } from '@/components/ui/button';
import { FilePlus, Loader2, FileText } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { InvoicePreviewProps } from './types';
import { OrderItem } from '@/types/orders';

/**
 * Renders a preview of the invoice or a placeholder if not yet generated
 */
const InvoicePreview: React.FC<InvoicePreviewProps> = ({
  order,
  invoiceUrl,
  isGenerating,
  error,
  settings,
  onGenerate,
}) => {
  if (isGenerating) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Generating invoice...</p>
        </div>
      </div>
    );
  }

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

  if (!invoiceUrl) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center text-center max-w-md">
          <div className="mb-6 p-5 rounded-full bg-muted/20">
            <FilePlus className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No Invoice Generated Yet</h3>
          <p className="text-muted-foreground mb-6">
            Generate an invoice for order #{order.id.substring(0, 8)} to preview it here.
          </p>
          <Button onClick={onGenerate} className="bg-orange-500 hover:bg-orange-600 text-white">
            <FilePlus className="mr-2 h-4 w-4" />
            Generate Invoice
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 overflow-hidden bg-white rounded-md shadow flex justify-center">
        <iframe
          src={invoiceUrl}
          className="border-0"
          title={`Invoice for Order #${order.id.substring(0, 8)}`}
          style={{ 
            width: '100%',
            maxWidth: '800px',
            minHeight: '600px',
            maxHeight: '80vh', 
            aspectRatio: '1 / 1.414', // A4 aspect ratio
            backgroundColor: 'white',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}
        />
      </div>
    </div>
  );
};

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
