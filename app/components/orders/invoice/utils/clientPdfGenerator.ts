import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Order } from '@/types/orders';
import { InvoiceSettings } from '../types';
import { formatInvoiceFilename } from '@/lib/utils/downloadUtils';
import { A4_DIMENSIONS, PDF_QUALITY } from './constants';

/**
 * Generates a PDF from the invoice preview HTML element
 * This ensures the PDF exactly matches what the user sees in the preview
 *
 * @param previewElement The HTML element containing the invoice preview
 * @param order The order data
 * @returns A Promise that resolves to a Blob containing the PDF
 */
export const generatePdfFromPreview = async (
  previewElement: HTMLElement,
  order: Order,
  quality: number = PDF_QUALITY.PRINT
): Promise<Blob> => {
  if (!previewElement) {
    throw new Error('Preview element not found');
  }

  // Find the actual invoice template inside the container
  const invoiceTemplate = previewElement.querySelector('.invoice-template');

  if (!invoiceTemplate) {
    throw new Error('Invoice template not found inside preview element');
  }

  // Create a loading overlay
  const loadingOverlay = document.createElement('div');
  loadingOverlay.style.position = 'absolute';
  loadingOverlay.style.inset = '0';
  loadingOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
  loadingOverlay.style.display = 'flex';
  loadingOverlay.style.alignItems = 'center';
  loadingOverlay.style.justifyContent = 'center';
  loadingOverlay.style.zIndex = '50';
  loadingOverlay.style.color = 'white';
  loadingOverlay.style.fontSize = '16px';
  loadingOverlay.style.fontWeight = 'bold';
  loadingOverlay.innerHTML = '<div>Generating PDF...</div>';

  // Store original styles
  const originalPosition = previewElement.style.position;
  const originalOverflow = previewElement.style.overflow;

  // Apply temporary styles for better rendering
  previewElement.style.position = 'relative';
  previewElement.style.overflow = 'visible';

  // Add the loading overlay to the preview element
  previewElement.appendChild(loadingOverlay);

  try {
    // Find the actual A4 content container
    const a4Content = previewElement.querySelector('.a4-content');
    if (!a4Content) {
      throw new Error('A4 content container not found');
    }

    // Find the invoice template inside the A4 content container
    const invoiceTemplate = a4Content.querySelector('.invoice-template');
    if (!invoiceTemplate) {
      throw new Error('Invoice template not found inside A4 content container');
    }

    // Create a clone of the invoice template for rendering
    const templateClone = invoiceTemplate.cloneNode(true) as HTMLElement;

    // Create a temporary container with fixed A4 dimensions
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '-9999px';
    tempContainer.style.width = `${A4_DIMENSIONS.PIXELS.WIDTH}px`; // A4 width in pixels
    tempContainer.style.height = `${A4_DIMENSIONS.PIXELS.HEIGHT}px`; // A4 height in pixels
    tempContainer.style.overflow = 'hidden'; // Hide overflow
    tempContainer.style.backgroundColor = 'white';

    // Style the template clone to exactly match the A4 dimensions
    templateClone.style.width = '100%';
    templateClone.style.height = '100%';
    templateClone.style.margin = '0';
    templateClone.style.padding = '0'; // No padding - design covers entire page
    templateClone.style.boxSizing = 'border-box';
    templateClone.style.borderRadius = '0'; // Remove rounded corners
    templateClone.style.border = 'none'; // Remove border
    templateClone.style.boxShadow = 'none'; // Remove shadow
    templateClone.style.overflow = 'hidden'; // Hide overflow
    templateClone.style.backgroundColor = 'white'; // Ensure white background
    templateClone.style.display = 'flex';
    templateClone.style.flexDirection = 'column';

    // Append the clone to the temporary container
    tempContainer.appendChild(templateClone);

    // Append the temporary container to the document body
    document.body.appendChild(tempContainer);

    // Wait a moment for the DOM to update
    await new Promise(resolve => setTimeout(resolve, 100));

    // Use html2canvas to capture the template clone
    const canvas = await html2canvas(templateClone, {
      scale: quality, // Use provided quality factor
      useCORS: true, // Allow cross-origin images
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false, // Disable logging for production
      removeContainer: false, // Don't remove the container automatically
      windowWidth: A4_DIMENSIONS.PIXELS.WIDTH, // Exact A4 width
      windowHeight: A4_DIMENSIONS.PIXELS.HEIGHT, // Exact A4 height
      scrollY: 0,
      scrollX: 0,
      onclone: (clonedDoc) => {
        // Additional styling for the cloned document if needed
        const clonedElement = clonedDoc.querySelector('.invoice-template');
        if (clonedElement) {
          // Force specific styles to match A4 dimensions
          (clonedElement as HTMLElement).style.width = '100%';
          (clonedElement as HTMLElement).style.height = '100%';
          (clonedElement as HTMLElement).style.padding = '0';
          (clonedElement as HTMLElement).style.backgroundColor = 'white';
          (clonedElement as HTMLElement).style.position = 'relative';
          (clonedElement as HTMLElement).style.boxSizing = 'border-box';
          (clonedElement as HTMLElement).style.display = 'flex';
          (clonedElement as HTMLElement).style.flexDirection = 'column';

          // Ensure all text is visible in the PDF
          const allTextElements = clonedElement.querySelectorAll('p, span, h1, h2, h3, h4, h5, h6, td, th');
          allTextElements.forEach((el) => {
            (el as HTMLElement).style.color = '#000';
            (el as HTMLElement).style.fontSize = (el as HTMLElement).style.fontSize || '10px';
          });

          // Ensure table fits properly
          const tables = clonedElement.querySelectorAll('table');
          tables.forEach((table) => {
            (table as HTMLElement).style.width = '100%';
            (table as HTMLElement).style.tableLayout = 'fixed';
            (table as HTMLElement).style.borderCollapse = 'collapse';
          });

          // Ensure notes and payment details are at the bottom
          const flexGrow = clonedElement.querySelector('.flex-grow');
          if (flexGrow) {
            (flexGrow as HTMLElement).style.flexGrow = '1';
          }

          // Ensure copyright footer is black
          const copyrightFooter = clonedElement.querySelector('.bg-black');
          if (copyrightFooter) {
            (copyrightFooter as HTMLElement).style.backgroundColor = '#000';
            (copyrightFooter as HTMLElement).style.color = '#fff';
          }
        }
      }
    });

    // Create a PDF with exact A4 dimensions
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // A4 dimensions in mm
    const pdfWidth = A4_DIMENSIONS.MM.WIDTH;
    const pdfHeight = A4_DIMENSIONS.MM.HEIGHT;

    // Convert canvas to image data
    const imgData = canvas.toDataURL('image/png', 1.0);

    // Add the image to the PDF - exact A4 size with no scaling or cropping
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

    // Convert the PDF to a Blob
    const pdfBlob = pdf.output('blob');
    return pdfBlob;
  } finally {
    // Remove the loading overlay
    if (previewElement.contains(loadingOverlay)) {
      previewElement.removeChild(loadingOverlay);
    }

    // Remove the temporary container if it was created
    const tempContainer = document.querySelector('div[style*="-9999px"]');
    if (tempContainer && document.body.contains(tempContainer)) {
      document.body.removeChild(tempContainer);
    }

    // Restore original styles
    previewElement.style.position = originalPosition;
    previewElement.style.overflow = originalOverflow;
  }
};

/**
 * Downloads the invoice PDF
 *
 * @param previewElement The HTML element containing the invoice preview
 * @param order The order data
 * @param onProgress Callback for progress updates
 * @returns A Promise that resolves when the download is complete
 */
export const downloadInvoicePdf = async (
  previewElement: HTMLElement,
  order: Order,
  onProgress?: (status: string, progress?: number) => void,
  quality: number = PDF_QUALITY.PRINT
): Promise<void> => {
  try {
    // Update progress - start at 10%
    onProgress?.('Generating PDF...', 10);

    // Generate the PDF
    const pdfBlob = await generatePdfFromPreview(previewElement, order, quality);

    // Update progress - 80% complete after PDF generation
    onProgress?.('Preparing download...', 80);

    // Create a filename with date for better organization
    const orderNumber = order.order_number || `ORD-${order.id.substring(0, 8)}`;
    const clientName = order.client_name || 'Client';
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const filename = formatInvoiceFilename(orderNumber, clientName, date);

    // Create a download link
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;

    // Trigger the download
    document.body.appendChild(link);
    link.click();

    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Update progress - 100% complete
    onProgress?.('Download complete', 100);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};
