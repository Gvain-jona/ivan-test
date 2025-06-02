import React from 'react';
import { Order, OrderItem } from '@/types/orders';
import { SimplifiedInvoiceSettings } from './types';

interface OrangeInvoiceTemplateProps {
  order: Order | null;
  settings: SimplifiedInvoiceSettings;
  customDate?: Date;
}

/**
 * Friendly invoice template matching the exact improved design layout
 * Uses inline styles for reliable PDF generation with WYSIWYG output
 */
const OrangeInvoiceTemplate: React.FC<OrangeInvoiceTemplateProps> = ({
  order,
  settings,
  customDate,
}) => {
  // Logo size configurations
  const logoSizes = {
    small: { width: '60px', height: '60px', fontSize: '14px' },
    medium: { width: '80px', height: '80px', fontSize: '16px' },
    large: { width: '100px', height: '100px', fontSize: '18px' }
  };
  
  const currentLogoSize = logoSizes[settings.logoSize || 'medium'];
  
  // Dynamic font sizing function to prevent text wrapping
  const getDynamicFontSize = (text: string, baseSize: number, maxWidth: number) => {
    if (!text) return baseSize;
    
    // More accurate character width calculation
    // Average character widths vary by font size and weight
    const avgCharWidth = baseSize * 0.55; // Adjusted for bold font
    const textPixelWidth = text.length * avgCharWidth;
    
    // Add some buffer for letter spacing
    const bufferMultiplier = 1.1;
    const estimatedWidth = textPixelWidth * bufferMultiplier;
    
    if (estimatedWidth > maxWidth) {
      // Calculate the scale factor needed to fit
      const scaleFactor = maxWidth / estimatedWidth;
      // Apply minimum font size constraint
      const newSize = Math.floor(baseSize * scaleFactor);
      return Math.max(newSize, 14); // Minimum 14px for readability
    }
    
    return baseSize;
  };
  
  // Calculate available width for header text
  // Total width (900px) - logo width - padding/margins (~100px)
  const logoWidth = parseInt(currentLogoSize.width) || 80;
  const paddingAndMargins = 100;
  const headerMaxWidth = 900 - logoWidth - paddingAndMargins;
  
  // Calculate font sizes for header elements
  const companyNameFontSize = getDynamicFontSize(settings.companyName, 28, headerMaxWidth);
  const taglineFontSize = getDynamicFontSize(settings.tagline, 14, headerMaxWidth * 0.9); // Slightly smaller for tagline
  
  if (!order) {
    return <div style={{ textAlign: 'center', padding: '32px' }}>No order data available</div>;
  }

  // Enhanced color palette matching the ideation component exactly
  const styles = {
    primaryGreen: '#0a3b22',
    primaryOrange: '#f9bc86',
    footerOrange: '#f78c2a',
    accentRed: '#d13c28',
    purple: '#2d2570',
    tableGray: '#f4f4f4',
    tableRowGray: '#ffffff',
    tableBorder: '#e0e0e0',
    tableBorderLight: '#f0f0f0'
  };

  // Convert order amount to words 
  const numberToWords = (amount: number): string => {
    if (amount === 0) return 'ZERO SHILLINGS ONLY';
    
    const units = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE'];
    const teens = ['TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'];
    const tens = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];
    
    const convertChunk = (num: number): string => {
      let result = '';
      const hundreds = Math.floor(num / 100);
      const remainder = num % 100;
      
      if (hundreds > 0) {
        result += units[hundreds] + ' HUNDRED ';
      }
      
      if (remainder >= 10 && remainder < 20) {
        result += teens[remainder - 10] + ' ';
      } else {
        const tensDigit = Math.floor(remainder / 10);
        const unitsDigit = remainder % 10;
        
        if (tensDigit > 0) {
          result += tens[tensDigit] + ' ';
        }
        if (unitsDigit > 0) {
          result += units[unitsDigit] + ' ';
        }
      }
      
      return result.trim();
    };
    
    const millions = Math.floor(amount / 1000000);
    const thousands = Math.floor((amount % 1000000) / 1000);
    const hundreds = amount % 1000;
    
    let words = '';
    
    if (millions > 0) {
      words += convertChunk(millions) + ' MILLION ';
    }
    
    if (thousands > 0) {
      words += convertChunk(thousands) + ' THOUSAND ';
    }
    
    if (hundreds > 0) {
      words += convertChunk(hundreds) + ' ';
    }
    
    return words.trim() + ' SHILLINGS ONLY';
  };

  return (
    <div 
      style={{ maxWidth: '900px', margin: '0 auto', backgroundColor: 'white', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', borderRadius: '4px', overflow: 'hidden' }}
      data-pdf-container="true"
    >
      {/* Header - Clean and minimal inspired by the reference */}
      <div style={{ padding: '32px', backgroundColor: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', borderBottom: '1px solid #e5e7eb', paddingBottom: '24px', marginBottom: '24px' }}>
          {/* Company Logo and Name - Left aligned */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {settings.companyLogo ? (
              // Dynamic logo with zoom and pan controls
              <div style={{
                width: currentLogoSize.width,
                height: currentLogoSize.height,
                marginRight: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                borderRadius: '8px',
                border: settings.logoShowBorder ? `2px solid ${styles.primaryGreen}` : 'none',
                padding: settings.logoShowBorder ? '0' : '4px',
                position: 'relative'
              }}>
                <img 
                  src={settings.companyLogo} 
                  alt={settings.companyName}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    width: 'auto',
                    height: 'auto',
                    objectFit: 'contain',
                    transform: `scale(${settings.logoZoom || 1})`,
                    transformOrigin: 'center',
                    position: 'relative'
                  }}
                />
              </div>
            ) : (
              // Default static logo design
              <div style={{
                width: currentLogoSize.width,
                height: currentLogoSize.height,
                borderRadius: '50%',
                backgroundColor: styles.primaryGreen,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
                marginRight: '16px',
                border: `2px solid ${styles.primaryGreen}`
              }}>
                <div style={{ color: 'white', textAlign: 'center' }}>
                  <div style={{ fontWeight: 'bold', fontStyle: 'italic', fontSize: currentLogoSize.fontSize }}>Ivan</div>
                  <div style={{ fontWeight: 'bold', fontStyle: 'italic', fontSize: currentLogoSize.fontSize }}>Prints</div>
                  <div style={{ fontSize: '7px', fontStyle: 'italic', marginTop: '2px' }}>MAKING YOU VISIBLE</div>
                </div>
              </div>
            )}
            <div style={{ 
              flex: 1, 
              overflow: 'hidden',
              maxWidth: `${headerMaxWidth}px`
            }}>
              <h1 style={{ 
                fontSize: `${companyNameFontSize}px`, 
                fontWeight: '800', 
                color: styles.primaryGreen, 
                margin: 0, 
                letterSpacing: '0.5px', 
                lineHeight: '1',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                transition: 'font-size 0.2s ease'
              }}>{settings.companyName}</h1>
              <p style={{ 
                fontSize: `${taglineFontSize}px`, 
                color: '#6b7280', 
                margin: '2px 0 0 0', 
                letterSpacing: '0.3px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                transition: 'font-size 0.2s ease'
              }}>{settings.tagline}</p>
            </div>
          </div>
          
        </div>
        
        {/* Invoice Details Grid - 2x2 layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: '24px', rowGap: '16px', marginTop: '20px' }}>
          {/* Invoice Number */}
          <div>
            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Invoice Number</p>
            <p style={{ fontSize: '16px', fontWeight: '500', margin: 0, color: '#000000' }}>
              INV {order.order_number || order.id.substring(0, 3).toUpperCase()}
            </p>
          </div>
          
          {/* Date */}
          <div>
            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Date</p>
            <p style={{ fontSize: '16px', fontWeight: '500', margin: 0, color: '#000000' }}>
              {customDate ? customDate.toLocaleDateString('en-GB').replace(/\//g, '-') : (order.created_at ? new Date(order.created_at).toLocaleDateString('en-GB').replace(/\//g, '-') : new Date().toLocaleDateString('en-GB').replace(/\//g, '-'))}
            </p>
          </div>
          
          {/* Tel */}
          <div>
            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Tel</p>
            <p style={{ fontSize: '16px', fontWeight: '500', margin: 0, color: '#000000' }}>{settings.phone}</p>
          </div>
          
          {/* Email */}
          <div>
            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Email</p>
            <p style={{ fontSize: '16px', fontWeight: '500', margin: 0, color: '#000000' }}>{settings.email}</p>
          </div>
          
          {/* TIN */}
          <div>
            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>TIN</p>
            <p style={{ fontSize: '16px', fontWeight: '500', margin: 0, color: '#000000' }}>{settings.tin}</p>
          </div>
        </div>
      </div>

      {/* Green Divider - Simple solid color instead of gradient */}
      <div style={{ height: '8px', backgroundColor: styles.primaryGreen }}></div>

      {/* Client Info - More compact design */}
      <div style={{
        padding: '12px 20px',
        borderLeft: `4px solid ${styles.accentRed}`,
        backgroundColor: styles.primaryOrange
      }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <p style={{ fontSize: '14px', marginBottom: '2px', color: '#6b7280' }}>
            Bill To:
          </p>
          <p style={{ fontSize: '18px', fontWeight: 'bold', color: styles.accentRed, margin: 0 }}>
            {order.client_name}
          </p>
        </div>
      </div>

      {/* Invoice Items Section - Fixed table to match description data with column */}
      <div style={{ display: 'flex' }}>
        {/* Green Left Bar - Solid color */}
        <div style={{ backgroundColor: styles.primaryGreen, width: '12px', flexShrink: 0 }}></div>
        
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px' }}>
          {/* Invoice Table Header - Improved alignment */}
          <div style={{ width: '100%', borderRadius: '6px 6px 0 0', overflow: 'hidden' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '8.33% 58.33% 16.67% 16.67%',
              padding: '10px 0',
              fontWeight: 'bold',
              color: 'white',
              backgroundColor: styles.primaryGreen
            }}>
              <div style={{ padding: '0 8px', fontSize: '14px', textAlign: 'center' }}>QTY</div>
              <div style={{ padding: '0 8px', fontSize: '14px', textAlign: 'left' }}>DESCRIPTION</div>
              <div style={{ padding: '0 8px', fontSize: '14px', textAlign: 'right' }}>UNIT PRICE</div>
              <div style={{ padding: '0 8px', fontSize: '14px', textAlign: 'right' }}>AMOUNT</div>
            </div>

            {/* Invoice Items - Fixed alignment to match column headers */}
            {order.items?.map((item) => (
              <div key={item.id} style={{
                display: 'grid',
                gridTemplateColumns: '8.33% 58.33% 16.67% 16.67%',
                borderBottom: `1px solid ${styles.tableBorderLight}`
              }}>
                <div style={{ padding: '10px 8px', fontSize: '14px', textAlign: 'center', color: '#000000' }}>{item.quantity}PCS</div>
                <div style={{ padding: '10px 8px', fontSize: '14px', textAlign: 'left', color: '#000000' }}>
                  {item.item_name}{item.size && ` (${item.size})`}
                </div>
                <div style={{ padding: '10px 8px', fontSize: '14px', textAlign: 'right', color: '#000000' }}>{item.unit_price.toLocaleString()}</div>
                <div style={{ padding: '10px 8px', fontSize: '14px', fontWeight: '500', textAlign: 'right', color: styles.accentRed }}>
                  {item.total_amount.toLocaleString()}
                </div>
              </div>
            ))}

            {/* Empty rows - 8 rows for more possible additions with fixed alignment */}
            <div style={{ border: `1px solid ${styles.tableBorder}`, borderRadius: '4px', marginTop: '8px', overflow: 'hidden' }}>
              {Array.from({ length: 8 - (order.items?.length || 0) }).map((_, index) => (
                <div key={`empty-${index}`} style={{
                  display: 'grid',
                  gridTemplateColumns: '8.33% 58.33% 16.67% 16.67%',
                  borderBottom: index === (8 - (order.items?.length || 0) - 1) ? 'none' : `1px solid ${styles.tableBorderLight}`
                }}>
                  <div style={{ padding: '10px 8px', color: '#000000' }}>&nbsp;</div>
                  <div style={{ padding: '10px 8px', color: '#000000' }}>&nbsp;</div>
                  <div style={{ padding: '10px 8px', color: '#000000' }}>&nbsp;</div>
                  <div style={{ padding: '10px 8px', color: '#000000' }}>&nbsp;</div>
                </div>
              ))}
            </div>
          </div>

          {/* Grand Total Section - Improved alignment */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
            <div style={{ width: '33.33%', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ backgroundColor: '#f3f4f6', padding: '12px', borderBottom: `1px solid ${styles.tableBorder}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: '500', fontSize: '14px' }}>Subtotal:</span>
                  <span style={{ fontSize: '14px', textAlign: 'right' }}>{order.total_amount.toLocaleString()}/=</span>
                </div>
              </div>
              <div style={{ padding: '12px', color: 'white', backgroundColor: styles.primaryGreen }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '14px' }}>TOTAL:</span>
                  <span style={{ fontWeight: 'bold', fontSize: '16px', textAlign: 'right' }}>{order.total_amount.toLocaleString()}/=</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Amount in words - Improved spacing */}
      <div style={{ padding: '16px 24px', backgroundColor: '#f9fafb' }}>
        <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Amount in words:</p>
        <p style={{ color: styles.purple, fontWeight: 'bold', fontSize: '16px', margin: 0 }}>{numberToWords(order.total_amount)}</p>
      </div>

      {/* Payment Details - Restructured with single row for bank details */}
      <div style={{ padding: '20px 24px' }}>
        <div style={{ border: `1px solid ${styles.tableBorder}`, borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ padding: '8px', backgroundColor: styles.primaryGreen, color: 'white' }}>
            <p style={{ fontWeight: 'bold', fontSize: '12px', margin: 0 }}>PAYMENT INFORMATION</p>
          </div>
          
          <div style={{ padding: '12px' }}>
            {/* Bank Details - Multiple accounts supported */}
            <div style={{ border: `1px solid ${styles.tableBorder}`, borderRadius: '4px', marginBottom: '12px' }}>
              <table style={{ width: '100%', fontSize: '12px' }}>
                <thead style={{ backgroundColor: '#f3f4f6' }}>
                  <tr>
                    <th style={{ padding: '8px', textAlign: 'left', fontWeight: '500', color: '#6b7280' }}>Account Name</th>
                    <th style={{ padding: '8px', textAlign: 'left', fontWeight: '500', color: '#6b7280' }}>Bank Name</th>
                    <th style={{ padding: '8px', textAlign: 'left', fontWeight: '500', color: '#6b7280' }}>Account Number</th>
                  </tr>
                </thead>
                <tbody>
                  {settings.bankDetails.map((bank, index) => (
                    <tr key={index} style={{ borderTop: index > 0 ? '1px solid #e5e7eb' : 'none' }}>
                      <td style={{ padding: '8px', fontWeight: 'bold', color: styles.purple }}>
                        {bank.accountName}
                      </td>
                      <td style={{ padding: '8px', fontWeight: 'bold', color: styles.purple }}>
                        {bank.bankName}
                      </td>
                      <td style={{ padding: '8px', fontWeight: 'bold', color: styles.purple }}>
                        {bank.accountNumber}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Mobile Money - Multiple accounts supported */}
            <div style={{ border: `1px solid ${styles.tableBorder}`, borderRadius: '4px', padding: '8px' }}>
              <p style={{ fontSize: '12px', fontWeight: '500', color: '#6b7280', marginBottom: '8px' }}>Mobile Money</p>
              {settings.mobileMoneyDetails.map((mobile, index) => (
                <div key={index} style={{ marginBottom: index < settings.mobileMoneyDetails.length - 1 ? '6px' : '0' }}>
                  <p style={{ fontSize: '12px', fontWeight: 'bold', color: styles.purple, margin: 0 }}>
                    {mobile.provider}: {mobile.phone}
                  </p>
                  <p style={{ fontSize: '11px', color: '#6b7280', margin: '2px 0 0 0' }}>
                    Account Name: {mobile.name}
                  </p>
                </div>
              ))}
            </div>
            
            {/* Space for additional payment methods */}
            <div style={{ marginTop: '12px', height: '24px' }}>
              {/* Reserved space for additional payment methods */}
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Authorized Signature</p>
            <div style={{
              borderBottom: `1px solid ${styles.tableBorder}`,
              width: '112px',
              height: '48px',
              marginTop: '4px',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              paddingBottom: '4px'
            }}>
              <p style={{ fontSize: '12px', color: '#6b7280' }}>FOR IVAN PRINTS</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer - Solid color without gradient */}
      <div style={{ padding: '16px', textAlign: 'center', color: 'white', backgroundColor: styles.footerOrange }}>
        <p style={{ fontSize: '20px', fontWeight: '300', fontStyle: 'italic', marginBottom: '4px' }}>Making You Visible</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', fontSize: '12px' }}>
          <span>{settings.phone}</span>
          <span>|</span>
          <span>{settings.email}</span>
        </div>
      </div>
    </div>
  );
};

export default OrangeInvoiceTemplate;