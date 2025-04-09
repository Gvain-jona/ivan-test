import { useCallback } from 'react';
import { 
  UseInvoiceActionsProps, 
  UseInvoiceActionsReturn 
} from '../types';

/**
 * Custom hook for invoice-related actions like download and print
 * 
 * @param invoiceUrl - The URL of the generated invoice
 * @returns Object containing functions to download and print the invoice
 */
const useInvoiceActions = ({ 
  invoiceUrl 
}: UseInvoiceActionsProps): UseInvoiceActionsReturn => {
  /**
   * Handles downloading the invoice
   */
  const handleDownload = useCallback(() => {
    if (!invoiceUrl) return;
    
    // In a real app, this would download the PDF file
    // For now, we'll just open the URL in a new tab
    window.open(invoiceUrl, '_blank');
  }, [invoiceUrl]);
  
  /**
   * Handles printing the invoice
   */
  const handlePrint = useCallback(() => {
    if (!invoiceUrl) return;
    
    // In a real app, this would print the invoice
    // For now, we'll just simulate printing by opening the URL
    const printWindow = window.open(invoiceUrl, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  }, [invoiceUrl]);
  
  return {
    handleDownload,
    handlePrint
  };
};

export default useInvoiceActions;
