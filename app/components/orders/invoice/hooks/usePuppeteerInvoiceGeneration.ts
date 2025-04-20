import { useState, useCallback, useRef } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Order } from '@/types/orders';
import { InvoiceSettings } from '../types';

// Quality options for PDF generation
export type PdfQuality = 'standard' | 'high';

interface UsePuppeteerInvoiceGenerationProps {
  order: Order | null;
}

interface UsePuppeteerInvoiceGenerationReturn {
  isGenerating: boolean;
  progress: number;
  error: string | null;
  previewRef: React.RefObject<HTMLDivElement>;
  generateAndDownloadPdf: (quality?: PdfQuality) => Promise<void>;
}

/**
 * Hook for server-side invoice generation using Puppeteer
 * This provides the most accurate rendering of the invoice preview
 */
export default function usePuppeteerInvoiceGeneration({
  order
}: UsePuppeteerInvoiceGenerationProps): UsePuppeteerInvoiceGenerationReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  /**
   * Generates and downloads a PDF from the preview using Puppeteer
   * @param quality - The quality of the PDF (standard or high)
   */
  const generateAndDownloadPdf = useCallback(async (quality: PdfQuality = 'high'): Promise<void> => {
    if (!order || !previewRef.current) {
      toast({
        title: "Error",
        description: "Cannot generate PDF: Missing order data or preview element",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setError(null);

    // Create a single toast that we'll update
    const toastId = "invoice-generation";

    try {
      // Show initial toast with quality information
      toast({
        id: toastId,
        title: "Generating PDF",
        description: `Please wait while we prepare your invoice... This may take a few seconds at ${quality === 'high' ? 'high' : 'standard'} quality.`,
      });

      // Reset progress
      setProgress(10);

      // Get the HTML content of the preview
      const invoiceTemplate = previewRef.current.querySelector('.invoice-template');
      if (!invoiceTemplate) {
        throw new Error('Invoice template not found inside preview element');
      }

      // Clone the template to avoid modifying the original
      const templateClone = invoiceTemplate.cloneNode(true) as HTMLElement;

      // Apply specific styles for PDF generation
      templateClone.style.width = '100%';
      templateClone.style.height = '100%';
      templateClone.style.margin = '0';
      templateClone.style.padding = '0';
      templateClone.style.boxSizing = 'border-box';
      templateClone.style.backgroundColor = 'white';

      // Create a temporary container to hold the clone
      const tempContainer = document.createElement('div');
      tempContainer.appendChild(templateClone);

      // Get the HTML content
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Invoice</title>
          <style>
            @page {
              size: A4;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
              font-family: Arial, sans-serif;
            }
            .invoice-template {
              width: 210mm;
              height: 297mm;
              box-sizing: border-box;
              background-color: white;
              position: relative;
              overflow: hidden;
            }
          </style>
        </head>
        <body>
          ${tempContainer.innerHTML}
        </body>
        </html>
      `;

      // Update progress
      setProgress(30);

      // Call the server-side API to generate the PDF
      const response = await fetch('/api/invoices/puppeteer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: order.id,
          html: htmlContent,
          settings: {
            quality,
          },
        }),
      });

      // Update progress
      setProgress(70);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate invoice');
      }

      const data = await response.json();

      // Update progress
      setProgress(90);

      // Create a download link
      const link = document.createElement('a');
      link.href = data.url;
      link.target = '_blank';
      link.click();

      // Update the same toast with success message
      toast({
        id: toastId,
        title: "Download successful",
        description: `Your invoice has been downloaded successfully at ${quality === 'high' ? 'high' : 'standard'} quality with exact A4 dimensions.`,
        variant: "success",
      });

      // Final progress
      setProgress(100);
    } catch (err) {
      console.error('Error generating PDF:', err);

      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);

      // Update the same toast with error message
      toast({
        id: toastId,
        title: "PDF generation failed",
        description: `There was a problem generating your invoice: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  }, [order, toast]);

  return {
    isGenerating,
    progress,
    error,
    previewRef,
    generateAndDownloadPdf,
  };
}
