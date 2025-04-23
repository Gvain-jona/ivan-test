import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Order } from '@/types/orders';
import { formatInvoiceFilename } from '@/lib/utils/downloadUtils';
import { A5_DIMENSIONS } from './constants';

/**
 * Simplified PDF generator for invoices
 * This uses a more direct approach with fewer manipulations to ensure
 * the PDF matches the preview exactly
 *
 * @param previewElement The HTML element containing the invoice preview
 * @param order The order data
 * @param onProgress Optional callback for progress updates
 * @returns A Promise that resolves to a Blob containing the PDF
 */
export const generateSimplePdf = async (
  previewElement: HTMLElement,
  order: Order,
  onProgress?: (status: string, progress?: number) => void
): Promise<Blob> => {
  if (!previewElement) {
    throw new Error('Preview element not found');
  }

  // Update progress if callback provided
  onProgress?.('Generating PDF...', 10);

  // Find the invoice template
  const invoiceTemplate = previewElement.querySelector('.invoice-template');
  if (!invoiceTemplate) {
    throw new Error('Invoice template not found');
  }

  try {
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

    // Update progress
    onProgress?.('Capturing template...', 30);

    // Use html2canvas with optimized settings for constrained template
    const canvas = await html2canvas(invoiceTemplate as HTMLElement, {
      scale: 3, // Higher scale for better quality
      useCORS: true, // Allow cross-origin images
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      // Capture at exact A5 dimensions
      width: A5_DIMENSIONS.PIXELS.WIDTH,
      height: A5_DIMENSIONS.PIXELS.HEIGHT,
      // Improved rendering options
      letterRendering: true,
      imageTimeout: 30000, // Longer timeout for images
      // Ensure the full width is captured
      windowWidth: A5_DIMENSIONS.PIXELS.WIDTH,
      windowHeight: A5_DIMENSIONS.PIXELS.HEIGHT,
      x: 0,
      y: 0,
      // Don't modify the clone - preserve exactly what's in the preview
      onclone: (clonedDoc) => {
        // Find the invoice template in the cloned document
        const clonedTemplate = clonedDoc.querySelector('.invoice-template');
        if (clonedTemplate) {
          // Ensure the template fills the entire page
          (clonedTemplate as HTMLElement).style.width = '100%';
          (clonedTemplate as HTMLElement).style.height = '100%';
          (clonedTemplate as HTMLElement).style.margin = '0';
          (clonedTemplate as HTMLElement).style.padding = '0';

          // Ensure all styles are computed and applied
          const computedStyle = window.getComputedStyle(invoiceTemplate as HTMLElement);

          // Apply computed styles to ensure consistency
          Array.from(computedStyle).forEach(property => {
            // Skip width, height, margin, and padding as we've already set them
            if (!['width', 'height', 'margin', 'padding'].includes(property)) {
              (clonedTemplate as HTMLElement).style[property as any] = computedStyle.getPropertyValue(property);
            }
          });

          // Ensure all images are properly sized and positioned
          const images = clonedTemplate.querySelectorAll('img');
          images.forEach(img => {
            const originalImg = invoiceTemplate.querySelector(`img[src="${img.getAttribute('src')}"]`);
            if (originalImg) {
              const imgStyle = window.getComputedStyle(originalImg);
              (img as HTMLElement).style.width = imgStyle.width;
              (img as HTMLElement).style.height = imgStyle.height;
              (img as HTMLElement).style.objectFit = imgStyle.objectFit;
            }
          });

          // Ensure the content container also fills the entire page
          const contentContainer = clonedDoc.querySelector('.a4-content');
          if (contentContainer) {
            (contentContainer as HTMLElement).style.width = '100%';
            (contentContainer as HTMLElement).style.height = '100%';
            (contentContainer as HTMLElement).style.justifyContent = 'stretch';
            (contentContainer as HTMLElement).style.alignItems = 'stretch';
          }
        }
      }
    });

    // Update progress
    onProgress?.('Creating PDF...', 60);

    // Create a PDF with exact A5 dimensions
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a5',
      compress: true,
      hotfixes: ['px_scaling'], // Apply hotfix for better pixel scaling
      precision: 16, // Higher precision for better rendering
    });

    // Set PDF properties
    pdf.setProperties({
      title: `Invoice for ${order.client_name || 'Client'} - ${order.order_number || order.id}`,
      subject: 'Invoice',
      creator: 'Ivan Prints Invoice System',
      author: 'Ivan Prints',
      keywords: 'invoice, order, pdf',
    });

    // A5 dimensions in mm
    const pdfWidth = A5_DIMENSIONS.MM.WIDTH;
    const pdfHeight = A5_DIMENSIONS.MM.HEIGHT;

    // Convert canvas to image data with maximum quality
    const imgData = canvas.toDataURL('image/png', 1.0);

    // Add the image to the PDF with precise positioning
    // The key is to maintain the exact aspect ratio and dimensions
    pdf.addImage({
      imageData: imgData,
      format: 'PNG',
      x: 0,
      y: 0,
      width: pdfWidth,
      height: pdfHeight,
      compression: 'FAST', // Use compression for better performance
      rotation: 0,
      alias: `invoice-${order.id}`,
    });

    // Update progress
    onProgress?.('Finalizing PDF...', 90);

    // Convert the PDF to a Blob
    const pdfBlob = pdf.output('blob');

    // Update progress
    onProgress?.('PDF generated successfully', 100);

    return pdfBlob;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
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
export const downloadSimplePdf = async (
  previewElement: HTMLElement,
  order: Order,
  onProgress?: (status: string, progress?: number) => void
): Promise<void> => {
  try {
    // Generate the PDF
    const pdfBlob = await generateSimplePdf(previewElement, order, onProgress);

    // Update progress
    onProgress?.('Preparing download...', 90);

    // Create a filename
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

    // Update progress
    onProgress?.('Download complete', 100);
  } catch (error) {
    console.error('Error downloading PDF:', error);
    throw error;
  }
};
