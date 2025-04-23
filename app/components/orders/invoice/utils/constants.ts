/**
 * Constants for invoice generation
 * Using standard A4 and A5 dimensions and conversion factors
 */

// A4 dimensions in different units
export const A4_DIMENSIONS = {
  // A4 in millimeters (210mm × 297mm)
  MM: {
    WIDTH: 210,
    HEIGHT: 297,
  },
  // A4 in points (72 points per inch) - used by PDF libraries
  POINTS: {
    WIDTH: 595.28,
    HEIGHT: 841.89,
  },
  // A4 in pixels at 96 DPI (standard screen resolution)
  PIXELS: {
    WIDTH: 794, // 210mm at 96 DPI
    HEIGHT: 1123, // 297mm at 96 DPI
  },
};

// A5 dimensions in different units (A5 is half of A4)
export const A5_DIMENSIONS = {
  // A5 in millimeters (148mm × 210mm)
  MM: {
    WIDTH: 148,
    HEIGHT: 210,
  },
  // A5 in points (72 points per inch) - used by PDF libraries
  POINTS: {
    WIDTH: 419.53,
    HEIGHT: 595.28,
  },
  // A5 in pixels at 96 DPI (standard screen resolution)
  PIXELS: {
    WIDTH: 559, // 148mm at 96 DPI
    HEIGHT: 794, // 210mm at 96 DPI
  },
};

// Standard document margins in millimeters
export const DOCUMENT_MARGINS = {
  TOP: 20,
  RIGHT: 20,
  BOTTOM: 20,
  LEFT: 20,
};

// Conversion factors
export const CONVERSION = {
  MM_TO_POINTS: 2.83465, // 1mm = 2.83465pt
  MM_TO_PIXELS: 3.78, // 1mm = 3.78px at 96 DPI
  POINTS_TO_PIXELS: 1.33333, // 1pt = 1.33333px at 96 DPI
};

// Scale factor for PDF generation (balanced for quality and performance)
export const PDF_SCALE_FACTOR = 1.5;

// Filename format for downloaded invoices
export const FILENAME_FORMAT = 'INVOICE-{orderNumber}-{clientName}-{date}';
