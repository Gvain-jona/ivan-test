import { useCallback, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import {
  UseInvoiceActionsProps,
  UseInvoiceActionsReturn
} from '../types';
import { downloadFile, formatInvoiceFilename } from '@/lib/utils/downloadUtils';

/**
 * Custom hook for invoice-related actions like download and print
 *
 * @param invoiceUrl - The URL of the generated invoice
 * @returns Object containing functions to download and print the invoice
 */
const useInvoiceActions = ({
  invoiceUrl,
  order
}: UseInvoiceActionsProps): UseInvoiceActionsReturn => {
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();
  /**
   * Handles downloading the invoice as a PDF with proper filename
   */
  const handleDownload = useCallback(async () => {
    if (!invoiceUrl || !order) return;

    setIsDownloading(true);
    toast({
      title: "Preparing download...",
      description: "Your invoice is being prepared for download.",
    });

    try {
      // Format the filename using order number, client name, and date
      const orderNumber = order.order_number || `ORD-${order.id.substring(0, 8)}`;
      const clientName = order.client_name || 'Client';
      const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      const filename = formatInvoiceFilename(orderNumber, clientName, date);

      // Download the file with the formatted filename
      await downloadFile(invoiceUrl, filename);

      toast({
        title: "Download successful",
        description: `Invoice for ${orderNumber} has been downloaded.`,
        variant: "success",
      });
    } catch (error) {
      console.error('Failed to download invoice:', error);
      toast({
        title: "Download failed",
        description: "There was a problem downloading your invoice. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  }, [invoiceUrl, order, toast]);

  /**
   * Handles printing the invoice
   */
  const handlePrint = useCallback(() => {
    if (!invoiceUrl || !order) return;

    toast({
      title: "Opening print dialog...",
      description: "Your invoice is being prepared for printing.",
    });

    try {
      // Open the invoice in a new window for printing
      const printWindow = window.open(invoiceUrl, '_blank');

      // Wait for the window to load before printing
      if (printWindow) {
        printWindow.addEventListener('load', () => {
          printWindow.print();
        });
      } else {
        toast({
          title: "Print dialog blocked",
          description: "Please allow pop-ups to print the invoice.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Failed to print invoice:', error);
      toast({
        title: "Print failed",
        description: "There was a problem printing your invoice. Please try again.",
        variant: "destructive",
      });
    }
  }, [invoiceUrl, order, toast]);

  return {
    handleDownload,
    handlePrint,
    isDownloading
  };
};

export default useInvoiceActions;
