import { useState, useCallback, useRef } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Order } from '@/types/orders';
import { generateSimplePdf, downloadSimplePdf } from '../utils/simplePdfGenerator';

// Quality options for PDF generation
export type PdfQuality = 'standard' | 'high';

interface UseSimpleInvoiceGenerationProps {
  order: Order | null;
}

interface UseSimpleInvoiceGenerationReturn {
  isGenerating: boolean;
  progress: number;
  error: string | null;
  previewRef: React.RefObject<HTMLDivElement>;
  generateAndDownloadPdf: (quality?: PdfQuality) => Promise<void>;
}

/**
 * Hook for simplified invoice generation
 * This uses a more direct approach to ensure the PDF matches the preview exactly
 */
export default function useSimpleInvoiceGeneration({
  order
}: UseSimpleInvoiceGenerationProps): UseSimpleInvoiceGenerationReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  /**
   * Generates and downloads a PDF from the preview
   * @param quality - The quality of the PDF (standard or high)
   */
  const generateAndDownloadPdf = useCallback(async (quality: PdfQuality = 'standard'): Promise<void> => {
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
        description: `Please wait while we prepare your invoice... This may take a few seconds.`,
      });

      // Reset progress
      setProgress(0);

      // Prepare the preview element for PDF generation
      const preparePreviewForPdf = () => {
        if (!previewRef.current) return;

        // Find the invoice template
        const invoiceTemplate = previewRef.current.querySelector('.invoice-template');
        if (!invoiceTemplate) return;

        // Ensure the template fills the entire page
        (invoiceTemplate as HTMLElement).style.width = '100%';
        (invoiceTemplate as HTMLElement).style.height = '100%';

        // Find the content container
        const contentContainer = previewRef.current.querySelector('.a4-content');
        if (contentContainer) {
          (contentContainer as HTMLElement).style.width = '100%';
          (contentContainer as HTMLElement).style.height = '100%';
          (contentContainer as HTMLElement).style.justifyContent = 'stretch';
          (contentContainer as HTMLElement).style.alignItems = 'stretch';
        }

        // Ensure all images are loaded
        const images = invoiceTemplate.querySelectorAll('img');
        images.forEach(img => {
          if (!img.complete) {
            img.style.visibility = 'visible';
          }
        });

        // Ensure all table borders are visible
        const tables = invoiceTemplate.querySelectorAll('table');
        tables.forEach(table => {
          (table as HTMLElement).style.borderCollapse = 'collapse';
        });

        // Ensure all colors are properly rendered
        (invoiceTemplate as HTMLElement).style.WebkitPrintColorAdjust = 'exact';
        (invoiceTemplate as HTMLElement).style.printColorAdjust = 'exact';
      };

      // Prepare the preview for PDF generation
      preparePreviewForPdf();

      // Wait a moment for any style changes to apply
      await new Promise(resolve => setTimeout(resolve, 100));

      // Download the PDF using our simplified generator
      await downloadSimplePdf(
        previewRef.current,
        order,
        (status, currentProgress) => {
          // Update progress if provided
          if (currentProgress !== undefined) {
            setProgress(currentProgress);
          }

          // Only update the toast when status changes to avoid redundant updates
          if (status === 'Preparing download...') {
            toast({
              id: toastId,
              title: "Preparing download",
              description: "Your invoice will download shortly... The PDF will match exactly what you see in the preview.",
            });
          }
        }
      );

      // Show success toast
      toast({
        id: toastId,
        title: "Success",
        description: "Your invoice has been downloaded successfully.",
        variant: "default",
      });
    } catch (err) {
      console.error('Error generating PDF:', err);

      // Set error state
      setError(err instanceof Error ? err.message : 'An unknown error occurred');

      // Show error toast
      toast({
        id: toastId,
        title: "Error",
        description: `Failed to generate invoice: ${err instanceof Error ? err.message : 'An unknown error occurred'}`,
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
