import { useState, useCallback, useRef } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Order } from '@/types/orders';
import { downloadInvoicePdf } from '../utils/clientPdfGenerator';
import { PDF_SCALE_FACTOR } from '../utils/constants';
import { createSWRConfig } from '@/lib/swr-config';

// Quality options for PDF generation
export type PdfQuality = 'standard' | 'high';

// Scale factors for different quality levels
const QUALITY_SCALE_FACTORS = {
  standard: 1,
  high: 2
};

interface UseClientInvoiceGenerationProps {
  order: Order | null;
}

interface UseClientInvoiceGenerationReturn {
  isGenerating: boolean;
  progress: number;
  error: string | null;
  previewRef: React.RefObject<HTMLDivElement>;
  generateAndDownloadPdf: (quality?: PdfQuality) => Promise<void>;
}

/**
 * Hook for client-side invoice generation
 * This generates a PDF that exactly matches the preview
 */
export default function useClientInvoiceGeneration({
  order
}: UseClientInvoiceGenerationProps): UseClientInvoiceGenerationReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  /**
   * Generates and downloads a PDF from the preview
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

    // Get scale factor based on quality
    const scaleFactor = QUALITY_SCALE_FACTORS[quality];

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
      setProgress(0);

      // Override the PDF_SCALE_FACTOR with our quality setting
      // This is a bit of a hack, but it works without changing the core PDF generation logic
      const originalScaleFactor = (window as any).__PDF_SCALE_FACTOR_OVERRIDE;
      (window as any).__PDF_SCALE_FACTOR_OVERRIDE = scaleFactor;

      // Generate and download the PDF
      await downloadInvoicePdf(
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

      // Restore original scale factor
      if (originalScaleFactor !== undefined) {
        (window as any).__PDF_SCALE_FACTOR_OVERRIDE = originalScaleFactor;
      } else {
        delete (window as any).__PDF_SCALE_FACTOR_OVERRIDE;
      }

      // Update the same toast with success message
      toast({
        id: toastId,
        title: "Download successful",
        description: `Your invoice has been downloaded successfully at ${quality === 'high' ? 'high' : 'standard'} quality with exact A4 dimensions.`,
        variant: "success",
      });
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
