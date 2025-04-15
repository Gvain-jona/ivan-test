import { useState, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import { InvoiceSettings, UseInvoiceGenerationReturn } from "../types";
import { Order } from "@/types/orders";
import { useRouter } from "next/navigation";

/**
 * Custom hook for generating invoices using server-side PDF generation
 * This is much faster than client-side generation with jsPDF
 *
 * @param params - Object containing orderId and/or order data
 * @returns Object with invoice state and functions
 */
export default function useServerInvoiceGeneration(
  params: { orderId?: string, order?: Order | null }
): UseInvoiceGenerationReturn {
  const { orderId, order } = params;
  const [isGenerating, setIsGenerating] = useState(false);
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  /**
   * Reset the invoice state
   */
  const resetInvoice = useCallback(() => {
    setInvoiceUrl(null);
    setError(null);
  }, []);

  /**
   * Generates an invoice with custom settings using server-side generation
   * This is called when the user clicks the Download PDF button
   */
  const generateInvoiceWithSettings = useCallback(async (customSettings: InvoiceSettings): Promise<void> => {
    try {
      setIsGenerating(true);
      setError(null);

      if ((!order?.id && !orderId)) {
        throw new Error("Order details not available");
      }

      const orderIdToUse = order?.id || orderId;

      // Check if we already have a generated invoice URL
      if (invoiceUrl) {
        // If we already have a URL, we can just download it directly
        // This prevents regenerating the same PDF multiple times
        window.open(invoiceUrl, '_blank');
        return;
      }

      // Call the server-side API to generate the PDF
      const response = await fetch('/api/invoices/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: orderIdToUse,
          settings: customSettings,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate invoice');
      }

      const data = await response.json();

      // Set the invoice URL
      setInvoiceUrl(data.url);

      // Open the PDF in a new tab
      window.open(data.url, '_blank');

      toast({
        title: "PDF Generated",
        description: "Your invoice PDF has been generated and downloaded.",
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate invoice"
      );
      toast({
        title: "PDF generation failed",
        description:
          err instanceof Error
            ? err.message
            : "An error occurred while generating the invoice PDF",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  }, [order, orderId, toast, invoiceUrl]);

  return {
    invoiceUrl,
    isGenerating,
    error,
    generateInvoiceWithSettings,
    resetInvoice,
  };
}
