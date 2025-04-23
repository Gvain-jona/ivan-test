'use client';

import { useState, useCallback } from 'react';
import { Order } from '@/types/orders';
import { PdfGenerationOptions } from '../types';
import { downloadPdf } from '../utils/pdfGenerator';
import { useToast } from '@/components/ui/use-toast';

/**
 * Hook for PDF generation
 * Handles the PDF generation process and provides progress updates
 */
export function usePdfGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();
  
  /**
   * Generate and download a PDF
   * 
   * @param element The HTML element to convert to PDF
   * @param order The order data
   * @param options PDF generation options
   */
  const generatePdf = useCallback(async (
    element: HTMLElement,
    order: Order,
    options: Partial<PdfGenerationOptions> = {}
  ) => {
    if (!element) return;
    
    try {
      setIsGenerating(true);
      setProgress(0);
      
      await downloadPdf(
        element, 
        order, 
        options,
        (downloadProgress) => {
          setProgress(downloadProgress);
        }
      );
      
      toast({
        title: 'Invoice Downloaded',
        description: 'Your invoice has been downloaded successfully.',
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      
      toast({
        title: 'Download Failed',
        description: 'There was an error downloading your invoice. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
      setProgress(0);
    }
  }, [toast]);
  
  return {
    isGenerating,
    progress,
    generatePdf,
  };
}
