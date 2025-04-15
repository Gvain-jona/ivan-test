/**
 * Utility functions for downloading files
 */

/**
 * Downloads a file from a URL with a custom filename
 *
 * @param url The URL of the file to download
 * @param filename The filename to save the file as
 * @returns A promise that resolves when the download is complete
 */
export const downloadFile = async (url: string, filename: string): Promise<void> => {
  try {
    // Fetch the file
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`);
    }

    // Get the file as a blob
    const blob = await response.blob();

    // Create a URL for the blob
    const blobUrl = window.URL.createObjectURL(blob);

    // Create a temporary link element
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;

    // Append the link to the document
    document.body.appendChild(link);

    // Click the link to trigger the download
    link.click();

    // Clean up
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);

    return Promise.resolve();
  } catch (error) {
    console.error('Error downloading file:', error);
    return Promise.reject(error);
  }
};

/**
 * Formats a filename for an invoice
 *
 * @param orderNumber The order number
 * @param clientName The client name
 * @param date Optional date string in YYYY-MM-DD format. If not provided, current date will be used.
 * @returns A formatted filename
 */
export const formatInvoiceFilename = (orderNumber: string, clientName: string, date?: string): string => {
  // Clean up the client name to make it filename-safe
  const safeClientName = clientName
    .replace(/[^a-zA-Z0-9]/g, '_') // Replace non-alphanumeric characters with underscores
    .replace(/_+/g, '_') // Replace multiple underscores with a single one
    .trim();

  // Use provided date or get the current date in YYYY-MM-DD format
  const formattedDate = date || new Date().toISOString().split('T')[0];

  // Format the filename
  return `Invoice_${orderNumber}_${safeClientName}_${formattedDate}.pdf`;
};
