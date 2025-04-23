// Import html2pdf dynamically to avoid build errors
const getHtml2Pdf = async () => {
  try {
    // Dynamic import
    const module = await import('html2pdf.js');
    // Return the default export (the html2pdf function)
    return module.default || module;
  } catch (error) {
    console.error('Error importing html2pdf.js:', error);
    throw error;
  }
};
import { Order } from '@/types/orders';
import { formatInvoiceFilenameFromOrder } from '@/lib/utils/downloadUtils';
import { A5_DIMENSIONS } from './constants';

/**
 * Enhanced PDF generator for invoices using html2pdf.js
 * Implements fixes and optimizations for better rendering
 */
export const generateEnhancedPdf = async (
  element: HTMLElement | null,
  order: Order,
  onProgress?: (status: string, progress?: number) => void
): Promise<void> => {
  if (!element) {
    throw new Error('No element provided for PDF generation');
  }

  try {
    // Update progress
    onProgress?.('Preparing template...', 10);

    // Find the actual invoice content inside the container
    // This targets the OrangeInvoiceTemplate content directly
    const invoiceContent = element.querySelector('.invoice-content');

    if (!invoiceContent) {
      console.warn('Could not find invoice-content element, falling back to the provided element');
      // Clone the element to avoid modifying the original
      const clonedElement = element.cloneNode(true) as HTMLElement;
      // Apply specific fixes for better rendering
      applyRenderingFixes(clonedElement);
      return generatePdfFromElement(clonedElement, order, onProgress);
    }

    // Clone only the invoice content to avoid capturing borders and other elements
    const clonedElement = invoiceContent.cloneNode(true) as HTMLElement;

    // Apply specific fixes for better rendering
    applyRenderingFixes(clonedElement);

    // Use the helper function to generate the PDF
    return generatePdfFromElement(clonedElement, order, onProgress);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};



/**
 * Helper function to generate PDF from an element
 */
const generatePdfFromElement = async (
  element: HTMLElement,
  order: Order,
  onProgress?: (status: string, progress?: number) => void
): Promise<void> => {
  // Update progress
  onProgress?.('Generating PDF...', 30);

  // Configure html2pdf options
  const options = {
    margin: [10, 10, 10, 10],
    filename: formatInvoiceFilenameFromOrder(order),
    image: {
      type: 'jpeg',
      quality: 1.0
    },
    html2canvas: {
      scale: 3, // Higher scale for better quality
      useCORS: true,
      allowTaint: true,
      letterRendering: true,
      logging: false,
      backgroundColor: '#ffffff',
      // Ensure the full width is captured
      windowWidth: A5_DIMENSIONS.PIXELS.WIDTH,
      windowHeight: A5_DIMENSIONS.PIXELS.HEIGHT,
      x: 0,
      y: 0
    },
    jsPDF: {
      unit: 'mm',
      format: 'a5',
      orientation: 'portrait',
      compress: true,
      precision: 16, // Higher precision for better rendering
      hotfixes: ['px_scaling'] // Apply hotfix for better pixel scaling
    },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
  };

  // Update progress
  onProgress?.('Creating PDF...', 60);

  try {
    // Get the html2pdf function
    const html2pdf = await getHtml2Pdf();

    // Generate and download the PDF
    await html2pdf()
      .from(element)
      .set(options)
      .save();

    // Update progress
    onProgress?.('Download complete!', 100);
  } catch (error) {
    console.error('Error in PDF generation:', error);
    throw error;
  }
};

/**
 * Apply specific fixes to improve rendering in the PDF
 */
const applyRenderingFixes = (element: HTMLElement): void => {
  // Ensure all images are properly displayed
  const images = element.querySelectorAll('img');
  images.forEach(img => {
    img.style.display = 'initial';
  });

  // Ensure all table borders are visible
  const tables = element.querySelectorAll('table');
  tables.forEach(table => {
    table.style.borderCollapse = 'collapse';
    table.style.border = '1px solid #d1d5db';
  });

  // Ensure all table cells have visible borders
  const cells = element.querySelectorAll('td, th');
  cells.forEach(cell => {
    cell.style.border = '1px solid #d1d5db';
  });

  // Ensure all colors are properly rendered
  element.style.WebkitPrintColorAdjust = 'exact';
  element.style.printColorAdjust = 'exact';

  // Ensure the template fills the entire page
  element.style.width = '100%';
  element.style.height = '100%';
  element.style.margin = '0';
  element.style.padding = '10mm';
};

/**
 * Generate a PDF preview data URL for display in an iframe
 */
export const generatePdfPreview = async (
  element: HTMLElement | null,
  onProgress?: (status: string, progress?: number) => void
): Promise<string> => {
  if (!element) {
    throw new Error('No element provided for PDF preview generation');
  }

  try {
    // Update progress
    onProgress?.('Preparing preview...', 10);

    // Clone the element to avoid modifying the original
    const clonedElement = element.cloneNode(true) as HTMLElement;

    // Apply specific fixes for better rendering
    applyRenderingFixes(clonedElement);

    // Update progress
    onProgress?.('Generating preview...', 30);

    // Configure html2pdf options
    const options = {
      margin: [10, 10, 10, 10],
      image: {
        type: 'jpeg',
        quality: 1.0
      },
      html2canvas: {
        scale: 2, // Lower scale for preview to improve performance
        useCORS: true,
        allowTaint: true,
        letterRendering: true,
        logging: false,
        backgroundColor: '#ffffff',
        // Ensure the full width is captured
        windowWidth: A5_DIMENSIONS.PIXELS.WIDTH,
        windowHeight: A5_DIMENSIONS.PIXELS.HEIGHT,
        x: 0,
        y: 0
      },
      jsPDF: {
        unit: 'mm',
        format: 'a5',
        orientation: 'portrait',
        compress: true,
        precision: 16,
        hotfixes: ['px_scaling']
      }
    };

    // Update progress
    onProgress?.('Creating preview...', 60);

    // Get the html2pdf function
    const html2pdf = await getHtml2Pdf();

    // Generate PDF as data URL
    const pdf = await html2pdf()
      .from(clonedElement)
      .set(options)
      .outputPdf('datauristring');

    // Update progress
    onProgress?.('Preview ready!', 100);

    return pdf as string;
  } catch (error) {
    console.error('Error generating PDF preview:', error);
    throw error;
  }
};
