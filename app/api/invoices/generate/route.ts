// Server-side PDF generation API endpoint
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

/**
 * POST /api/invoices/generate
 * Generates a PDF invoice on the server
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, settings } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = await createClient();

    // Get order with related data
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        clients:client_id (id, name),
        items:order_items (
          id,
          item_name,
          quantity,
          unit_price,
          total_amount
        )
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('Error fetching order:', orderError);
      return NextResponse.json(
        { error: 'Failed to fetch order data' },
        { status: 500 }
      );
    }

    // Generate the PDF
    const pdfBytes = await generatePdf(order, settings);

    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    // Upload the PDF to Supabase Storage
    const bucketName = 'invoices';
    const filename = `invoice_${orderId}_${Date.now()}.pdf`;
    const storagePath = `${userId}/invoices/${filename}`;

    // Ensure the bucket exists
    try {
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some(bucket => bucket.name === bucketName);

      if (!bucketExists) {
        await supabase.storage.createBucket(bucketName, {
          public: true,
          fileSizeLimit: 5 * 1024 * 1024, // 5MB limit
        });
      }
    } catch (bucketError) {
      // Continue anyway
    }

    // Upload the PDF
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(storagePath, pdfBytes, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      console.error('Error uploading PDF:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload PDF' },
        { status: 500 }
      );
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(storagePath);

    // Create invoice record in the database
    const { data: invoiceData, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        order_id: orderId,
        file_url: publicUrl,
        storage_path: storagePath,
        settings: settings || {},
        is_proforma: false,
        created_by: userId
      })
      .select()
      .single();

    if (invoiceError) {
      console.error('Error creating invoice record:', invoiceError);
      // Return the URL even if record creation fails
      return NextResponse.json({
        url: publicUrl,
        message: 'Invoice generated but record creation failed'
      });
    }

    return NextResponse.json({
      url: publicUrl,
      invoice: invoiceData,
      message: 'Invoice generated successfully'
    });
  } catch (error) {
    console.error('Error generating invoice:', error);
    return NextResponse.json(
      { error: 'Failed to generate invoice' },
      { status: 500 }
    );
  }
}

/**
 * Generate a PDF invoice using pdf-lib
 * This is much faster than client-side generation with jsPDF
 */
async function generatePdf(order: any, settings: any): Promise<Uint8Array> {
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();

  // Add a page to the document
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 size in points

  // Get the standard font
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Set up colors
  const primaryColor = rgb(1, 0.33, 0); // Orange color
  const textColor = rgb(0.2, 0.2, 0.2);
  const lightGray = rgb(0.96, 0.96, 0.96);

  // Page dimensions
  const { width, height } = page.getSize();

  // Header
  if (settings?.includeHeader) {
    page.drawRectangle({
      x: 0,
      y: height - 113, // 40mm from top
      width: width,
      height: 113,
      color: primaryColor,
    });

    // Company name
    page.drawText(settings.companyName || 'IVAN PRINTS', {
      x: 42.5, // 15mm
      y: height - 56.7, // 20mm from top
      size: 24,
      font: boldFont,
      color: rgb(1, 1, 1), // White
    });

    // Company tagline
    page.drawText(settings.customHeader || 'PRINTING | DESIGNING | BRANDING', {
      x: 42.5, // 15mm
      y: height - 79.4, // 28mm from top
      size: 10,
      font: font,
      color: rgb(1, 1, 1), // White
    });

    // Contact information
    page.drawText(`Email: ${settings.companyEmail || 'sherilex256@gmail.com'}`, {
      x: 42.5, // 15mm
      y: height - 99.1, // 35mm from top
      size: 9,
      font: font,
      color: rgb(1, 1, 1), // White
    });

    page.drawText(`Phone: ${settings.companyPhone || '0755 541 373'}`, {
      x: 255.1, // 90mm
      y: height - 99.1, // 35mm from top
      size: 9,
      font: font,
      color: rgb(1, 1, 1), // White
    });

    page.drawText(`TIN: ${settings.tinNumber || '1028570150'}`, {
      x: 467.7, // 165mm
      y: height - 99.1, // 35mm from top
      size: 9,
      font: font,
      color: rgb(1, 1, 1), // White
    });
  }

  // Invoice header
  page.drawRectangle({
    x: 0,
    y: height - 155.9, // 55mm from top
    width: width,
    height: 42.5, // 15mm
    color: lightGray,
  });

  page.drawText('INVOICE', {
    x: 42.5, // 15mm
    y: height - 155.9 + 14.2, // 55mm from top + 5mm
    size: 14,
    font: boldFont,
    color: textColor,
  });

  // Invoice information
  const invoiceNumber = `#${order.id.substring(0, 8).toUpperCase()}`;
  page.drawText('Invoice Number:', {
    x: 340.2, // 120mm
    y: height - 147.3, // 52mm from top
    size: 10,
    font: font,
    color: textColor,
  });

  page.drawText(invoiceNumber, {
    x: 453.5, // 160mm
    y: height - 147.3, // 52mm from top
    size: 10,
    font: boldFont,
    color: textColor,
  });

  page.drawText('Date:', {
    x: 340.2, // 120mm
    y: height - 164.4, // 58mm from top
    size: 10,
    font: font,
    color: textColor,
  });

  const formattedDate = new Date().toLocaleDateString('en-UG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  page.drawText(formattedDate, {
    x: 453.5, // 160mm
    y: height - 164.4, // 58mm from top
    size: 10,
    font: boldFont,
    color: textColor,
  });

  // Client information - full width with modern styling
  page.drawRectangle({
    x: 42.5, // 15mm
    y: height - 198.4, // 70mm from top
    width: width - 85, // Full width with margins
    height: 70, // Increased height for better spacing
    color: rgb(0.98, 0.98, 0.98), // Light gray background
    borderColor: rgb(0.9, 0.9, 0.9),
    borderWidth: 0.5,
    borderRadius: 4, // Rounded corners
  });

  // Inner white card for client info
  page.drawRectangle({
    x: 52.5, // 15mm + 10px padding
    y: height - 188.4, // 70mm from top - 10px padding
    width: width - 105, // Full width with margins - 20px padding
    height: 50, // Reduced height
    color: rgb(1, 1, 1), // White
    borderColor: rgb(0.95, 0.95, 0.95),
    borderWidth: 0.5,
    borderRadius: 3, // Rounded corners
  });

  // Bill To header with icon-like styling
  page.drawText('BILL TO', {
    x: 62.5, // 15mm + 20px
    y: height - 178.4, // Adjusted position
    size: 10,
    font: boldFont,
    color: rgb(0.3, 0.3, 0.3), // Darker text
  });

  // Client name with larger font
  page.drawText(order.clients?.name || 'N/A', {
    x: 62.5, // 15mm + 20px
    y: height - 198.4, // Adjusted position
    size: 12,
    font: boldFont,
    color: rgb(0.2, 0.2, 0.2), // Almost black
  });

  // Order summary section removed

  // Line items table - adjusted position due to removed order summary
  const tableTop = height - 270; // Adjusted position
  const tableWidth = width - 85; // 30mm margins
  const colWidths = [226.8, 85.1, 113.4, 113.4]; // 80mm, 30mm, 40mm, 40mm
  const rowHeight = 28.3; // 10mm

  // Table header with gradient-like effect
  const gradientSteps = 10;
  const gradientHeight = rowHeight / gradientSteps;

  // Draw gradient-like header (from darker to lighter orange)
  for (let i = 0; i < gradientSteps; i++) {
    const opacity = 1 - (i * 0.05); // Gradually reduce opacity
    page.drawRectangle({
      x: 42.5, // 15mm
      y: tableTop - (i * gradientHeight),
      width: tableWidth,
      height: gradientHeight,
      color: rgb(1 * opacity, 0.33 * opacity, 0 * opacity), // Orange with varying opacity
    });
  }

  // Add rounded corners by drawing small white circles at the top corners
  const cornerRadius = 4;
  page.drawCircle({
    x: 42.5 + cornerRadius,
    y: tableTop - cornerRadius,
    size: cornerRadius,
    color: rgb(1, 0.33, 0), // Match the header color
  });

  page.drawCircle({
    x: 42.5 + tableWidth - cornerRadius,
    y: tableTop - cornerRadius,
    size: cornerRadius,
    color: rgb(1, 0.33, 0), // Match the header color
  });

  // Header text
  const headerTexts = ['Item', 'Quantity', 'Price', 'Total'];
  const headerX = [
    42.5 + 15, // Left-aligned
    42.5 + colWidths[0] + colWidths[1] / 2 - 25, // Centered
    42.5 + colWidths[0] + colWidths[1] + colWidths[2] - 40, // Right-aligned
    42.5 + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] - 40, // Right-aligned
  ];

  headerTexts.forEach((text, i) => {
    page.drawText(text, {
      x: headerX[i],
      y: tableTop - rowHeight / 2 - 5,
      size: 10,
      font: boldFont,
      color: rgb(1, 1, 1), // White
    });
  });

  // Table rows
  let currentY = tableTop - rowHeight;
  const items = order.items || [];

  // Format currency function
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  items.forEach((item: any, i: number) => {
    // Row background (alternating with subtle colors)
    page.drawRectangle({
      x: 42.5, // 15mm
      y: currentY - rowHeight,
      width: tableWidth,
      height: rowHeight,
      color: i % 2 === 0 ? rgb(0.98, 0.98, 0.98) : rgb(1, 1, 1),
      borderColor: rgb(0.95, 0.95, 0.95),
      borderWidth: 0.5,
    });

    // Item data with improved alignment
    // Item name - left aligned
    page.drawText(item.item_name, {
      x: 42.5 + 15, // Consistent with header
      y: currentY - rowHeight / 2 - 5,
      size: 9,
      font: font,
      color: rgb(0.2, 0.2, 0.2), // Darker text for better readability
    });

    // Quantity - center aligned
    page.drawText(item.quantity.toString(), {
      x: 42.5 + colWidths[0] + colWidths[1] / 2 - 5,
      y: currentY - rowHeight / 2 - 5,
      size: 9,
      font: font,
      color: rgb(0.2, 0.2, 0.2),
    });

    // Unit price - right aligned
    page.drawText(formatCurrency(item.unit_price), {
      x: 42.5 + colWidths[0] + colWidths[1] + colWidths[2] - 40, // Consistent with header
      y: currentY - rowHeight / 2 - 5,
      size: 9,
      font: font,
      color: rgb(0.2, 0.2, 0.2),
    });

    // Total amount - right aligned with medium font weight
    page.drawText(formatCurrency(item.total_amount), {
      x: 42.5 + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] - 40, // Consistent with header
      y: currentY - rowHeight / 2 - 5,
      size: 9,
      font: i === items.length - 1 ? boldFont : font, // Bold for last item
      color: rgb(0.2, 0.2, 0.2),
    });

    currentY -= rowHeight;
  });

  // Totals section
  const finalY = currentY - 28.3; // 10mm padding

  // Calculate totals
  const subtotal = order.total_amount || 0;
  const taxRate = 0; // No tax for now
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  // Modern totals section with rounded corners
  page.drawRectangle({
    x: 340.2, // 120mm
    y: finalY - 113.4, // 40mm height
    width: 212.6, // 75mm
    height: 113.4, // 40mm
    color: rgb(0.98, 0.98, 0.98), // Light gray background
    borderColor: rgb(0.9, 0.9, 0.9),
    borderWidth: 0.5,
    borderRadius: 4, // Rounded corners
  });

  // Subtotal row
  page.drawRectangle({
    x: 350.2, // 120mm + 10px padding
    y: finalY - 38.3, // First row
    width: 192.6, // 75mm - 20px padding
    height: 28.3, // Row height
    color: rgb(1, 1, 1), // White
    borderColor: rgb(0.95, 0.95, 0.95),
    borderWidth: 0.5,
  });

  // Tax row
  page.drawRectangle({
    x: 350.2, // 120mm + 10px padding
    y: finalY - 66.6, // Second row
    width: 192.6, // 75mm - 20px padding
    height: 28.3, // Row height
    color: rgb(1, 1, 1), // White
    borderColor: rgb(0.95, 0.95, 0.95),
    borderWidth: 0.5,
  });

  // Total row with orange background
  page.drawRectangle({
    x: 350.2, // 120mm + 10px padding
    y: finalY - 94.9, // Third row
    width: 192.6, // 75mm - 20px padding
    height: 28.3, // Row height
    color: rgb(1, 0.95, 0.9), // Very light orange
    borderColor: rgb(1, 0.8, 0.6),
    borderWidth: 0.5,
  });

  // Labels
  page.drawText('Subtotal:', {
    x: 360.2, // 125mm + padding
    y: finalY - 28.3 + 5, // 10mm from finalY, adjusted
    size: 10,
    font: font,
    color: rgb(0.3, 0.3, 0.3), // Darker text
  });

  page.drawText('Tax:', {
    x: 360.2, // 125mm + padding
    y: finalY - 56.7 + 5, // 20mm from finalY, adjusted
    size: 10,
    font: font,
    color: rgb(0.3, 0.3, 0.3), // Darker text
  });

  page.drawText('Total:', {
    x: 360.2, // 125mm + padding
    y: finalY - 85 + 5, // 30mm from finalY, adjusted
    size: 10,
    font: boldFont,
    color: rgb(0.3, 0.3, 0.3), // Darker text
  });

  // Values - right aligned
  page.drawText(formatCurrency(subtotal), {
    x: 520 - formatCurrency(subtotal).length * 5, // Right-aligned
    y: finalY - 28.3 + 5, // 10mm from finalY, adjusted
    size: 10,
    font: font,
    color: rgb(0.3, 0.3, 0.3), // Darker text
  });

  page.drawText(formatCurrency(taxAmount), {
    x: 520 - formatCurrency(taxAmount).length * 5, // Right-aligned
    y: finalY - 56.7 + 5, // 20mm from finalY, adjusted
    size: 10,
    font: font,
    color: rgb(0.3, 0.3, 0.3), // Darker text
  });

  page.drawText(formatCurrency(total), {
    x: 520 - formatCurrency(total).length * 5, // Right-aligned
    y: finalY - 85 + 5, // 30mm from finalY, adjusted
    size: 10,
    font: boldFont,
    color: rgb(0.7, 0.3, 0), // Orange for emphasis
  });

  // Notes section
  if (settings?.notes) {
    const notesY = finalY - 141.7; // 50mm from finalY
    page.drawText('Notes', {
      x: 42.5, // 15mm
      y: notesY,
      size: 11,
      font: boldFont,
      color: textColor,
    });

    page.drawText(settings.notes, {
      x: 42.5, // 15mm
      y: notesY - 19.8, // 7mm from notesY
      size: 10,
      font: font,
      color: textColor,
    });
  }

  // Payment details section
  const paymentDetailsY = finalY - 198.4; // 70mm from finalY
  page.drawText('Payment Details', {
    x: 42.5, // 15mm
    y: paymentDetailsY,
    size: 11,
    font: boldFont,
    color: textColor,
  });

  // Get bank details from settings or use defaults
  const bankDetails = settings?.bankDetails && settings.bankDetails.length > 0
    ? settings.bankDetails
    : [{ id: '1', bankName: 'ABSA BANK', accountName: 'IVAN PRINTS', accountNumber: '6008084570' }];

  // Get mobile money details from settings or use defaults
  const mobileMoneyDetails = settings?.mobileMoneyDetails && settings.mobileMoneyDetails.length > 0
    ? settings.mobileMoneyDetails
    : [{ id: '1', provider: 'Airtel', phoneNumber: '0755 541 373', contactName: 'Vuule Abdul' }];

  // Bank details section
  if (bankDetails.length > 0) {
    page.drawText('Bank Details', {
      x: 42.5, // 15mm
      y: paymentDetailsY - 28.3, // 10mm from paymentDetailsY
      size: 10,
      font: boldFont,
      color: textColor,
    });

    let currentY = paymentDetailsY - 48.1; // Starting Y position

    // Draw each bank detail
    bankDetails.forEach((bank, index) => {
      if (index > 0) {
        // Add spacing between multiple bank details
        currentY -= 10;
      }

      page.drawText(`Account Name: ${bank.accountName}`, {
        x: 42.5, // 15mm
        y: currentY, // Current Y position
        size: 10,
        font: font,
        color: textColor,
      });

      page.drawText(`Bank / Branch: ${bank.bankName}`, {
        x: 42.5, // 15mm
        y: currentY - 19.8, // 7mm down
        size: 10,
        font: font,
        color: textColor,
      });

      page.drawText(`Account Number: ${bank.accountNumber}`, {
        x: 42.5, // 15mm
        y: currentY - 39.6, // 14mm down
        size: 10,
        font: font,
        color: textColor,
      });

      // Update Y position for next bank detail
      currentY -= 59.4; // 21mm total height per bank detail
    });

    // Update Y position for mobile money section
    currentY -= 19.8; // Add some spacing

    // Mobile money section
    if (mobileMoneyDetails.length > 0) {
      page.drawText('Mobile Money', {
        x: 42.5, // 15mm
        y: currentY,
        size: 10,
        font: boldFont,
        color: textColor,
      });

      currentY -= 19.8; // 7mm down

      // Draw each mobile money detail
      mobileMoneyDetails.forEach((mobile, index) => {
        if (index > 0) {
          // Add spacing between multiple mobile money details
          currentY -= 10;
        }

        page.drawText(`Provider: ${mobile.provider}`, {
          x: 42.5, // 15mm
          y: currentY,
          size: 10,
          font: font,
          color: textColor,
        });

        page.drawText(`Phone: ${mobile.phoneNumber}`, {
          x: 42.5, // 15mm
          y: currentY - 19.8, // 7mm down
          size: 10,
          font: font,
          color: textColor,
        });

        page.drawText(`Contact: ${mobile.contactName}`, {
          x: 42.5, // 15mm
          y: currentY - 39.6, // 14mm down
          size: 10,
          font: font,
          color: textColor,
        });

        // Update Y position for next mobile money detail
        currentY -= 59.4; // 21mm total height per mobile money detail
      });
    }
  }

  // Footer
  if (settings?.includeFooter) {
    page.drawRectangle({
      x: 0,
      y: 0,
      width: width,
      height: 76.5, // 27mm
      color: primaryColor,
    });

    const footerText = 'M a k i n g   Y o u   V i s i b l e .';
    page.drawText(footerText, {
      x: width / 2 - 100,
      y: 38.3, // 13.5mm from bottom
      size: 12,
      font: boldFont,
      color: rgb(1, 1, 1), // White
    });
  }

  // Serialize the PDF to bytes
  return await pdfDoc.save();
}
