import { useState, useRef } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Order } from '@/types/orders';
import { generateEnhancedPdf, generatePdfPreview } from '../utils/enhancedPdfGenerator';

/**
 * Custom hook for enhanced invoice PDF generation
 */
export const useEnhancedInvoiceGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  /**
   * Generate and download a PDF invoice
   */
  const generatePdf = async (order: Order) => {
    if (!previewRef.current) {
      toast({
        title: "Error",
        description: "Could not find invoice template",
        variant: "destructive",
      });
      return;
    }

    // Create a unique toast ID to update the same toast
    const toastId = `invoice-${Date.now()}`;

    try {
      setIsGenerating(true);
      setProgress(0);

      // Show initial toast
      toast({
        id: toastId,
        title: "Generating invoice",
        description: "Preparing your invoice...",
      });

      // Generate and download the PDF
      await generateEnhancedPdf(
        previewRef.current,
        order,
        (status, currentProgress) => {
          // Update progress if provided
          if (currentProgress !== undefined) {
            setProgress(currentProgress);
          }

          // Update toast with current status
          toast({
            id: toastId,
            title: "Generating invoice",
            description: status,
          });
        }
      );

      // Show success toast
      toast({
        title: "Success",
        description: "Invoice downloaded successfully",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      
      // Show error toast
      toast({
        title: "Error",
        description: "Failed to generate invoice",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setProgress(0);
    }
  };

  /**
   * Generate a PDF preview for display in an iframe
   */
  const generatePreview = async () => {
    if (!previewRef.current) {
      toast({
        title: "Error",
        description: "Could not find invoice template",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsGenerating(true);
      setProgress(0);

      // Generate PDF preview
      const pdfUrl = await generatePdfPreview(
        previewRef.current,
        (status, currentProgress) => {
          // Update progress if provided
          if (currentProgress !== undefined) {
            setProgress(currentProgress);
          }
        }
      );

      // Set the preview URL
      setPreviewUrl(pdfUrl);
    } catch (error) {
      console.error('Error generating PDF preview:', error);
      
      // Show error toast
      toast({
        title: "Error",
        description: "Failed to generate invoice preview",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setProgress(0);
    }
  };

  return {
    generatePdf,
    generatePreview,
    isGenerating,
    progress,
    previewRef,
    previewUrl,
  };
};

export default useEnhancedInvoiceGeneration;
