'use client';

import { Order } from '@/types/orders';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { formatInvoiceFilenameFromOrder } from '@/lib/utils/downloadUtils';

/**
 * Options for PDF generation
 */
export interface ExactPdfOptions {
  quality: 'digital' | 'print';
  filename?: string;
  dpi?: number; // Dots per inch for print quality
}

/**
 * Generates a PDF from an HTML element, capturing it exactly as it appears
 * without any resizing or modifications
 *
 * @param element The HTML element to convert to PDF
 * @param order The order data for filename generation
 * @param options PDF generation options
 * @param onProgress Callback for progress updates
 * @returns A Promise that resolves when the PDF is downloaded
 */
export async function generateExactPdf(
  element: HTMLElement,
  order: Order,
  options: Partial<ExactPdfOptions> = {},
  onProgress?: (progress: number) => void
): Promise<void> {
  try {
    // Set default options
    const defaultOptions: ExactPdfOptions = {
      quality: 'digital',
      filename: formatInvoiceFilenameFromOrder(order),
      dpi: 96 // Default DPI for digital use
    };

    // Merge with provided options
    const mergedOptions = { ...defaultOptions, ...options };

    // Report initial progress
    onProgress?.(10);

    // Configure scale based on quality
    let scale = 1; // Default for digital quality (96 DPI)
    let imageFormat = 'JPEG'; // Default format for digital use
    let imageQuality = 0.85; // Default image quality for digital use

    // Adjust settings based on quality option
    if (mergedOptions.quality === 'print') {
      // For print quality, use higher DPI and better image quality
      const dpi = mergedOptions.dpi || 300; // Use 300 DPI for print (600 DPI was causing blank PDFs)
      scale = dpi / 96; // Calculate scale based on DPI (96 is standard screen DPI)
      imageFormat = 'JPEG'; // Use JPEG for better compatibility
      imageQuality = 0.95; // High quality but not maximum to avoid issues
    }

    // Get the computed style of the element
    const style = window.getComputedStyle(element);

    // Get the element's dimensions
    const width = parseFloat(style.width);
    const height = parseFloat(style.height);

    // Create a canvas from the element
    const canvas = await html2canvas(element, {
      scale: scale,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#FFFFFF',
      // Don't modify the element's size or position
      width: width,
      height: height,
      // Improve rendering quality
      letterRendering: true,
      imageTimeout: 30000, // Reasonable timeout
      // Don't use foreignObject as it can cause blank PDFs in some browsers
      foreignObjectRendering: false,
      // Don't apply any transformations
      x: 0,
      y: 0,
      scrollX: 0,
      scrollY: 0,
      windowWidth: document.documentElement.offsetWidth,
      windowHeight: document.documentElement.offsetHeight,
      // Ensure everything is properly rendered
      onclone: (clonedDoc) => {
        // Add high-quality rendering styles
        const style = document.createElement('style');
        style.textContent = `
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          @layer base {
            img { display: initial !important; }
          }
          @media print {
            body { -webkit-print-color-adjust: exact !important; }
          }
        `;
        clonedDoc.head.appendChild(style);

        // Fix table rendering issues
        const tables = clonedDoc.querySelectorAll('table');
        tables.forEach(table => {
          // Ensure table has proper width
          table.style.width = '100%';
          table.style.tableLayout = 'fixed';
          table.style.borderCollapse = 'collapse';

          // Ensure table borders are visible with higher quality
          const cells = table.querySelectorAll('td, th');
          cells.forEach(cell => {
            if (cell instanceof HTMLElement) {
              // Use a slightly thicker border for better visibility in print
              cell.style.border = mergedOptions.quality === 'print' ? '1px solid #E5E7EB' : '0.75px solid #E5E7EB';
              // Improve text rendering
              cell.style.textRendering = 'optimizeLegibility';
            }
          });
        });

        // Improve text rendering throughout the document
        const textElements = clonedDoc.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, div');
        textElements.forEach(el => {
          if (el instanceof HTMLElement) {
            el.style.textRendering = 'optimizeLegibility';
            // Ensure black text is truly black (not dark gray)
            if (window.getComputedStyle(el).color === 'rgb(0, 0, 0)') {
              el.style.color = '#000000';
            }
          }
        });
      }
    });

    // Report progress after canvas creation
    onProgress?.(50);

    // Calculate PDF dimensions (convert pixels to mm at 72 DPI)
    const pdfWidth = canvas.width * 0.264583;
    const pdfHeight = canvas.height * 0.264583;

    // Create a PDF with the exact dimensions of the canvas
    const pdf = new jsPDF({
      orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait',
      unit: 'mm',
      format: [pdfWidth, pdfHeight],
      compress: true, // Always compress for better compatibility
      hotfixes: ['px_scaling'],
      precision: 16, // Standard precision for better compatibility
      putOnlyUsedFonts: true
    });

    // Add the canvas as an image to the PDF
    const imgData = canvas.toDataURL(`image/${imageFormat.toLowerCase()}`, imageQuality);
    pdf.addImage(imgData, imageFormat, 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');

    // Report progress before saving
    onProgress?.(90);

    // Save the PDF
    pdf.save(mergedOptions.filename);

    // Report completion
    onProgress?.(100);
  } catch (error) {
    console.error('Error generating exact PDF:', error);
    throw error;
  }
}
