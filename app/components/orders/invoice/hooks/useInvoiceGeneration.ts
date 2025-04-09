import { useState } from 'react';
import { generateInvoice } from '@/lib/api';
import { 
  InvoiceSettings, 
  UseInvoiceGenerationProps, 
  UseInvoiceGenerationReturn 
} from '../types';

/**
 * Custom hook for managing invoice generation
 * 
 * @param orderId - The ID of the order to generate an invoice for
 * @returns Object containing invoice URL, loading state, and functions to generate and reset the invoice
 */
const useInvoiceGeneration = ({ 
  orderId 
}: UseInvoiceGenerationProps): UseInvoiceGenerationReturn => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null);
  
  /**
   * Generates an invoice with the provided settings
   * 
   * @param settings - The invoice settings to use for generation
   */
  const generateInvoiceWithSettings = async (settings: InvoiceSettings) => {
    try {
      setIsGenerating(true);
      
      // In a real implementation, we would pass the settings to the API
      // For now, we'll just call the placeholder function
      const url = await generateInvoice(orderId, settings);
      
      setInvoiceUrl(url);
    } catch (error) {
      console.error('Failed to generate invoice:', error);
      // Here you would handle errors, perhaps by setting an error state
      // or showing a toast notification
    } finally {
      setIsGenerating(false);
    }
  };
  
  /**
   * Resets the invoice state
   */
  const resetInvoice = () => {
    setInvoiceUrl(null);
  };
  
  return {
    invoiceUrl,
    isGenerating,
    generateInvoiceWithSettings,
    resetInvoice
  };
};

export default useInvoiceGeneration;
