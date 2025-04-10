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
   * Handles downloading the invoice as a PDF
   */
  const handleDownload = useCallback(() => {
    if (!invoiceUrl) return;
    
    try {
      // Create a link element
      const link = document.createElement('a');
      
      // Set the href to the invoice URL
      link.href = invoiceUrl;
      
      // Set the download attribute to force download instead of navigation
      link.download = `Invoice-${new Date().getTime()}.pdf`;
      
      // Append the link to the body
      document.body.appendChild(link);
      
      // Trigger the download
      link.click();
      
      // Remove the link from the DOM
      document.body.removeChild(link);
    } catch (error) {
      console.error('Failed to download invoice:', error);
    }
  }, [invoiceUrl]);
  
  /**
   * Handles printing the invoice
   */
  const handlePrint = useCallback(() => {
    if (!invoiceUrl) return;
    
    try {
      // Open the invoice in a new window for printing
      const printWindow = window.open(invoiceUrl, '_blank');
      
      // Wait for the window to load before printing
      if (printWindow) {
        printWindow.addEventListener('load', () => {
          printWindow.print();
        });
      }
    } catch (error) {
      console.error('Failed to print invoice:', error);
    }
  }, [invoiceUrl]);
  
  return {
    handleDownload,
    handlePrint
  };
};

export default useInvoiceActions;
