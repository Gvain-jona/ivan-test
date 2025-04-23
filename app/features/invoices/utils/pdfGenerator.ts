'use client';

import { Order } from '@/types/orders';
import { PdfGenerationOptions } from '../types';
import { formatInvoiceFilenameFromOrder } from '@/lib/utils/downloadUtils';

/**
 * Helper function to optimize the template for PDF generation
 * This applies various fixes to ensure consistent rendering in the PDF
 */
function optimizeForPdf(element: HTMLElement): void {
  // Ensure all fonts are properly loaded
  const style = document.createElement('style');
  style.textContent = `
    @font-face {
      font-family: 'Arial';
      font-style: normal;
      font-weight: 400;
      font-display: swap;
      src: local('Arial');
    }
    @font-face {
      font-family: 'Arial';
      font-style: normal;
      font-weight: 700;
      font-display: swap;
      src: local('Arial Bold');
    }
    /* Fix for image display in PDF */
    @layer base {
      img { display: initial !important; }
    }
  `;
  element.appendChild(style);

  // Ensure all images are properly loaded
  const images = element.querySelectorAll('img');
  images.forEach(img => {
    // Add crossorigin attribute to prevent CORS issues
    img.crossOrigin = 'anonymous';

    // Add error handler to replace broken images
    img.onerror = () => {
      img.style.display = 'none';
    };

    // Ensure image is visible
    img.style.display = 'block';
  });

  // Ensure all colors are properly rendered
  element.style.WebkitPrintColorAdjust = 'exact';
  element.style.printColorAdjust = 'exact';

  // Fix for table rendering
  const tables = element.querySelectorAll('table');
  tables.forEach(table => {
    table.style.borderCollapse = 'collapse';
    table.style.width = '100%';

    // Ensure table borders are visible
    const cells = table.querySelectorAll('td, th');
    cells.forEach(cell => {
      if (cell instanceof HTMLElement) {
        if (cell.style.border) {
          cell.style.borderWidth = '0.75px';
        }
      }
    });
  });

  // Ensure the element has the correct dimensions
  element.style.width = '210mm';
  element.style.minHeight = '297mm';
  element.style.margin = '0';
  element.style.padding = '0';
  element.style.boxSizing = 'border-box';
  element.style.backgroundColor = '#FFFFFF';
}

/**
 * Generate a PDF from an HTML element
 *
 * @param element The HTML element to convert to PDF
 * @param order The order data
 * @param options PDF generation options
 * @param onProgress Callback for progress updates
 * @returns A Promise that resolves to a Blob containing the PDF
 */
export async function generatePdf(
  element: HTMLElement,
  order: Order,
  options: Partial<PdfGenerationOptions> = {},
  onProgress?: (progress: number) => void
): Promise<Blob> {
  // Dynamically import html2pdf to reduce bundle size
  const html2pdf = (await import('html2pdf.js')).default;

  // Clone the element to avoid modifying the original
  const clone = element.cloneNode(true) as HTMLElement;

  // Apply optimizations
  optimizeForPdf(clone);

  // Set default options
  const defaultOptions: PdfGenerationOptions = {
    quality: 'high',
    format: 'a4',
    orientation: 'portrait',
  };

  // Merge with provided options
  const mergedOptions = { ...defaultOptions, ...options };

  // Configure scale based on quality
  let scale = 2; // Default for high quality
  if (mergedOptions.quality === 'medium') scale = 1.5;
  if (mergedOptions.quality === 'low') scale = 1;

  // Configure html2pdf options
  const pdfOptions = {
    margin: 0, // Margins are handled in the template
    filename: formatInvoiceFilenameFromOrder(order),
    image: {
      type: 'jpeg',
      quality: mergedOptions.quality === 'high' ? 0.98 : 0.92
    },
    html2canvas: {
      scale,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#FFFFFF',
      letterRendering: true, // Improves text rendering
      imageTimeout: 30000, // Longer timeout for images
      windowWidth: 210 * 3.78, // A4 width in pixels (210mm * 3.78 pixels per mm)
      windowHeight: 297 * 3.78, // A4 height in pixels
      x: 0,
      y: 0,
      onclone: (clonedDoc) => {
        // Ensure the template container has the correct dimensions
        const container = clonedDoc.querySelector('[data-pdf-container="true"]');
        if (container && container instanceof HTMLElement) {
          container.style.width = '210mm';
          container.style.minHeight = '297mm';
          container.style.margin = '0';
          container.style.padding = '0';
          container.style.overflow = 'hidden';

          // Ensure all images are properly loaded
          const images = container.querySelectorAll('img');
          images.forEach(img => {
            img.style.display = 'block';
            img.crossOrigin = 'anonymous';
          });

          // Ensure all table borders are visible
          const tables = container.querySelectorAll('table');
          tables.forEach(table => {
            table.style.borderCollapse = 'collapse';
            table.style.width = '100%';

            const cells = table.querySelectorAll('td, th');
            cells.forEach(cell => {
              if (cell instanceof HTMLElement) {
                if (cell.style.border) {
                  cell.style.borderWidth = '0.75px';
                }
              }
            });
          });
        }
      }
    },
    jsPDF: {
      unit: 'mm',
      format: mergedOptions.format,
      orientation: mergedOptions.orientation,
      compress: true,
      precision: 16, // Higher precision for better text rendering
      putOnlyUsedFonts: true,
      hotfixes: ['px_scaling'] // Apply hotfix for better pixel scaling
    }
  };

  // Generate PDF with progress reporting
  return new Promise((resolve, reject) => {
    try {
      // Initial progress if callback provided
      if (onProgress) {
        onProgress(10);
      }

      // Create the worker
      const worker = html2pdf()
        .from(clone)
        .set(pdfOptions)
        .save();

      // Set 50% progress after save
      if (onProgress) {
        setTimeout(() => onProgress(50), 500);
      }

      // Output as blob
      worker.output('blob')
        .then((blob) => {
          // Final progress
          if (onProgress) {
            onProgress(100);
          }
          resolve(blob);
        })
        .catch((error) => {
          console.error('Error generating PDF:', error);
          reject(error);
        });
    } catch (error) {
      console.error('Error in PDF generation process:', error);
      reject(error);
    }
  });
}

/**
 * Download a PDF directly
 *
 * @param element The HTML element to convert to PDF
 * @param order The order data
 * @param options PDF generation options
 * @param onProgress Callback for progress updates
 */
export async function downloadPdf(
  element: HTMLElement,
  order: Order,
  options: Partial<PdfGenerationOptions> = {},
  onProgress?: (progress: number) => void
): Promise<void> {
  try {
    // Update initial progress
    onProgress?.(5);

    // Generate the PDF
    const pdfBlob = await generatePdf(element, order, options, (progress) => {
      // Pass through the progress updates
      onProgress?.(progress);
    });

    // Update progress before download
    onProgress?.(90);

    // Create a download link
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = formatInvoiceFilenameFromOrder(order);

    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up
    setTimeout(() => {
      URL.revokeObjectURL(url);
      onProgress?.(100);
    }, 100);
  } catch (error) {
    console.error('Error downloading PDF:', error);
    throw error;
  }
}
