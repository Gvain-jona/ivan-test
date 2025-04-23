'use client';

import React from 'react';
import { Order } from '@/types/orders';
import { InvoiceSettings } from '../../types';
import {
  formatCurrency,
  formatDate,
  formatItemName,
  calculateSubtotal,
  calculateTax,
  calculateDiscount,
  calculateTotal
} from '../../utils/formatters';

interface ProfessionalTemplateProps {
  order: Order;
  settings: InvoiceSettings;
}

/**
 * Professional invoice template with clean design
 * Uses direct inline styles for better PDF rendering
 */
const ProfessionalTemplate: React.FC<ProfessionalTemplateProps> = ({
  order,
  settings,
}) => {
  // Define styles as JavaScript objects for direct application
  // This ensures styles are properly applied in the PDF
  const styles = {
    container: {
      fontFamily: 'Arial, sans-serif',
      color: '#333333',
      padding: '0',
      paddingBottom: '0', // Remove bottom padding to allow footer to touch bottom
      width: '100%', // Fill container width
      minHeight: '100%', // Fill container height
      boxSizing: 'border-box' as const,
      position: 'relative' as const,
      backgroundColor: '#FFFFFF',
      overflowX: 'hidden' as const, // Prevent horizontal overflow
      display: 'flex',
      flexDirection: 'column' as const,
    },
    header: {
      marginBottom: '10mm',
      backgroundColor: '#F97316',
      color: 'white',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      position: 'relative' as const,
      borderRadius: '0 0 5mm 5mm',
      overflow: 'hidden' as const,
    },
    headerTop: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '10mm 10mm 5mm',
      alignItems: 'center',
      borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
    },
    headerBottom: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '5mm 10mm 10mm',
      alignItems: 'flex-start',
    },
    companyInfo: {
      flex: '1',
    },
    companyName: {
      fontSize: '20pt',
      fontWeight: 'bold',
      margin: '0 0 3mm 0',
      color: 'white',
      letterSpacing: '0.2mm',
    },
    companyDetails: {
      fontSize: '9pt',
      lineHeight: '1.4',
      color: 'rgba(255, 255, 255, 0.9)',
    },
    invoiceInfo: {
      textAlign: 'right' as const,
      minWidth: '60mm',
      flex: '1',
    },
    invoiceTitle: {
      fontSize: '24pt',
      fontWeight: 'bold',
      margin: '0',
      color: 'white',
      letterSpacing: '1mm',
      textTransform: 'uppercase' as const,
    },
    invoiceNumber: {
      fontSize: '10pt',
      margin: '0 0 1mm 0',
      color: 'rgba(255, 255, 255, 0.9)',
    },
    invoiceDate: {
      fontSize: '10pt',
      margin: '0',
      color: 'rgba(255, 255, 255, 0.9)',
    },
    logo: {
      maxWidth: '60mm',
      maxHeight: '25mm',
      objectFit: 'contain' as const,
      filter: 'brightness(0) invert(1)', // Make logo white
    },
    clientSection: {
      marginBottom: '8mm',
      backgroundColor: '#FAFAFA',
      padding: '3mm 4mm',
      borderRadius: '2mm',
      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
      borderLeft: '3px solid #F97316',
      marginLeft: '10mm',
      marginRight: '10mm',
    },
    sectionTitle: {
      fontSize: '10pt',
      fontWeight: 'bold',
      margin: '0 0 2mm 0',
      color: '#F97316',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.5mm',
    },
    clientName: {
      fontSize: '12pt',
      fontWeight: 'bold',
      margin: '0 0 1mm 0',
      color: '#222222',
    },
    clientDetails: {
      fontSize: '9pt',
      lineHeight: '1.4',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse' as const,
      marginBottom: '8mm',
      tableLayout: 'fixed' as const, // Ensure consistent column widths
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      borderRadius: '2mm',
      overflow: 'visible',
      marginLeft: '0',
      marginRight: '0',
      fontSize: '8pt', // Slightly smaller font for better fit
      border: '1.5px solid #E5E7EB',
    },
    tableHeader: {
      backgroundColor: '#F97316',
      color: 'white',
      fontSize: '8pt',
      fontWeight: 'bold',
      padding: '2.5mm 1.5mm',
      textAlign: 'left' as const,
      border: '1px solid #F97316',
    },
    tableHeaderRight: {
      backgroundColor: '#F97316',
      color: 'white',
      fontSize: '8pt',
      fontWeight: 'bold',
      padding: '2.5mm 1.5mm',
      textAlign: 'right' as const,
      border: '1px solid #F97316',
    },
    tableRowEven: {
      backgroundColor: '#FFFFFF',
    },
    tableRowOdd: {
      backgroundColor: '#F9FAFB',
    },
    tableCell: {
      fontSize: '8pt',
      padding: '1.5mm 1.5mm',
      border: '0.75px solid #E5E7EB',
      verticalAlign: 'middle' as const,
      overflow: 'hidden' as const,
      textOverflow: 'ellipsis' as const,
      whiteSpace: 'nowrap' as const,
      height: '7mm',
      boxSizing: 'border-box' as const,
    },
    tableCellRight: {
      fontSize: '8pt',
      padding: '1.5mm 1.5mm',
      border: '0.75px solid #E5E7EB',
      textAlign: 'right' as const,
      verticalAlign: 'middle' as const,
      overflow: 'hidden' as const,
      textOverflow: 'ellipsis' as const,
      whiteSpace: 'nowrap' as const,
      height: '7mm',
      fontWeight: 'bold',
    },
    summary: {
      marginLeft: 'auto',
      width: '60mm',
      marginBottom: '8mm',
      backgroundColor: '#FAFAFA',
      padding: '3mm',
      borderRadius: '2mm',
      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
      marginRight: '10mm',
      borderLeft: '3px solid #F97316',
    },
    summaryItem: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: '8pt',
      padding: '0.8mm 0',
    },
    summaryTotal: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: '10pt',
      fontWeight: 'bold',
      padding: '2mm 0 1mm',
      borderTop: '1px solid #E5E7EB',
      marginTop: '1mm',
      color: '#F97316',
    },
    summaryPaid: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: '9pt',
      padding: '1mm 0',
      color: '#22C55E',
    },
    summaryBalance: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: '10pt',
      fontWeight: 'bold',
      color: '#DC2626',
      backgroundColor: 'rgba(220, 38, 38, 0.05)',
      borderRadius: '1mm',
      padding: '1.5mm 2mm',
      marginTop: '1mm',
    },
    paymentAndNotesContainer: {
      display: 'flex',
      justifyContent: 'space-between' as const,
      gap: '8mm',
      marginBottom: '10mm',
      marginLeft: '10mm',
      marginRight: '10mm',
    },
    paymentInfo: {
      flex: '3',
      marginBottom: '0',
    },
    paymentMethodsContainer: {
      display: 'flex',
      flexWrap: 'wrap' as const,
      gap: '3mm',
      justifyContent: 'flex-start' as const,
    },
    paymentMethod: {
      fontSize: '9pt',
      marginBottom: '3mm',
      backgroundColor: '#F9FAFB',
      border: '1px solid #E5E7EB',
      padding: '3mm',
      borderRadius: '2mm',
      minWidth: '48%',
      maxWidth: '100%',
      flexGrow: 1 as const,
      boxSizing: 'border-box' as const,
      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
      transition: 'transform 0.2s ease-in-out',
      position: 'relative' as const,
      borderLeft: '3px solid #F97316',
    },
    notes: {
      fontSize: '9pt',
      marginBottom: '0',
      padding: '3mm',
      backgroundColor: '#F9FAFB',
      border: '1px solid #E5E7EB',
      flex: '2',
      minHeight: '25mm',
      borderRadius: '2mm',
      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
      borderLeft: '3px solid #F97316',
      lineHeight: '1.4',
    },
    footer: {
      fontSize: '8pt',
      textAlign: 'center' as const,
      marginTop: 'auto', // Push to bottom of container
      backgroundColor: '#333333',
      color: 'white',
      padding: '5mm 0',
      marginBottom: '0', // Align with bottom edge
      marginLeft: '0', // Align with left edge
      marginRight: '0', // Align with right edge
      width: '100%',
      position: 'relative' as const,
      boxShadow: '0 -2px 4px rgba(0,0,0,0.05)',
      borderRadius: '0 0 3mm 3mm',
    },
  };

  // Calculate financial values
  const subtotal = calculateSubtotal(order);
  const tax = calculateTax(order, settings);
  const discount = calculateDiscount(order, settings);
  const total = calculateTotal(order, settings);

  // Add a data attribute to help identify this as the container for PDF generation
  // Ensure the container has fixed dimensions for exact capture
  const containerStyle = {
    ...styles.container,
    width: '210mm',
    minHeight: '297mm',
    backgroundColor: '#FFFFFF',
    position: 'relative' as const,
    overflow: 'visible' as const, // Allow content to be visible
    boxSizing: 'border-box' as const,
    padding: '0', // Remove padding to maximize space
  };

  return (
    <div style={containerStyle} data-pdf-container="true">
      {/* Header Section */}
      <div style={styles.header}>
        {/* Header Top - Logo and Invoice Title */}
        <div style={styles.headerTop}>
          {settings.showLogo && settings.companyLogo && (
            <img
              src={settings.companyLogo}
              alt="Company Logo"
              style={styles.logo}
            />
          )}
          <h2 style={styles.invoiceTitle}>INVOICE</h2>
        </div>

        {/* Header Bottom - Company Info and Invoice Details */}
        <div style={styles.headerBottom}>
          <div style={styles.companyInfo}>
            <h1 style={styles.companyName}>{settings.companyName}</h1>
            <div style={styles.companyDetails}>
              {settings.companyAddress && <p style={{ margin: '0' }}>{settings.companyAddress}</p>}
              {settings.companyEmail && <p style={{ margin: '0' }}>Email: {settings.companyEmail}</p>}
              {settings.companyPhone && <p style={{ margin: '0' }}>Tel: {settings.companyPhone}</p>}
              {settings.tinNumber && <p style={{ margin: '0' }}>TIN: {settings.tinNumber}</p>}
            </div>
          </div>
          <div style={styles.invoiceInfo}>
            <p style={styles.invoiceNumber}>No: {order.order_number || `#${order.id?.substring(0, 8)}`}</p>
            <p style={styles.invoiceDate}>Date: {formatDate(new Date().toISOString())}</p>
          </div>
        </div>
      </div>

      {/* Main Content Wrapper */}
      <div style={{ flex: '1', display: 'flex', flexDirection: 'column' as const }}>
        {/* Client Information */}
        <div style={styles.clientSection}>
          <h3 style={styles.sectionTitle}>Bill To:</h3>
          <p style={styles.clientName}>{order.client_name || 'Client'}</p>
          <div style={styles.clientDetails}>
            {/* Add more client details if available */}
          </div>
        </div>

      {/* Items Table */}
      <div style={{ marginLeft: '10mm', marginRight: '10mm', width: 'calc(100% - 20mm)', overflowX: 'visible' }}>
      <table style={styles.table}>
        <colgroup>
          <col style={{ width: settings.itemDisplayFormat === 'separate' ? '30%' : '40%' }} />
          {settings.itemDisplayFormat === 'separate' && settings.showItemCategory && (
            <col style={{ width: '15%' }} />
          )}
          {settings.itemDisplayFormat === 'separate' && settings.showItemSize && (
            <col style={{ width: '15%' }} />
          )}
          <col style={{ width: '10%' }} />
          <col style={{ width: '15%' }} />
          <col style={{ width: '15%' }} />
        </colgroup>
        <thead>
          <tr>
            <th style={styles.tableHeader}>Item</th>
            {settings.itemDisplayFormat === 'separate' && settings.showItemCategory && (
              <th style={styles.tableHeader}>Category</th>
            )}
            {settings.itemDisplayFormat === 'separate' && settings.showItemSize && (
              <th style={styles.tableHeader}>Size</th>
            )}
            <th style={styles.tableHeader}>Quantity</th>
            <th style={styles.tableHeaderRight}>Unit Price</th>
            <th style={styles.tableHeaderRight}>Total</th>
          </tr>
        </thead>
        <tbody>
          {order.items?.map((item, index) => (
            <tr key={item.id} style={index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd}>
              <td style={{...styles.tableCell, whiteSpace: 'normal', lineHeight: '1.3', height: 'auto', minHeight: '7mm', wordBreak: 'break-word' as const, fontSize: '8pt'}}>
                {settings.itemDisplayFormat === 'combined'
                  ? formatItemName(item, settings)
                  : (settings.showItemName ? item.item_name : '')}
              </td>
              {settings.itemDisplayFormat === 'separate' && settings.showItemCategory && (
                <td style={styles.tableCell}>{item.category_name}</td>
              )}
              {settings.itemDisplayFormat === 'separate' && settings.showItemSize && (
                <td style={styles.tableCell}>{item.size}</td>
              )}
              <td style={styles.tableCell}>{item.quantity}</td>
              <td style={styles.tableCellRight}>{formatCurrency(item.unit_price)}</td>
              <td style={styles.tableCellRight}>{formatCurrency(item.total_amount)}</td>
            </tr>
          ))}

          {/* Add empty rows to ensure consistent appearance - always show 8 rows total */}
          {Array.from({ length: Math.max(0, 8 - (order.items?.length || 0)) }).map((_, index) => (
            <tr key={`empty-${index}`} style={(order.items?.length || 0) + index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd}>
              <td style={styles.tableCell}>&nbsp;</td>
              {settings.itemDisplayFormat === 'separate' && settings.showItemCategory && (
                <td style={styles.tableCell}>&nbsp;</td>
              )}
              {settings.itemDisplayFormat === 'separate' && settings.showItemSize && (
                <td style={styles.tableCell}>&nbsp;</td>
              )}
              <td style={styles.tableCell}>&nbsp;</td>
              <td style={styles.tableCellRight}>&nbsp;</td>
              <td style={styles.tableCellRight}>&nbsp;</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      {/* Summary Section */}
      <div style={styles.summary}>
        <div style={styles.summaryItem}>
          <span>Subtotal:</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        {settings.includeTax && (
          <div style={styles.summaryItem}>
            <span>Tax ({settings.taxRate}%):</span>
            <span>{formatCurrency(tax)}</span>
          </div>
        )}
        {settings.includeDiscount && (
          <div style={styles.summaryItem}>
            <span>Discount ({settings.discountRate}%):</span>
            <span>-{formatCurrency(discount)}</span>
          </div>
        )}
        <div style={styles.summaryTotal}>
          <span>Total:</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>

      {/* Payment Information and Notes - Side by Side */}
      <div style={styles.paymentAndNotesContainer}>
        {/* Payment Information */}
        <div style={styles.paymentInfo}>
          <h3 style={styles.sectionTitle}>Payment Details</h3>
          <div style={styles.paymentMethodsContainer}>
            {settings.bankDetails?.map(bank => (
              <div key={bank.id} style={styles.paymentMethod}>
                <p style={{ margin: '0', fontWeight: 'bold', fontSize: '9pt' }}>{bank.bankName}</p>
                <p style={{ margin: '0', fontSize: '8.5pt' }}>Account: {bank.accountName}</p>
                <p style={{ margin: '0', fontSize: '8.5pt' }}>Number: {bank.accountNumber}</p>
              </div>
            ))}

            {settings.mobileMoneyDetails?.map(mobile => (
              <div key={mobile.id} style={styles.paymentMethod}>
                <p style={{ margin: '0', fontWeight: 'bold', fontSize: '9pt' }}>{mobile.provider}</p>
                <p style={{ margin: '0', fontSize: '8.5pt' }}>Contact: {mobile.contactName}</p>
                <p style={{ margin: '0', fontSize: '8.5pt' }}>Number: {mobile.phoneNumber}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Notes Section */}
        {settings.notes && (
          <div style={styles.notes}>
            <h3 style={{...styles.sectionTitle, fontSize: '9.5pt', margin: '0 0 2mm 0'}}>Notes</h3>
            <p style={{ margin: '0', fontSize: '8.5pt', lineHeight: '1.5' }}>{settings.notes}</p>
          </div>
        )}
      </div>
      </div>

      {/* Spacer to push footer to bottom if content is short */}
      <div style={{ flexGrow: 1, minHeight: '10mm' }}></div>

      {/* Divider */}
      <div style={{
        borderTop: '2px solid #F97316',
        margin: '0 10mm',
        marginTop: '8mm',
        marginBottom: '8mm',
        opacity: 0.3
      }}></div>

      {/* Footer */}
      {settings.showFooter && (
        <div style={styles.footer}>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '95%', margin: '0 auto', alignItems: 'center' }}>
            <div style={{ textAlign: 'left' as const }}>
              <p style={{ margin: '0', fontWeight: 'bold', fontSize: '9pt' }}>
                {settings.companyName}
              </p>
              {settings.companyPhone && (
                <p style={{ margin: '1mm 0 0 0', fontSize: '7.5pt', opacity: '0.9' }}>
                  Tel: {settings.companyPhone}
                </p>
              )}
            </div>

            <div style={{ textAlign: 'center' as const }}>
              <p style={{ margin: '0', fontWeight: 'bold', fontSize: '9pt' }}>
                {settings.customFooter || `Thank you for your business`}
              </p>
              <p style={{ margin: '1mm 0 0 0', fontSize: '7.5pt', opacity: '0.9' }}>
                © {new Date().getFullYear()} | All Rights Reserved
              </p>
            </div>

            <div style={{ textAlign: 'right' as const }}>
              {settings.companyEmail && (
                <p style={{ margin: '0', fontSize: '7.5pt', opacity: '0.9' }}>
                  Email: {settings.companyEmail}
                </p>
              )}
              {settings.companyAddress && (
                <p style={{ margin: '1mm 0 0 0', fontSize: '7.5pt', opacity: '0.9' }}>
                  {settings.companyAddress}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfessionalTemplate;
