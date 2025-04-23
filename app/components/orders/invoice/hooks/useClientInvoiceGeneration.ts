import { useState, useCallback, useRef } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Order } from '@/types/orders';
import { downloadInvoicePdf, downloadInvoiceAsImage } from '../utils/clientPdfGenerator';
import { PDF_SCALE_FACTOR } from '../utils/constants';
import { createSWRConfig } from '@/lib/swr-config';

// Quality options for PDF generation
export type PdfQuality = 'standard' | 'high';

// Output format options
export type OutputFormat = 'pdf' | 'image';

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
  generateAndDownloadImage: () => Promise<void>;
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

  /**
   * Generates and downloads a high-quality image of the invoice
   * This is useful for debugging and for cases where the exact preview appearance is critical
   */
  const generateAndDownloadImage = useCallback(async (): Promise<void> => {
    if (!order || !previewRef.current) {
      toast({
        title: "Error",
        description: "Cannot generate image: Missing order data or preview element",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setError(null);

    // Create a single toast that we'll update
    const toastId = "invoice-image-generation";

    try {
      // Show initial toast
      toast({
        id: toastId,
        title: "Generating Image",
        description: "Please wait while we prepare your invoice as an image... This will match exactly what you see in the preview.",
      });

      // Reset progress
      setProgress(0);

      // Generate and download the image
      await downloadInvoiceAsImage(
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
              description: "Your invoice image will download shortly... The image will match exactly what you see in the preview.",
            });
          }
        }
      );

      // Update the same toast with success message
      toast({
        id: toastId,
        title: "Download successful",
        description: "Your invoice has been downloaded as a high-quality image.",
        variant: "success",
      });
    } catch (err) {
      console.error('Error generating image:', err);

      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);

      // Update the same toast with error message
      toast({
        id: toastId,
        title: "Image generation failed",
        description: `There was a problem generating your invoice image: ${errorMessage}`,
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
    generateAndDownloadImage,
  };
}
