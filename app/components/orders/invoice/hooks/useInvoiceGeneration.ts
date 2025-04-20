import { useState, useCallback } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { useToast } from "@/components/ui/use-toast";
import { formatCurrency, formatDate } from "@/lib/utils";
import { InvoiceSettings, UseInvoiceGenerationReturn } from "../types";
import { createClient } from '@/lib/supabase/client';
import { Order, OrderItem } from "@/types/orders";

// Define the upload invoice props interface that was missing
interface UploadInvoiceProps {
  storageId: string;
  storagePath: string;
  publicUrl: string;
}

export default function useInvoiceGeneration(
  params: { orderId?: string, order?: Order | null }
): UseInvoiceGenerationReturn {
  const { orderId, order } = params;
  const [isGenerating, setIsGenerating] = useState(false);
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Get current user ID from Supabase auth
  const getUserId = useCallback(async (): Promise<string> => {
    try {
      const supabase = createClient();
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error) {
        console.error('Error getting user:', error);
        return 'anonymous';
      }

      if (!user) {
        console.warn('No user found in auth context');
        return 'anonymous';
      }

      return user.id;
    } catch (err) {
      console.error('Error in getUserId:', err);
      return 'anonymous';
    }
  }, []);

  const resetInvoice = useCallback(() => {
    setInvoiceUrl(null);
    setError(null);
  }, []);

  const generatePdf = useCallback(async (customSettings: InvoiceSettings) => {
    if (!order && !orderId) {
      setError("Missing required data to generate invoice");
      return null;
    }

    // Create a new PDF document
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: customSettings.format || "a4",
    });

    // Set up colors
    const primaryColor = "#ff5500"; // Orange color
    const textColor = "#333333";
    const lightGray = "#f5f5f5";

    // Add company header with logo space
    if (customSettings.includeHeader) {
      doc.setFillColor(primaryColor);
      doc.rect(0, 0, 210, 40, "F");

      // Company name
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(24);
      doc.text(customSettings.companyName || "IVAN PRINTS", 15, 20);

      // Company tagline
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(customSettings.customHeader || "PRINTING | DESIGNING | BRANDING", 15, 28);

      // Contact information
      doc.setFontSize(9);
      doc.text(`Email: ${customSettings.companyEmail || "sherilex256@gmail.com"}`, 15, 35);
      doc.text(`Phone: ${customSettings.companyPhone || "0755 541 373"}`, 90, 35);
      doc.text(`TIN: ${customSettings.tinNumber || "1028570150"}`, 165, 35);
    }

    // Invoice header
    doc.setFillColor(245, 245, 245);
    doc.rect(0, 45, 210, 15, "F");

    doc.setTextColor(textColor);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("INVOICE", 15, 55);

    // Invoice information
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const invoiceNumber = `#${(order?.id || orderId || "").substring(0, 8).toUpperCase()}`;
    doc.text(`Invoice Number:`, 120, 52);
    doc.setFont("helvetica", "bold");
    doc.text(invoiceNumber, 160, 52);

    doc.setFont("helvetica", "normal");
    doc.text(`Date:`, 120, 58);
    doc.setFont("helvetica", "bold");
    doc.text(formatDate(new Date().toISOString()), 160, 58);

    // Client information
    doc.setFillColor(255, 255, 255);
    doc.rect(15, 70, 80, 40, "F");

    doc.setTextColor(textColor);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Bill To:", 15, 75);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(order?.client_name || "N/A", 15, 82);

    // Order summary
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Order Summary", 120, 75);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const created_at = order?.created_at ? new Date(order.created_at).toISOString() : new Date().toISOString();
    doc.text(`Order Date: ${formatDate(created_at)}`, 120, 82);
    doc.text(`Payment Terms: ${customSettings.paymentTerms || "Due on receipt"}`, 120, 88);
    doc.text(`Order Status: ${order?.status || "In Progress"}`, 120, 94);

    // Line items table
    const tableHeaders = [["Item", "Quantity", "Price", "Total"]];
    const tableData = order?.items?.map((item: OrderItem) => {
      // Format the item display based on settings
      let itemDisplay = '';

      if (customSettings.itemDisplayFormat === 'combined') {
        // Combined format
        const parts = [];
        if (customSettings.showItemCategory && item.category_name) parts.push(item.category_name);
        if (customSettings.showItemName && item.item_name) parts.push(item.item_name);
        itemDisplay = parts.join(' - ');
        if (customSettings.showItemSize && item.size) itemDisplay += ` (${item.size})`;
      } else {
        // Default to item name if nothing is selected
        itemDisplay = customSettings.showItemName ? item.item_name : 'Item';
      }

      return [
        itemDisplay,
        item.quantity.toString(),
        formatCurrency(item.unit_price),
        formatCurrency(item.total_amount)
      ];
    }) || [];

    autoTable(doc, {
      head: tableHeaders,
      body: tableData,
      startY: 115,
      theme: 'grid',
      headStyles: {
        fillColor: primaryColor,
        textColor: '#ffffff',
        fontStyle: 'bold',
        halign: 'center'
      },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 30, halign: 'center' },
        2: { cellWidth: 40, halign: 'right' },
        3: { cellWidth: 40, halign: 'right' }
      },
      alternateRowStyles: {
        fillColor: [250, 250, 250]
      },
      margin: { left: 15, right: 15 }
    });

    // Calculate final Y position after table
    const finalY = (doc as any).lastAutoTable.finalY + 10;

    // Totals section
    doc.setFillColor(lightGray);
    doc.rect(120, finalY, 75, 40, "F");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Subtotal:", 125, finalY + 10);
    doc.text("Tax:", 125, finalY + 20);
    doc.setFont("helvetica", "bold");
    doc.text("Total:", 125, finalY + 30);

    // Calculate totals
    const subtotal = order?.total_amount || 0;
    const taxRate = 0; // No tax for now
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;

    // Display totals
    doc.setFont("helvetica", "normal");
    doc.setTextColor(textColor);
    doc.text(formatCurrency(subtotal), 175, finalY + 10, { align: "right" });
    doc.text(`${formatCurrency(taxAmount)} (${taxRate}%)`, 175, finalY + 20, { align: "right" });
    doc.setFont("helvetica", "bold");
    doc.text(formatCurrency(total), 175, finalY + 30, { align: "right" });

    // Payment information section - using details from the image
    const paymentDetailsY = finalY + 10;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Payment Details", 15, paymentDetailsY);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    // Bank details from the image
    const bankName = customSettings.bankName || "ABSA BANK";
    const accountName = customSettings.accountName || "IVAN PRINTS";
    const accountNumber = customSettings.accountNumber || "6008084570";

    // Mobile money details from the image
    const mobileProvider = customSettings.mobileProvider || "Airtel";
    const mobileNumber = customSettings.mobilePhone || "0755 541 373";
    const mobileContact = customSettings.mobileContact || "(Vuule Abdul)";

    // Bank details section
    doc.text("Bank Details", 15, paymentDetailsY + 10);
    doc.text(`Account Name: ${accountName}`, 15, paymentDetailsY + 17);
    doc.text(`Bank / Branch: ${bankName}`, 15, paymentDetailsY + 24);
    doc.text(`ACCOUNT Number: ${accountNumber}`, 15, paymentDetailsY + 31);

    // Mobile money section
    doc.text("Mobile money", 15, paymentDetailsY + 41);
    doc.text(`${mobileProvider}`, 15, paymentDetailsY + 48);
    doc.text(`${mobileNumber}`, 15, paymentDetailsY + 55);
    doc.text(`${mobileContact}`, 15, paymentDetailsY + 62);

    // Footer
    if (customSettings.includeFooter) {
      doc.setFillColor(primaryColor);
      doc.rect(0, 270, 210, 27, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      const footerText = "M a k i n g   Y o u   V i s i b l e .";
      doc.text(footerText, 105, 286, { align: "center" });
    }

    // Return the generated PDF
    const pdfBlob = doc.output("blob");
    return pdfBlob;
  }, [order, orderId]);

  /**
   * Uploads the generated invoice PDF to Supabase storage
   */
  const uploadInvoice = useCallback(
    async (pdfBlob: Blob): Promise<UploadInvoiceProps> => {
      try {
        const userId = await getUserId();
        if (!userId || (!order?.id && !orderId)) throw new Error("Missing required data");

        const orderIdToUse = order?.id || orderId;
        const supabase = createClient();
        const bucketName = "invoices";

        try {
          // Check if bucket exists
          const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();

          // Create bucket if it doesn't exist
          const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
          if (!bucketExists) {
            await supabase.storage.createBucket(bucketName, {
              public: true,
              fileSizeLimit: 5 * 1024 * 1024, // 5MB limit
            });
          }
        } catch (bucketSetupError) {
          // Continue with the upload anyway
        }

        const filename = `invoice_${orderIdToUse}_${Date.now()}.pdf`;
        const storagePath = `${userId}/invoices/${filename}`;

        // Upload the PDF
        const { data, error } = await supabase.storage
          .from(bucketName)
          .upload(storagePath, pdfBlob, {
            contentType: "application/pdf",
            upsert: true,
          });

        if (error) {
          throw new Error(error.message);
        }

        // Get a public URL for the uploaded file
        const {
          data: { publicUrl },
        } = supabase.storage.from(bucketName).getPublicUrl(storagePath);

        return {
          storageId: data?.id || "",
          storagePath: storagePath,
          publicUrl: publicUrl,
        };
      } catch (error) {
        throw new Error(
          `Failed to upload invoice: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    },
    [getUserId, order, orderId]
  );

  /**
   * Creates an invoice record in the database
   */
  const createInvoiceRecord = useCallback(
    async (fileUrl: string, storagePath: string, settings: InvoiceSettings): Promise<void> => {
      try {
        const userId = await getUserId();
        const orderIdToUse = order?.id || orderId;

        if (!userId || !orderIdToUse) {
          throw new Error("Missing required data");
        }

        const apiUrl = `/api/orders/${orderIdToUse}/invoice`;

        // Call the API to create an invoice record
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fileUrl,
            storagePath,
            settings,
            isProforma: false,
            createdBy: userId,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          // Don't throw an error, just return to continue with invoice generation
          return;
        }

        // Success - the invoice record has been created
        await response.json();
      } catch (error) {
        // Don't throw an error, just continue with invoice generation
      }
    },
    [getUserId, order, orderId]
  );

  /**
   * Generates and uploads an invoice with custom settings
   */
  const generateInvoiceWithSettings = useCallback(async (customSettings: InvoiceSettings): Promise<void> => {
    try {
      setIsGenerating(true);
      setError(null);

      if ((!order?.id && !orderId)) {
        throw new Error("Order details not available");
      }

      // Generate the PDF with custom settings
      const pdfBlob = await generatePdf(customSettings);
      if (!pdfBlob) {
        throw new Error("Failed to generate PDF");
      }

      // Upload the PDF to Supabase
      const uploadResult = await uploadInvoice(pdfBlob);
      const { publicUrl, storagePath } = uploadResult;

      // Set the invoice URL immediately after upload succeeds
      // This ensures the UI updates even if the database record creation fails
      setInvoiceUrl(publicUrl);

      // Try to create the invoice record in the database, but don't block on it
      try {
        await createInvoiceRecord(publicUrl, storagePath, customSettings);

        toast({
          title: "Invoice generated",
          description: "The invoice has been successfully generated and saved.",
        });
      } catch (recordError) {
        // Still show success toast since the PDF was generated and uploaded
        toast({
          title: "Invoice generated",
          description: "The invoice has been generated, but there was an issue saving the record.",
        });
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate invoice"
      );
      toast({
        title: "Invoice generation failed",
        description:
          err instanceof Error
            ? err.message
            : "An error occurred while generating the invoice",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  }, [order, orderId, generatePdf, uploadInvoice, createInvoiceRecord, toast]);

  return {
    invoiceUrl,
    isGenerating,
    error,
    generateInvoiceWithSettings,
    resetInvoice,
  };
}
