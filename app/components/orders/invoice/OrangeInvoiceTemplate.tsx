import React from 'react';
import { Order, OrderItem } from '@/types/orders';
import { InvoiceSettings } from './types';
import { formatCurrency, formatDate } from '@/lib/utils';

interface OrangeInvoiceTemplateProps {
  order: Order | null;
  settings: InvoiceSettings;
}

/**
 * A clean, professional invoice template with orange theme
 * Designed to match the reference image and ensure exact preview-to-PDF matching
 */
const OrangeInvoiceTemplate: React.FC<OrangeInvoiceTemplateProps> = ({
  order,
  settings,
}) => {
  if (!order) {
    return <div className="text-center p-8">No order data available</div>;
  }

  // Calculate totals
  const subtotal = order.total_amount || 0;
  const total = subtotal; // Base total from order items

  // Tax and discount are applied in the table rows and grand total calculation
  // We keep the base total as-is for the subtotal row

  // Format item display based on settings
  const formatItemDisplay = (item: OrderItem) => {
    let itemDisplay = '';

    if (settings.itemDisplayFormat === 'combined') {
      const parts = [];
      if (settings.showItemCategory && item.category_name) parts.push(item.category_name);
      if (settings.showItemName && item.item_name) parts.push(item.item_name);
      itemDisplay = parts.join(' - ');
      if (settings.showItemSize && item.size) itemDisplay += ` (${item.size})`;
    } else {
      // Default to item name if nothing is selected
      itemDisplay = settings.showItemName ? item.item_name : 'Item';
    }

    return itemDisplay;
  };

  // Convert number to words (simplified version)
  const numberToWords = (num: number) => {
    // This is a simplified version - in a real implementation, you would use a proper
    // number-to-words library to convert numbers like 2,430,000 to
    // "Two million four hundred thirty thousand"
    return `${num.toLocaleString('en-US', { maximumFractionDigits: 0 }).toUpperCase()} SHILLINGS ONLY`;
  };

  // A5 dimensions in mm: 148mm x 210mm
  const pageWidth = 148;
  const pageHeight = 210;

  // Page margins in mm
  const margin = 10;

  // Content width (accounting for margins)
  const contentWidth = pageWidth - (margin * 2);

  // Define colors
  const primaryColor = '#f97316'; // Orange
  const secondaryColor = '#22c55e'; // Green for sidebar and headers
  const textColor = '#333333'; // Dark gray
  const lightGray = '#f3f4f6'; // Light gray for alternating rows
  const borderColor = '#e5e7eb'; // Border color
  const redColor = '#dc2626'; // Red for amount in words

  // Define specific formatting options
  const useGreenSidebar = false; // Set to false to remove green sidebar
  const useBoxedDate = false; // Set to false to use simple date format
  const useProformaLabel = false; // Set to false to use INVOICE label

  // Common styles
  const commonStyles = {
    boxSizing: 'border-box' as const,
    fontFamily: 'Arial, sans-serif',
    margin: 0,
    padding: 0,
    WebkitPrintColorAdjust: 'exact' as const, // Ensure colors print correctly
    printColorAdjust: 'exact' as const,
    WebkitFontSmoothing: 'antialiased' as const, // Better font rendering
    MozOsxFontSmoothing: 'grayscale' as const,
  };

  return (
    <div
      className="invoice-template invoice-content"
      style={{
        ...commonStyles,
        width: '100%', // Fill the entire container width
        height: '100%', // Fill the entire container height
        padding: `${margin - 2}mm`, // Reduced margin to create more space
        paddingTop: `${margin - 4}mm`, // Further reduced top padding
        backgroundColor: 'white',
        color: textColor,
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid #d1d5db',
        borderRadius: '4px',
        overflow: 'hidden',
        position: 'relative', // Added for absolute positioning of sidebar
      }}
    >
      {/* Green Sidebar */}
      {useGreenSidebar && (
        <div style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: '15mm',
          height: '100%',
          backgroundColor: secondaryColor,
          zIndex: 1,
        }}></div>
      )}
      {/* HEADER - Redesigned with orange background */}
      <div style={{
        ...commonStyles,
        width: '100%',
        marginTop: '-2mm', // Move header up slightly to create more space
        marginBottom: '5mm',
        position: 'relative',
        zIndex: 2,
        backgroundColor: primaryColor,
        padding: '3mm',
        color: 'white',
      }}>
        <div style={{
          ...commonStyles,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          {/* Left side: Logo and Company Name */}
          <div style={{
            ...commonStyles,
            display: 'flex',
            alignItems: 'center',
            width: '60%',
          }}>
            {/* Logo */}
            {settings.includeLogo && (
              <div style={{
                ...commonStyles,
                marginRight: '3mm',
              }}>
                <img
                  src={settings.companyLogo || '/images/default-logo.svg'}
                  alt="Company Logo"
                  style={{
                    height: '15mm',
                    maxWidth: '25mm',
                    objectFit: 'contain',
                    backgroundColor: 'white',
                    padding: '1mm',
                  }}
                />
              </div>
            )}

            {/* Company Name and Tagline */}
            <div>
              <h1 style={{
                ...commonStyles,
                fontSize: '14pt',
                fontWeight: '800',
                color: 'white',
                margin: '0 0 1mm 0',
              }}>
                {settings.companyName || 'IVAN PRINTS'}
              </h1>
              <p style={{
                ...commonStyles,
                fontSize: '8pt',
                color: 'white',
                margin: '0',
              }}>
                {settings.companyAddress || 'Printing, Designing, Branding.'}
              </p>
            </div>
          </div>

          {/* Right side: Contact Info */}
          <div style={{
            ...commonStyles,
            fontSize: '8pt',
            color: 'white',
            lineHeight: '1.3',
            textAlign: 'right',
          }}>
            <p style={{ margin: '0' }}>Email: {settings.companyEmail || 'sherilex256@gmail.com'}</p>
            <p style={{ margin: '0' }}>Contact: {settings.companyPhone || '0755 541 373'}</p>
            {settings.companyLocation && (
              <p style={{ margin: '0' }}>Location: {settings.companyLocation}</p>
            )}
            <p style={{ margin: '0', fontWeight: '700' }}>TIN: {settings.tinNumber || '1028570150'}</p>
          </div>
        </div>
      </div>

      {/* INVOICE DETAILS ROW */}
      <div style={{
        ...commonStyles,
        width: '100%',
        marginBottom: '5mm',
        display: 'flex',
        justifyContent: 'space-between',
        borderBottom: '1px solid #e5e7eb',
        paddingBottom: '3mm',
      }}>
        {/* Left side: Invoice Number */}
        <div style={{
          ...commonStyles,
        }}>
          <div style={{
            ...commonStyles,
            display: 'flex',
            alignItems: 'center',
          }}>
            <h2 style={{
              ...commonStyles,
              fontSize: '11pt',
              fontWeight: '700',
              color: textColor,
              marginRight: '3mm',
              margin: '0',
            }}>
              INVOICE NO.
            </h2>
            <span style={{
              ...commonStyles,
              fontSize: '11pt',
              fontWeight: '700',
              color: redColor,
              margin: '0',
            }}>
              {order.order_number || `890`}
            </span>
          </div>
        </div>

        {/* Right side: Date */}
        <div style={{
          ...commonStyles,
        }}>
          <p style={{
            ...commonStyles,
            fontSize: '10pt',
            fontWeight: '700',
            margin: '0',
            textAlign: 'right',
          }}>
            Date: {formatDate(new Date().toISOString(), 'dd/MM/yyyy')}
          </p>
        </div>
      </div>

      {/* CLIENT INFO */}
      <div style={{
        ...commonStyles,
        width: '100%',
        marginBottom: '5mm',
        position: 'relative',
        zIndex: 2,
        display: 'flex',
        alignItems: 'center',
      }}>
        <div style={{
          ...commonStyles,
          fontWeight: '700',
          fontSize: '10pt',
          marginRight: '3mm',
        }}>
          Bill To:
        </div>
        <div style={{
          ...commonStyles,
          fontSize: '11pt',
          fontWeight: '700',
          color: redColor,
          borderBottom: '1px solid #e5e7eb',
          paddingBottom: '1mm',
          flexGrow: 1,
        }}>
          {order.client_name || 'PRIMAX'}
        </div>
      </div>

      {/* ORDER ITEMS TABLE */}
      <div style={{
        ...commonStyles,
        width: '100%',
        marginBottom: '5mm',
        position: 'relative',
        zIndex: 2,
      }}>
        <table style={{
          ...commonStyles,
          width: '100%',
          tableLayout: 'fixed', // Force table to respect column widths
          borderCollapse: 'collapse',
          border: '1px solid #000', // Thinner border for a cleaner look
          pageBreakInside: 'avoid', // Prevent table from breaking across pages
          WebkitPrintColorAdjust: 'exact', // Ensure colors print correctly
          printColorAdjust: 'exact',
        }}>
          <thead>
            <tr>
              <th style={{
                ...commonStyles,
                width: '50%',
                padding: '1.5mm',
                fontSize: '9pt',
                fontWeight: '700',
                textAlign: 'left',
                backgroundColor: primaryColor,
                color: 'white',
                borderBottom: '1px solid #e5e7eb',
                borderRight: '1px solid #e5e7eb',
                WebkitPrintColorAdjust: 'exact', // Ensure colors print correctly
                printColorAdjust: 'exact',
              }}>
                DESCRIPTION
              </th>
              <th style={{
                ...commonStyles,
                width: '10%',
                padding: '1.5mm',
                fontSize: '9pt',
                fontWeight: '700',
                textAlign: 'center',
                backgroundColor: primaryColor,
                color: 'white',
                borderBottom: '1px solid #e5e7eb',
                borderRight: '1px solid #e5e7eb',
                WebkitPrintColorAdjust: 'exact', // Ensure colors print correctly
                printColorAdjust: 'exact',
              }}>
                QTY
              </th>
              <th style={{
                ...commonStyles,
                width: '20%',
                padding: '1.5mm',
                fontSize: '9pt',
                fontWeight: '700',
                textAlign: 'right',
                backgroundColor: primaryColor,
                color: 'white',
                borderBottom: '1px solid #e5e7eb',
                borderRight: '1px solid #e5e7eb',
                WebkitPrintColorAdjust: 'exact', // Ensure colors print correctly
                printColorAdjust: 'exact',
              }}>
                UNIT PRICE
              </th>
              <th style={{
                ...commonStyles,
                width: '20%',
                padding: '1.5mm',
                fontSize: '9pt',
                fontWeight: '700',
                textAlign: 'right',
                backgroundColor: primaryColor,
                color: 'white',
                borderBottom: '1px solid #e5e7eb',
                WebkitPrintColorAdjust: 'exact', // Ensure colors print correctly
                printColorAdjust: 'exact',
              }}>
                AMOUNT
              </th>
            </tr>
          </thead>
          <tbody>
            {order.items?.map((item: OrderItem, index: number) => (
              <tr key={item.id} style={{
                backgroundColor: index % 2 === 0 ? 'white' : lightGray,
              }}>
                <td style={{
                  ...commonStyles,
                  padding: '1.5mm',
                  fontSize: '9pt',
                  borderBottom: '1px solid #e5e7eb',
                  borderRight: '1px solid #e5e7eb',
                  whiteSpace: 'normal',
                  wordBreak: 'break-word',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {formatItemDisplay(item)}
                </td>
                <td style={{
                  ...commonStyles,
                  padding: '1.5mm',
                  fontSize: '9pt',
                  borderBottom: '1px solid #e5e7eb',
                  borderRight: '1px solid #e5e7eb',
                  textAlign: 'center',
                }}>
                  {item.quantity}
                </td>
                <td style={{
                  ...commonStyles,
                  padding: '1.5mm',
                  fontSize: '9pt',
                  borderBottom: '1px solid #e5e7eb',
                  borderRight: '1px solid #e5e7eb',
                  textAlign: 'right',
                }}>
                  {item.unit_price.toLocaleString()}/=
                </td>
                <td style={{
                  ...commonStyles,
                  padding: '1.5mm',
                  fontSize: '9pt',
                  borderBottom: '1px solid #e5e7eb',
                  textAlign: 'right',
                  fontWeight: '700',
                }}>
                  {item.total_amount.toLocaleString()}/=
                </td>
              </tr>
            ))}

            {/* Add empty rows to ensure minimum 10 rows */}
            {Array.from({ length: Math.max(10 - (order.items?.length || 0), 0) }).map((_, index) => (
              <tr key={`empty-${index}`} style={{
                backgroundColor: (order.items?.length || 0) + index % 2 === 0 ? 'white' : lightGray,
                height: '8mm', // Reduced height for better space usage
              }}>
                <td style={{
                  ...commonStyles,
                  padding: '1.5mm',
                  fontSize: '9pt',
                  borderBottom: '1px solid #e5e7eb',
                  borderRight: '1px solid #e5e7eb',
                }}>&nbsp;</td>
                <td style={{
                  ...commonStyles,
                  padding: '1.5mm',
                  fontSize: '9pt',
                  borderBottom: '1px solid #e5e7eb',
                  borderRight: '1px solid #e5e7eb',
                }}>&nbsp;</td>
                <td style={{
                  ...commonStyles,
                  padding: '1.5mm',
                  fontSize: '9pt',
                  borderBottom: '1px solid #e5e7eb',
                  borderRight: '1px solid #e5e7eb',
                }}>&nbsp;</td>
                <td style={{
                  ...commonStyles,
                  padding: '1.5mm',
                  fontSize: '9pt',
                  borderBottom: '1px solid #e5e7eb',
                }}>&nbsp;</td>
              </tr>
            ))}

            {/* Subtotal row */}
            <tr>
              <td colSpan={3} style={{
                ...commonStyles,
                padding: '1.5mm',
                fontSize: '9pt',
                fontWeight: '700',
                textAlign: 'right',
                borderTop: '1px solid #000',
                borderBottom: '1px solid #e5e7eb',
                borderRight: '1px solid #e5e7eb',
                backgroundColor: '#f9fafb',
              }}>
                Subtotal
              </td>
              <td style={{
                ...commonStyles,
                padding: '1.5mm',
                fontSize: '9pt',
                fontWeight: '700',
                textAlign: 'right',
                borderTop: '1px solid #000',
                borderBottom: '1px solid #e5e7eb',
                backgroundColor: '#f9fafb',
              }}>
                {total.toLocaleString()}/=
              </td>
            </tr>

            {/* Tax row - only shown if includeTax is true */}
            {settings.includeTax && (
              <tr>
                <td colSpan={3} style={{
                  ...commonStyles,
                  padding: '1.5mm',
                  fontSize: '9pt',
                  fontWeight: '700',
                  textAlign: 'right',
                  borderBottom: '1px solid #e5e7eb',
                  borderRight: '1px solid #e5e7eb',
                  backgroundColor: '#f9fafb',
                }}>
                  Tax ({settings.taxRate || '0'}%)
                </td>
                <td style={{
                  ...commonStyles,
                  padding: '1.5mm',
                  fontSize: '9pt',
                  fontWeight: '700',
                  textAlign: 'right',
                  borderBottom: '1px solid #e5e7eb',
                  backgroundColor: '#f9fafb',
                }}>
                  {settings.taxRate ? Math.round(total * (settings.taxRate / 100)).toLocaleString() : '0'}/=
                </td>
              </tr>
            )}

            {/* Discount row - only shown if includeDiscount is true */}
            {settings.includeDiscount && (
              <tr>
                <td colSpan={3} style={{
                  ...commonStyles,
                  padding: '1.5mm',
                  fontSize: '9pt',
                  fontWeight: '700',
                  textAlign: 'right',
                  borderBottom: '1px solid #e5e7eb',
                  borderRight: '1px solid #e5e7eb',
                  backgroundColor: '#f9fafb',
                }}>
                  Discount ({settings.discountRate || '0'}%)
                </td>
                <td style={{
                  ...commonStyles,
                  padding: '1.5mm',
                  fontSize: '9pt',
                  fontWeight: '700',
                  textAlign: 'right',
                  borderBottom: '1px solid #e5e7eb',
                  backgroundColor: '#f9fafb',
                }}>
                  {settings.discountRate ? Math.round(total * (settings.discountRate / 100)).toLocaleString() : '0'}/=
                </td>
              </tr>
            )}

            {/* Grand Total row */}
            <tr>
              <td colSpan={3} style={{
                ...commonStyles,
                padding: '2mm',
                fontSize: '10pt',
                fontWeight: '700',
                textAlign: 'right',
                borderBottom: '1px solid #000',
                borderRight: '1px solid #e5e7eb',
                backgroundColor: '#f9fafb',
              }}>
                Grand Total
              </td>
              <td style={{
                ...commonStyles,
                padding: '2mm',
                fontSize: '10pt',
                fontWeight: '700',
                textAlign: 'right',
                borderBottom: '1px solid #000',
                backgroundColor: '#f9fafb',
                color: redColor,
              }}>
                {(() => {
                  let finalTotal = total;

                  // Add tax if enabled
                  if (settings.includeTax && settings.taxRate) {
                    finalTotal += Math.round(total * (settings.taxRate / 100));
                  }

                  // Subtract discount if enabled
                  if (settings.includeDiscount && settings.discountRate) {
                    finalTotal -= Math.round(total * (settings.discountRate / 100));
                  }

                  return finalTotal.toLocaleString();
                })()}/=
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* AMOUNT IN WORDS */}
      <div style={{
        ...commonStyles,
        width: '100%',
        marginBottom: '5mm',
        position: 'relative',
        zIndex: 2,
      }}>
        <div style={{
          ...commonStyles,
          display: 'flex',
          alignItems: 'center',
          borderBottom: '1px solid #e5e7eb',
          paddingBottom: '2mm',
        }}>
          <div style={{
            ...commonStyles,
            fontSize: '9pt',
            fontWeight: '700',
            marginRight: '3mm',
          }}>
            Amount in words:
          </div>
          <div style={{
            ...commonStyles,
            fontSize: '9pt',
            fontWeight: '700',
            color: redColor,
            wordBreak: 'break-word',
            whiteSpace: 'normal',
            flexGrow: 1,
          }}>
            {(() => {
              let finalTotal = total;

              // Add tax if enabled
              if (settings.includeTax && settings.taxRate) {
                finalTotal += Math.round(total * (settings.taxRate / 100));
              }

              // Subtract discount if enabled
              if (settings.includeDiscount && settings.discountRate) {
                finalTotal -= Math.round(total * (settings.discountRate / 100));
              }

              return numberToWords(finalTotal);
            })()}
          </div>
        </div>
      </div>

      {/* No horizontal line - removed to save space */}

      {/* PAYMENT AND SIGNATURE */}
      <div style={{
        ...commonStyles,
        width: '100%',
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '8mm', // Increased bottom margin for more space
        flexWrap: 'wrap',
        position: 'relative',
        zIndex: 2,
      }}>
        {/* PAYMENT DETAILS */}
        <div style={{
          ...commonStyles,
          width: '48%',
        }}>
          <div style={{
            ...commonStyles,
            borderBottom: '2px solid ' + primaryColor,
            paddingBottom: '1mm',
            marginBottom: '3mm', // Increased margin for more space
          }}>
            <h3 style={{
              ...commonStyles,
              fontSize: '10pt',
              fontWeight: '700',
              margin: '0',
              color: primaryColor,
            }}>
              PAYMENT DETAILS
            </h3>
          </div>

          {/* Bank Transfer */}
          <div style={{
            ...commonStyles,
            marginBottom: '5mm', // Increased margin for more space
          }}>
            <h4 style={{
              ...commonStyles,
              fontSize: '9pt',
              fontWeight: '700',
              margin: '0 0 3mm 0', // Increased margin for more space
              color: '#666',
              borderBottom: '1px solid #e5e7eb',
              paddingBottom: '1mm',
            }}>
              Bank Details
            </h4>
            <table style={{
              ...commonStyles,
              width: '100%',
              fontSize: '8pt',
              borderCollapse: 'collapse',
            }}>
              <tbody>
                <tr>
                  <td style={{ width: '40%', padding: '1.5mm 0', color: '#666' }}>Account Name:</td>
                  <td style={{ width: '60%', padding: '1.5mm 0', fontWeight: '700' }}>
                    {settings.bankDetails?.[0]?.accountName || 'IVAN PRINTS'}
                  </td>
                </tr>
                <tr>
                  <td style={{ width: '40%', padding: '1.5mm 0', color: '#666' }}>Bank / Branch:</td>
                  <td style={{ width: '60%', padding: '1.5mm 0', fontWeight: '700' }}>
                    {settings.bankDetails?.[0]?.bankName || 'ABSA BANK'}
                  </td>
                </tr>
                <tr>
                  <td style={{ width: '40%', padding: '1.5mm 0', color: '#666' }}>Account Number:</td>
                  <td style={{ width: '60%', padding: '1.5mm 0', fontWeight: '700' }}>
                    {settings.bankDetails?.[0]?.accountNumber || '6008084570'}
                  </td>
                </tr>
                {/* Space for additional bank details in the future */}
                <tr>
                  <td colSpan={2} style={{ padding: '1.5mm 0' }}></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Mobile Money */}
          <div style={{
            ...commonStyles,
            marginBottom: '5mm', // Increased margin for more space
          }}>
            <h4 style={{
              ...commonStyles,
              fontSize: '9pt',
              fontWeight: '700',
              margin: '0 0 3mm 0', // Increased margin for more space
              color: '#666',
              borderBottom: '1px solid #e5e7eb',
              paddingBottom: '1mm',
            }}>
              Mobile Money
            </h4>
            <table style={{
              ...commonStyles,
              width: '100%',
              fontSize: '8pt',
              borderCollapse: 'collapse',
            }}>
              <tbody>
                {settings.mobileMoneyDetails?.map((detail, index) => (
                  <React.Fragment key={detail.id || index}>
                    <tr>
                      <td style={{ width: '40%', padding: '1mm 0', color: '#666' }}>Provider:</td>
                      <td style={{ width: '60%', padding: '1mm 0', fontWeight: '700' }}>
                        {detail.provider || 'Airtel'}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ width: '40%', padding: '1mm 0', color: '#666' }}>Phone Number:</td>
                      <td style={{ width: '60%', padding: '1mm 0', fontWeight: '700' }}>
                        {detail.phoneNumber || '0755 541 373'}
                      </td>
                    </tr>
                    {(detail.contactName || (index === 0 && !detail.contactName)) && (
                      <tr>
                        <td style={{ width: '40%', padding: '1mm 0', color: '#666' }}>Name:</td>
                        <td style={{ width: '60%', padding: '1mm 0', fontWeight: '700' }}>
                          {detail.contactName || 'Vuule Aboul'}
                        </td>
                      </tr>
                    )}
                    {index < (settings.mobileMoneyDetails?.length || 1) - 1 && (
                      <tr>
                        <td colSpan={2} style={{ padding: '1mm 0' }}>
                          <div style={{ borderBottom: '1px dashed #e5e7eb', margin: '1mm 0' }}></div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
                {(!settings.mobileMoneyDetails || settings.mobileMoneyDetails.length === 0) && (
                  <>
                    <tr>
                      <td style={{ width: '40%', padding: '1.5mm 0', color: '#666' }}>Provider:</td>
                      <td style={{ width: '60%', padding: '1.5mm 0', fontWeight: '700' }}>Airtel</td>
                    </tr>
                    <tr>
                      <td style={{ width: '40%', padding: '1.5mm 0', color: '#666' }}>Phone Number:</td>
                      <td style={{ width: '60%', padding: '1.5mm 0', fontWeight: '700' }}>0755 541 373</td>
                    </tr>
                    <tr>
                      <td style={{ width: '40%', padding: '1.5mm 0', color: '#666' }}>Name:</td>
                      <td style={{ width: '60%', padding: '1.5mm 0', fontWeight: '700' }}>Vuule Aboul</td>
                    </tr>
                    {/* Space for additional mobile money details in the future */}
                    <tr>
                      <td colSpan={2} style={{ padding: '1.5mm 0' }}></td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* NOTES AND SIGNATURE */}
        <div style={{
          ...commonStyles,
          width: '48%',
        }}>
          {/* Notes Section */}
          <div style={{
            ...commonStyles,
            borderBottom: '2px solid ' + primaryColor,
            paddingBottom: '1mm',
            marginBottom: '3mm', // Increased margin for more space
          }}>
            <h3 style={{
              ...commonStyles,
              fontSize: '10pt',
              fontWeight: '700',
              margin: '0',
              color: primaryColor,
            }}>
              NOTES & SIGNATURE
            </h3>
          </div>

          {settings.notes && (
            <div style={{
              ...commonStyles,
              marginBottom: '5mm', // Increased margin for more space
            }}>
              <h4 style={{
                ...commonStyles,
                fontSize: '9pt',
                fontWeight: '700',
                margin: '0 0 3mm 0', // Increased margin for more space
                color: '#666',
                borderBottom: '1px solid #e5e7eb',
                paddingBottom: '1mm',
              }}>
                Notes
              </h4>
              <p style={{
                ...commonStyles,
                whiteSpace: 'pre-wrap',
                margin: '0 0 2mm 0', // Added bottom margin for more space
                fontSize: '8pt',
              }}>
                {settings.notes}
              </p>
              {/* Space for additional notes in the future */}
              <div style={{ height: '2mm' }}></div>
            </div>
          )}

          {/* Signature Section - only shown if includeSignature is true */}
          <div style={{
            ...commonStyles,
            marginTop: settings.notes ? '0' : '3mm',
          }}>
            <h4 style={{
              ...commonStyles,
              fontSize: '9pt',
              fontWeight: '700',
              margin: '0 0 3mm 0', // Increased margin for more space
              color: '#666',
              borderBottom: '1px solid #e5e7eb',
              paddingBottom: '1mm',
            }}>
              Signature
            </h4>
            <p style={{
              ...commonStyles,
              fontSize: '8pt',
              margin: '0 0 3mm 0', // Increased margin for more space
              color: '#666',
            }}>
              ACCOUNTS ARE DUE ON DEMAND
            </p>
            {settings.includeSignature && (
              <div style={{
                ...commonStyles,
                border: '1px solid #e5e7eb',
                height: '18mm', // Increased height for more space
                marginBottom: '3mm', // Increased margin for more space
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: '#f9fafb',
              }}>
                <p style={{
                  ...commonStyles,
                  fontSize: '8pt',
                  color: '#666',
                  margin: '0',
                }}>
                  Sign here
                </p>
              </div>
            )}
            {/* Space for additional signature information in the future */}
            <div style={{ height: '2mm' }}></div>
          </div>
        </div>
      </div>

      {/* FOOTER - only shown if includeFooter is true */}
      {settings.includeFooter && (
        <div style={{
          ...commonStyles,
          width: '100%',
          textAlign: 'center',
          marginTop: '5mm', // Fixed margin instead of auto to prevent content being hidden
          borderTop: '2px solid ' + primaryColor,
          padding: '3mm', // Reduced padding to ensure visibility
          position: 'relative',
          zIndex: 2,
        }}>
          <p style={{
            ...commonStyles,
            fontSize: '8pt',
            margin: '0 0 1mm 0', // Reduced bottom margin to save space
            color: '#666',
          }}>
            {settings.companyName || 'IVAN PRINTS'} | {settings.customFooter || 'Making You Visible'}
          </p>
          <p style={{
            ...commonStyles,
            fontSize: '7pt',
            margin: '0',
            color: '#888',
          }}>
            Thank you for your business
          </p>
        </div>
      )}
    </div>
  );
};

export default OrangeInvoiceTemplate;
