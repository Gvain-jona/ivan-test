import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Order } from '@/types/orders';
import { InvoiceSettings } from '../types';
import { formatInvoiceFilename } from '@/lib/utils/downloadUtils';
import { A4_DIMENSIONS, PDF_SCALE_FACTOR } from './constants';

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
  order: Order
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

    // IMPROVED APPROACH: Instead of cloning and moving off-screen, we'll capture directly
    // This ensures what you see is exactly what you get

    // First, let's make sure all styles are properly computed and applied
    // This helps with icon positioning and table layouts
    const allElements = invoiceTemplate.querySelectorAll('*');
    allElements.forEach((el) => {
      // Force a style recalculation to ensure all styles are applied
      window.getComputedStyle(el).getPropertyValue('position');
    });

    // Ensure all images are loaded before capturing
    const allImages = invoiceTemplate.querySelectorAll('img');
    await Promise.all(
      Array.from(allImages).map(
        (img) =>
          new Promise((resolve) => {
            if (img.complete) {
              resolve(null);
            } else {
              img.onload = () => resolve(null);
              img.onerror = () => resolve(null);
            }
          })
      )
    );

    // Use html2canvas with improved settings
    // Check if we have a scale factor override
    const scaleFactor = (window as any).__PDF_SCALE_FACTOR_OVERRIDE || PDF_SCALE_FACTOR;

    const canvas = await html2canvas(invoiceTemplate as HTMLElement, {
      scale: scaleFactor, // Use override or constant for scale factor
      useCORS: true, // Allow cross-origin images
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false, // Disable logging for production
      // Don't use windowWidth/windowHeight as they can cause scaling issues
      // Instead, let html2canvas determine the size from the element
      scrollY: 0,
      scrollX: 0,
      // Improved rendering options
      letterRendering: true, // Better text rendering
      foreignObjectRendering: false, // More reliable rendering
      // Capture at exact A4 dimensions
      width: A4_DIMENSIONS.PIXELS.WIDTH,
      height: A4_DIMENSIONS.PIXELS.HEIGHT,
      // Improved onclone function with more precise styling
      onclone: (clonedDoc) => {
        const clonedElement = clonedDoc.querySelector('.invoice-template');
        if (clonedElement) {
          // Force specific styles to match A4 dimensions
          (clonedElement as HTMLElement).style.width = `${A4_DIMENSIONS.PIXELS.WIDTH}px`;
          (clonedElement as HTMLElement).style.height = `${A4_DIMENSIONS.PIXELS.HEIGHT}px`;
          (clonedElement as HTMLElement).style.padding = '0';
          (clonedElement as HTMLElement).style.margin = '0';
          (clonedElement as HTMLElement).style.backgroundColor = 'white';
          (clonedElement as HTMLElement).style.position = 'relative';
          (clonedElement as HTMLElement).style.boxSizing = 'border-box';
          (clonedElement as HTMLElement).style.display = 'flex';
          (clonedElement as HTMLElement).style.flexDirection = 'column';
          (clonedElement as HTMLElement).style.overflow = 'hidden';
          (clonedElement as HTMLElement).style.transform = 'none'; // Remove any transforms
          (clonedElement as HTMLElement).style.borderRadius = '0';
          (clonedElement as HTMLElement).style.border = 'none';
          (clonedElement as HTMLElement).style.boxShadow = 'none';

          // Fix icon positioning - ensure all SVG and icon elements maintain position
          const iconElements = clonedElement.querySelectorAll('svg, .lucide, [class*="icon"]');
          iconElements.forEach((el) => {
            (el as HTMLElement).style.position = 'relative';
            (el as HTMLElement).style.display = 'inline-block';
            (el as HTMLElement).style.verticalAlign = 'middle';
            // Preserve dimensions
            const computedStyle = window.getComputedStyle(el);
            (el as HTMLElement).style.width = computedStyle.width;
            (el as HTMLElement).style.height = computedStyle.height;
          });

          // Fix table layout issues
          const tables = clonedElement.querySelectorAll('table');
          tables.forEach((table) => {
            (table as HTMLElement).style.width = '100%';
            (table as HTMLElement).style.tableLayout = 'fixed';
            (table as HTMLElement).style.borderCollapse = 'collapse';
            // Ensure cells maintain their width
            const cells = table.querySelectorAll('th, td');
            cells.forEach((cell) => {
              const computedStyle = window.getComputedStyle(cell);
              (cell as HTMLElement).style.width = computedStyle.width;
              (cell as HTMLElement).style.padding = computedStyle.padding;
              (cell as HTMLElement).style.textAlign = computedStyle.textAlign;
              // Ensure text doesn't wrap unexpectedly
              (cell as HTMLElement).style.whiteSpace = 'normal';
              (cell as HTMLElement).style.wordBreak = 'break-word';
            });
          });

          // Ensure all text is visible and properly positioned
          const allTextElements = clonedElement.querySelectorAll('p, span, h1, h2, h3, h4, h5, h6, td, th');
          allTextElements.forEach((el) => {
            const computedStyle = window.getComputedStyle(el);
            (el as HTMLElement).style.color = computedStyle.color;
            (el as HTMLElement).style.fontSize = computedStyle.fontSize;
            (el as HTMLElement).style.fontWeight = computedStyle.fontWeight;
            (el as HTMLElement).style.lineHeight = computedStyle.lineHeight;
            (el as HTMLElement).style.textAlign = computedStyle.textAlign;
            (el as HTMLElement).style.margin = computedStyle.margin;
            (el as HTMLElement).style.padding = computedStyle.padding;
          });

          // Ensure flex layout is preserved
          const flexElements = clonedElement.querySelectorAll('[class*="flex"]');
          flexElements.forEach((el) => {
            const computedStyle = window.getComputedStyle(el);
            (el as HTMLElement).style.display = computedStyle.display;
            (el as HTMLElement).style.flexDirection = computedStyle.flexDirection;
            (el as HTMLElement).style.justifyContent = computedStyle.justifyContent;
            (el as HTMLElement).style.alignItems = computedStyle.alignItems;
            (el as HTMLElement).style.flexGrow = computedStyle.flexGrow;
            (el as HTMLElement).style.flexShrink = computedStyle.flexShrink;
            (el as HTMLElement).style.flexBasis = computedStyle.flexBasis;
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

          // Ensure gradients are preserved
          const gradientElements = clonedElement.querySelectorAll('[class*="bg-gradient"]');
          gradientElements.forEach((el) => {
            const computedStyle = window.getComputedStyle(el);
            (el as HTMLElement).style.backgroundImage = computedStyle.backgroundImage;
            (el as HTMLElement).style.backgroundColor = computedStyle.backgroundColor;
          });

          // Ensure all images maintain position and size
          const images = clonedElement.querySelectorAll('img');
          images.forEach((img) => {
            const computedStyle = window.getComputedStyle(img);
            (img as HTMLElement).style.width = computedStyle.width;
            (img as HTMLElement).style.height = computedStyle.height;
            (img as HTMLElement).style.objectFit = computedStyle.objectFit as string;
            (img as HTMLElement).style.position = computedStyle.position;
          });
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
  onProgress?: (status: string, progress?: number) => void
): Promise<void> => {
  try {
    // Update progress - start at 10%
    onProgress?.('Generating PDF...', 10);

    // Generate the PDF
    const pdfBlob = await generatePdfFromPreview(previewElement, order);

    // Update progress - 80% complete after PDF generation
    onProgress?.('Preparing download...', 80);

    // Create a filename with date for better organization
    const orderNumber = order.order_number || (order.id ? `ORD-${order.id.substring(0, 8)}` : 'Unknown');
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
