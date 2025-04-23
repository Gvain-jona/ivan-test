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

          // Fix icon positioning - ensure all SVG and icon elements maintain exact position
          const iconElements = clonedElement.querySelectorAll('svg, .lucide, [class*="icon"]');

          // Log for debugging (only in development)
          if (process.env.NODE_ENV === 'development') {
            console.log(`Found ${iconElements.length} icon elements`);
          }

          // Process each icon to ensure exact positioning
          iconElements.forEach((el) => {
            // Try to find the original element in the document
            // First by ID if available, then by matching the element's position in the DOM
            let originalEl;
            if (el.id) {
              originalEl = document.querySelector(`#${el.id}`);
            }

            // If no ID or element not found by ID, try to find it by its position in the DOM
            if (!originalEl) {
              // Get the path to the element
              const getElementPath = (element: Element): string => {
                const path = [];
                let currentElement = element;
                while (currentElement.parentElement) {
                  const siblings = Array.from(currentElement.parentElement.children);
                  const index = siblings.indexOf(currentElement);
                  path.unshift(`${currentElement.tagName.toLowerCase()}:nth-child(${index + 1})`);
                  currentElement = currentElement.parentElement;
                }
                return path.join(' > ');
              };

              // Try to find the original element by its path
              try {
                const path = getElementPath(el);
                originalEl = document.querySelector(path);
              } catch (e) {
                // If there's an error, fall back to the cloned element
                originalEl = el;
              }
            }

            // If still not found, use the cloned element
            if (!originalEl) {
              originalEl = el;
            }
            const computedStyle = window.getComputedStyle(originalEl);
            const parentComputedStyle = originalEl.parentElement ? window.getComputedStyle(originalEl.parentElement) : null;

            // Get the bounding rectangle to ensure exact positioning
            const rect = originalEl.getBoundingClientRect();

            // Log icon details for debugging
            if (process.env.NODE_ENV === 'development') {
              console.log(`Icon: ${el.tagName}${el.id ? ' #' + el.id : ''}, Position: ${rect.left.toFixed(2)},${rect.top.toFixed(2)}, Size: ${rect.width.toFixed(2)}x${rect.height.toFixed(2)}`);
            }

            // Apply comprehensive styling to maintain exact position
            const elStyle = (el as HTMLElement).style;

            // Basic positioning and display
            elStyle.position = computedStyle.position;
            elStyle.display = computedStyle.display || 'inline-block';
            elStyle.verticalAlign = computedStyle.verticalAlign || 'middle';
            elStyle.lineHeight = computedStyle.lineHeight;
            elStyle.textAlign = computedStyle.textAlign;

            // Exact dimensions
            elStyle.width = computedStyle.width;
            elStyle.height = computedStyle.height;
            elStyle.minWidth = computedStyle.minWidth;
            elStyle.minHeight = computedStyle.minHeight;
            elStyle.maxWidth = computedStyle.maxWidth;
            elStyle.maxHeight = computedStyle.maxHeight;

            // Margins and padding
            elStyle.margin = computedStyle.margin;
            elStyle.marginTop = computedStyle.marginTop;
            elStyle.marginRight = computedStyle.marginRight;
            elStyle.marginBottom = computedStyle.marginBottom;
            elStyle.marginLeft = computedStyle.marginLeft;
            elStyle.padding = computedStyle.padding;

            // Positioning
            elStyle.top = computedStyle.top;
            elStyle.right = computedStyle.right;
            elStyle.bottom = computedStyle.bottom;
            elStyle.left = computedStyle.left;

            // Flex properties if in a flex container
            if (parentComputedStyle && parentComputedStyle.display.includes('flex')) {
              elStyle.flexShrink = computedStyle.flexShrink;
              elStyle.flexGrow = computedStyle.flexGrow;
              elStyle.flexBasis = computedStyle.flexBasis;
              elStyle.alignSelf = computedStyle.alignSelf;
            }

            // Visual properties
            elStyle.color = computedStyle.color;
            elStyle.fill = computedStyle.fill || computedStyle.color;
            elStyle.stroke = computedStyle.stroke;
            elStyle.strokeWidth = computedStyle.strokeWidth;
            elStyle.opacity = computedStyle.opacity;

            // Ensure no transforms that could affect positioning
            elStyle.transform = 'none';
            elStyle.transformOrigin = 'center';

            // For SVG icons specifically
            if (el.tagName.toLowerCase() === 'svg') {
              // Force a specific size if the computed size is 0
              if (parseFloat(computedStyle.width) === 0 || computedStyle.width === 'auto') {
                elStyle.width = '16px';
              }
              if (parseFloat(computedStyle.height) === 0 || computedStyle.height === 'auto') {
                elStyle.height = '16px';
              }
              // Ensure SVG viewBox is preserved
              if ((el as SVGElement).getAttribute('viewBox')) {
                (el as SVGElement).setAttribute('preserveAspectRatio', 'xMidYMid meet');
              }

              // Ensure all child paths and shapes maintain their appearance
              const svgChildren = el.querySelectorAll('path, circle, rect, line, polyline, polygon');
              svgChildren.forEach(child => {
                // Preserve stroke and fill attributes
                if (child.getAttribute('stroke')) {
                  child.setAttribute('stroke-width', child.getAttribute('stroke-width') || '1.5');
                }
                if (child.getAttribute('fill')) {
                  child.setAttribute('fill-opacity', child.getAttribute('fill-opacity') || '1');
                }
              });
            }
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
            const elStyle = (el as HTMLElement).style;

            // Apply background properties
            elStyle.backgroundImage = computedStyle.backgroundImage;
            elStyle.backgroundColor = computedStyle.backgroundColor;

            // If the gradient is not properly applied, force it
            if (!computedStyle.backgroundImage.includes('linear-gradient')) {
              // Check for specific gradient classes
              if (el.classList.contains('from-orange-600') && el.classList.contains('to-orange-400')) {
                elStyle.backgroundImage = 'linear-gradient(to right, #f97316, #fb923c)';
                elStyle.backgroundColor = '#f97316';
              }
            }

            // Apply other background properties
            elStyle.backgroundSize = computedStyle.backgroundSize;
            elStyle.backgroundPosition = computedStyle.backgroundPosition;
            elStyle.backgroundRepeat = computedStyle.backgroundRepeat;

            // Ensure text in gradient elements is visible
            const textElements = el.querySelectorAll('*');
            textElements.forEach(textEl => {
              const textStyle = window.getComputedStyle(textEl);
              if (textStyle.color === 'rgb(255, 255, 255)' || textEl.classList.contains('text-white')) {
                (textEl as HTMLElement).style.color = '#ffffff';
              }
            });
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
      compress: true, // Add compression for better quality
      precision: 16,  // Increase precision for better rendering
      hotfixes: ['px_scaling'], // Apply hotfixes for better rendering
    });

    // Set PDF properties for better identification
    pdf.setProperties({
      title: `Invoice for ${order.client_name || 'Client'} - ${order.order_number || order.id}`,
      subject: 'Invoice',
      creator: 'Ivan Prints Invoice System',
      author: 'Ivan Prints',
      keywords: 'invoice, order, pdf',
    });

    // A4 dimensions in mm
    const pdfWidth = A4_DIMENSIONS.MM.WIDTH;
    const pdfHeight = A4_DIMENSIONS.MM.HEIGHT;

    // Convert canvas to image data
    const imgData = canvas.toDataURL('image/png', 1.0);

    // Add the image to the PDF - exact A4 size with no scaling or cropping
    // Use the 'FAST' option for better performance and quality
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');

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
 * Pre-processes the invoice template to ensure consistent rendering of icons and tables
 * This function applies specific fixes for common rendering issues
 *
 * @param invoiceTemplate The invoice template element
 * @returns The pre-processed template element
 */
const preProcessTemplate = (invoiceTemplate: HTMLElement): HTMLElement => {
  // Create a deep clone of the template to avoid modifying the original
  const processedTemplate = invoiceTemplate.cloneNode(true) as HTMLElement;

  // Fix icon positioning
  const icons = processedTemplate.querySelectorAll('svg, .lucide, [class*="icon"]');
  icons.forEach((icon) => {
    const iconElement = icon as HTMLElement;

    // Force absolute positioning for icons to prevent shifting
    iconElement.style.position = 'relative';
    iconElement.style.display = 'inline-block';

    // Force specific dimensions to prevent scaling issues
    iconElement.style.width = '16px';
    iconElement.style.height = '16px';

    // Force vertical alignment
    iconElement.style.verticalAlign = 'middle';

    // Remove any transforms that might affect positioning
    iconElement.style.transform = 'none';

    // Add a specific class for tracking
    iconElement.classList.add('pdf-fixed-icon');

    // For SVG icons, ensure viewBox and other attributes are preserved
    if (icon.tagName.toLowerCase() === 'svg') {
      const svgElement = icon as SVGElement;

      // Ensure the SVG has a viewBox
      if (!svgElement.getAttribute('viewBox')) {
        svgElement.setAttribute('viewBox', '0 0 24 24');
      }

      // Ensure preserveAspectRatio is set
      svgElement.setAttribute('preserveAspectRatio', 'xMidYMid meet');

      // Ensure stroke-width is consistent
      const paths = svgElement.querySelectorAll('path');
      paths.forEach(path => {
        path.setAttribute('stroke-width', '1.5');
      });
    }

    // If the icon is inside a flex container, ensure it doesn't get stretched
    const parent = iconElement.parentElement;
    if (parent) {
      const parentStyle = window.getComputedStyle(parent);
      if (parentStyle.display.includes('flex')) {
        iconElement.style.flexShrink = '0';
        iconElement.style.flexGrow = '0';
      }
    }
  });

  // Fix table layout issues
  const tables = processedTemplate.querySelectorAll('table');
  tables.forEach((table) => {
    const tableElement = table as HTMLElement;

    // Force table layout to fixed to prevent column width changes
    tableElement.style.tableLayout = 'fixed';
    tableElement.style.width = '100%';
    tableElement.style.borderCollapse = 'collapse';
    tableElement.style.borderSpacing = '0';

    // Process all cells to ensure consistent sizing
    const cells = table.querySelectorAll('th, td');
    cells.forEach((cell) => {
      const cellElement = cell as HTMLElement;

      // Get the computed width and set it explicitly
      const computedStyle = window.getComputedStyle(cellElement);
      cellElement.style.width = computedStyle.width;

      // Force padding to be explicit
      cellElement.style.padding = computedStyle.padding || '4px';

      // Force text alignment
      cellElement.style.textAlign = computedStyle.textAlign || 'left';

      // Prevent text wrapping issues
      cellElement.style.whiteSpace = 'normal';
      cellElement.style.wordBreak = 'break-word';

      // Add a specific class for tracking
      cellElement.classList.add('pdf-fixed-cell');
    });

    // Ensure table headers have proper styling
    const headers = table.querySelectorAll('th');
    headers.forEach((header) => {
      const headerElement = header as HTMLElement;
      headerElement.style.fontWeight = 'bold';
      headerElement.style.backgroundColor = headerElement.style.backgroundColor || '#f3f4f6';
    });
  });

  // Fix gradient backgrounds
  const gradients = processedTemplate.querySelectorAll('[class*="bg-gradient"]');
  gradients.forEach((gradient) => {
    const gradientElement = gradient as HTMLElement;

    // Force the gradient to be applied as a background color if the gradient isn't working
    if (!gradientElement.style.backgroundImage || !gradientElement.style.backgroundImage.includes('linear-gradient')) {
      if (gradientElement.classList.contains('from-orange-600') && gradientElement.classList.contains('to-orange-400')) {
        gradientElement.style.backgroundImage = 'linear-gradient(to right, #f97316, #fb923c)';
        gradientElement.style.backgroundColor = '#f97316';
      }
    }

    // Ensure text in gradient elements is visible
    const textElements = gradientElement.querySelectorAll('*');
    textElements.forEach((textEl) => {
      const textElement = textEl as HTMLElement;
      if (textElement.classList.contains('text-white')) {
        textElement.style.color = '#ffffff';
      }
    });
  });

  return processedTemplate;
};

/**
 * Generates a PDF from a high-quality image of the invoice template
 * This two-step approach ensures better rendering of icons and other elements
 *
 * @param previewElement The HTML element containing the invoice preview
 * @param order The order data
 * @returns A Promise that resolves to a Blob containing the PDF
 */
export const generatePdfFromImage = async (
  previewElement: HTMLElement,
  order: Order
): Promise<Blob> => {
  if (!previewElement) {
    throw new Error('Preview element not found');
  }

  // Find the actual invoice template inside the container
  const a4Content = previewElement.querySelector('.a4-content');
  if (!a4Content) {
    throw new Error('A4 content container not found');
  }

  const invoiceTemplate = a4Content.querySelector('.invoice-template');
  if (!invoiceTemplate) {
    throw new Error('Invoice template not found inside A4 content container');
  }

  // Step 1: Pre-process the template to fix icon and table positioning
  const processedTemplate = preProcessTemplate(invoiceTemplate as HTMLElement);

  // Use a higher scale factor for better quality
  const scaleFactor = 3; // Higher scale for better quality

  // Create a container for the processed template
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  container.style.width = `${A4_DIMENSIONS.PIXELS.WIDTH}px`;
  container.style.height = `${A4_DIMENSIONS.PIXELS.HEIGHT}px`;
  container.style.overflow = 'hidden';
  container.style.backgroundColor = 'white';
  container.appendChild(processedTemplate);
  document.body.appendChild(container);

  try {
    // Ensure all images are loaded before capturing
    const allImages = processedTemplate.querySelectorAll('img');
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

    // Force a layout calculation to ensure everything is positioned correctly
    processedTemplate.getBoundingClientRect();

    // Capture the template as a high-quality image
    const canvas = await html2canvas(processedTemplate, {
      scale: scaleFactor,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      scrollY: 0,
      scrollX: 0,
      letterRendering: true,
      width: A4_DIMENSIONS.PIXELS.WIDTH,
      height: A4_DIMENSIONS.PIXELS.HEIGHT,
      onclone: (clonedDoc) => {
        // Additional fixes for the cloned document
        const clonedTemplate = clonedDoc.querySelector('.invoice-template');
        if (clonedTemplate) {
          // Force exact dimensions
          (clonedTemplate as HTMLElement).style.width = `${A4_DIMENSIONS.PIXELS.WIDTH}px`;
          (clonedTemplate as HTMLElement).style.height = `${A4_DIMENSIONS.PIXELS.HEIGHT}px`;
          (clonedTemplate as HTMLElement).style.margin = '0';
          (clonedTemplate as HTMLElement).style.padding = '0';
        }
      }
    });

    // Step 2: Create a PDF with the exact A4 dimensions
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
      precision: 16,
      hotfixes: ['px_scaling'],
    });

    // Set PDF properties
    pdf.setProperties({
      title: `Invoice for ${order.client_name || 'Client'} - ${order.order_number || order.id}`,
      subject: 'Invoice',
      creator: 'Ivan Prints Invoice System',
      author: 'Ivan Prints',
      keywords: 'invoice, order, pdf',
    });

    // A4 dimensions in mm
    const pdfWidth = A4_DIMENSIONS.MM.WIDTH;
    const pdfHeight = A4_DIMENSIONS.MM.HEIGHT;

    // Convert canvas to image data at maximum quality
    const imgData = canvas.toDataURL('image/png', 1.0);

    // Add the image to the PDF with precise positioning
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');

    // Convert the PDF to a Blob
    const pdfBlob = pdf.output('blob');

    // Clean up the container
    document.body.removeChild(container);

    return pdfBlob;
  } finally {
    // Make sure we clean up the container if there's an error
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
};

/**
 * Downloads the invoice as a high-quality PNG image
 * This is useful for debugging and for cases where the exact preview appearance is critical
 *
 * @param previewElement The HTML element containing the invoice preview
 * @param order The order data
 * @param onProgress Callback for progress updates
 * @returns A Promise that resolves when the download is complete
 */
export const downloadInvoiceAsImage = async (
  previewElement: HTMLElement,
  order: Order,
  onProgress?: (status: string, progress?: number) => void
): Promise<void> => {
  try {
    // Update progress
    onProgress?.('Generating image...', 10);

    // Find the invoice template
    const a4Content = previewElement.querySelector('.a4-content');
    if (!a4Content) {
      throw new Error('A4 content container not found');
    }

    const invoiceTemplate = a4Content.querySelector('.invoice-template');
    if (!invoiceTemplate) {
      throw new Error('Invoice template not found inside A4 content container');
    }

    // Pre-process the template to fix icon and table positioning
    const processedTemplate = preProcessTemplate(invoiceTemplate as HTMLElement);

    // Create a container for the processed template
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '-9999px';
    container.style.width = `${A4_DIMENSIONS.PIXELS.WIDTH}px`;
    container.style.height = `${A4_DIMENSIONS.PIXELS.HEIGHT}px`;
    container.style.overflow = 'hidden';
    container.style.backgroundColor = 'white';
    container.appendChild(processedTemplate);
    document.body.appendChild(container);

    try {
      // Force a layout calculation to ensure everything is positioned correctly
      processedTemplate.getBoundingClientRect();

      // Use html2canvas with high quality settings
      const canvas = await html2canvas(processedTemplate, {
        scale: 3, // Higher scale for better quality
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        scrollY: 0,
        scrollX: 0,
        letterRendering: true,
        width: A4_DIMENSIONS.PIXELS.WIDTH,
        height: A4_DIMENSIONS.PIXELS.HEIGHT,
      });

      // Update progress
      onProgress?.('Preparing download...', 80);

      // Create a filename
      const orderNumber = order.order_number || (order.id ? `ORD-${order.id.substring(0, 8)}` : 'Unknown');
      const clientName = order.client_name || 'Client';
      const date = new Date().toISOString().split('T')[0];
      const filename = `INVOICE-${orderNumber}-${clientName}-${date}.png`;

      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob!);
        }, 'image/png', 1.0);
      });

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;

      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Clean up the container
      document.body.removeChild(container);

      // Update progress
      onProgress?.('Download complete', 100);
    } finally {
      // Make sure we clean up the container if there's an error
      if (document.body.contains(container)) {
        document.body.removeChild(container);
      }
    }
  } catch (error) {
    console.error('Error generating image:', error);
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
export const downloadInvoicePdf = async (
  previewElement: HTMLElement,
  order: Order,
  onProgress?: (status: string, progress?: number) => void
): Promise<void> => {
  try {
    // Update progress - start at 10%
    onProgress?.('Generating PDF...', 10);

    // Generate the PDF using the image-based approach for better icon rendering
    // This approach produces more consistent results across browsers
    const pdfBlob = await generatePdfFromImage(previewElement, order);

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
