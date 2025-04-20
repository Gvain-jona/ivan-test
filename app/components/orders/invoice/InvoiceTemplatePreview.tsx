import React, { useState } from 'react';
import { Order, OrderItem } from '@/types/orders';
import { InvoiceSettings } from './types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Building2, Phone, Mail, Calendar, FileText } from 'lucide-react';

// Component to handle logo image with error fallback
const LogoImage = ({ src, fallback }: { src: string, fallback: React.ReactNode }) => {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [attemptedLoad, setAttemptedLoad] = useState(false);

  // Check if we've already tried to load this image in this session
  React.useEffect(() => {
    // Use sessionStorage to track failed image loads
    const failedImages = JSON.parse(sessionStorage.getItem('failedImages') || '{}');

    if (failedImages[src]) {
      // We've already tried to load this image and it failed
      console.log('Skipping known failed image:', src);
      setError(true);
    } else {
      // Mark that we're attempting to load this image
      setAttemptedLoad(true);
    }
  }, [src]);

  // If there was an error loading the image, show the fallback
  if (error) {
    return <>{fallback}</>;
  }

  // If we haven't attempted to load yet, don't render anything
  if (!attemptedLoad) {
    return <>{fallback}</>;
  }

  return (
    <div className="w-12 h-12 relative">
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      <Image
        src={src}
        alt="Company Logo"
        fill
        style={{ objectFit: 'contain' }}
        onError={() => {
          console.log('Logo image failed to load:', src);
          // Store this failed image in sessionStorage to avoid future attempts
          try {
            const failedImages = JSON.parse(sessionStorage.getItem('failedImages') || '{}');
            failedImages[src] = true;
            sessionStorage.setItem('failedImages', JSON.stringify(failedImages));
          } catch (e) {
            console.error('Error storing failed image in sessionStorage:', e);
          }
          setError(true);
        }}
        onLoad={() => setLoaded(true)}
        className={loaded ? 'opacity-100' : 'opacity-0'}
      />
    </div>
  );
};

interface InvoiceTemplatePreviewProps {
  order: Order | null;
  settings: InvoiceSettings;
}

/**
 * A lightweight HTML-based invoice preview component
 * This renders much faster than generating a PDF for preview
 */
const InvoiceTemplatePreview: React.FC<InvoiceTemplatePreviewProps> = ({
  order,
  settings,
}) => {
  if (!order) {
    return <div className="text-center p-8">No order data available</div>;
  }

  // Format currency
  const formatCurrencyValue = (amount: number) => {
    return formatCurrency(amount);
  };

  // Calculate totals
  const subtotal = order.total_amount || 0;
  const taxRate = 0; // No tax for now
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  return (
    <div className="invoice-template p-0 m-0 bg-white">
      {/* Top Header with Logo, Company Info, and Invoice Title - Compact design */}
      <div className="relative bg-gradient-to-r from-orange-600 to-orange-400 text-white pt-4 pb-3 px-0 mb-0">
        {/* Content */}
        <div className="relative px-6 flex justify-between items-center">
          {/* Company Info */}
          <div className="text-white">
            <h1 className="text-xl font-bold">{settings.companyName || 'IVAN PRINTS'}</h1>
            <p className="text-xs opacity-90">{settings.customHeader || 'PRINTING | DESIGNING | BRANDING'}</p>

            <div className="mt-2 space-y-0.5">
              <div className="flex items-center text-xs">
                <Mail className="h-3 w-3 mr-1 opacity-80" />
                <span>{settings.companyEmail || 'sherilex256@gmail.com'}</span>
              </div>
              <div className="flex items-center text-xs">
                <Phone className="h-3 w-3 mr-1 opacity-80" />
                <span>{settings.companyPhone || '0755 541 373'}</span>
              </div>
              <div className="flex items-center text-xs">
                <Building2 className="h-3 w-3 mr-1 opacity-80" />
                <span>TIN: {settings.tinNumber || '1028570150'}</span>
              </div>
            </div>
          </div>

          {/* Logo and Invoice Title */}
          <div className="flex flex-col items-end">
            {/* Logo Placeholder - Replace with actual logo */}
            <div className="bg-white rounded-md p-2 shadow-sm mb-2">
              {settings.companyLogo ? (
                <LogoImage
                  src={settings.companyLogo}
                  fallback={
                    <div className="w-12 h-12 flex items-center justify-center text-orange-500 font-bold text-base">
                      LOGO
                    </div>
                  }
                />
              ) : (
                <div className="w-12 h-12 flex items-center justify-center text-orange-500 font-bold text-base">
                  LOGO
                </div>
              )}
            </div>

            {/* Invoice Title and Number */}
            <div className="text-right">
              <h2 className="text-base font-bold text-white flex items-center justify-end">
                <FileText className="h-3 w-3 mr-1 opacity-90" />
                INVOICE
              </h2>
              <p className="text-white text-xs opacity-90">Invoice Number: <span className="font-bold">{order.order_number || `ORD-${order.id.substring(0, 8).toUpperCase()}`}</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* Client Info with Date - Compact design */}
      <div className="px-6 py-2 bg-gray-50">
        <div className="flex justify-between items-start">
          {/* Bill To Section */}
          <div className="bg-white p-2 rounded-md shadow-sm border border-gray-100 flex-1 mr-3">
            <h3 className="font-medium text-gray-700 text-xs mb-1 flex items-center">
              <Building2 className="h-3 w-3 mr-1 text-orange-500" />
              BILL TO
            </h3>
            <div className="text-gray-800 font-medium text-sm">{order.client_name || 'N/A'}</div>
          </div>

          {/* Date Section */}
          <div className="bg-white p-2 rounded-md shadow-sm border border-gray-100 w-48">
            <h3 className="font-medium text-gray-700 text-xs mb-1 flex items-center">
              <Calendar className="h-3 w-3 mr-1 text-orange-500" />
              DATE
            </h3>
            <div className="text-gray-800 text-sm">{formatDate(new Date().toISOString())}</div>
          </div>
        </div>
      </div>

      {/* Line Items - Optimized table design for up to 12 items */}
      <div className="px-6 py-2 bg-white">
        <h3 className="font-medium text-gray-700 text-xs mb-2">ORDER ITEMS</h3>
        <div className="overflow-hidden rounded-md border border-gray-200 shadow-sm">
          <table className="w-full border-collapse" style={{ tableLayout: 'fixed', minWidth: '500px' }}>
            <thead>
              <tr className="bg-gradient-to-r from-orange-600 to-orange-400 text-white">
                <th className="text-left p-1.5 font-medium text-xs" style={{ width: '40%' }}>Item</th>
                <th className="text-center p-1.5 font-medium text-xs" style={{ width: '15%' }}>Quantity</th>
                <th className="text-right p-1.5 font-medium text-xs" style={{ width: '20%' }}>Price</th>
                <th className="text-right p-1.5 font-medium text-xs" style={{ width: '25%' }}>Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {order.items?.map((item: OrderItem, index: number) => {
                // Format the item display based on settings
                let itemDisplay = '';

                if (settings.itemDisplayFormat === 'combined') {
                  // Combined format
                  const parts = [];
                  if (settings.showItemCategory && item.category_name) parts.push(item.category_name);
                  if (settings.showItemName && item.item_name) parts.push(item.item_name);
                  itemDisplay = parts.join(' - ');
                  if (settings.showItemSize && item.size) itemDisplay += ` (${item.size})`;
                } else {
                  // Default to item name if nothing is selected
                  itemDisplay = settings.showItemName ? item.item_name : 'Item';
                }

                return (
                  <tr key={item.id} className={cn(index % 2 === 0 ? 'bg-white' : 'bg-gray-50')}>
                    <td className="p-1.5 text-gray-800 text-xs">
                      <div className="truncate">{itemDisplay}</div>
                    </td>
                    <td className="p-1.5 text-center text-gray-800 text-xs">{item.quantity}</td>
                    <td className="p-1.5 text-right text-gray-800 text-xs">{formatCurrencyValue(item.unit_price)}</td>
                    <td className="p-1.5 text-right font-medium text-gray-800 text-xs">{formatCurrencyValue(item.total_amount)}</td>
                  </tr>
                );
              })}

              {/* If there are fewer than 12 items, add empty rows to maintain consistent spacing */}
              {order.items && order.items.length < 12 && Array.from({ length: 12 - order.items.length }).map((_, index) => (
                <tr key={`empty-${index}`} className={cn((order.items?.length || 0) + index % 2 === 0 ? 'bg-white' : 'bg-gray-50')}>
                  <td className="p-1.5 text-xs">&nbsp;</td>
                  <td className="p-1.5 text-xs">&nbsp;</td>
                  <td className="p-1.5 text-xs">&nbsp;</td>
                  <td className="p-1.5 text-xs">&nbsp;</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Totals - Compact design with configurable tax/discount */}
      <div className="px-6 py-2 bg-gray-50 flex justify-end">
        <div className="w-full md:w-2/5 bg-white rounded-md border border-gray-200 overflow-hidden shadow-sm" style={{ minWidth: '200px' }}>
          <div className="p-2 border-b border-gray-200 flex justify-between">
            <span className="text-gray-600 text-xs">Subtotal:</span>
            <span className="font-medium text-xs">{formatCurrencyValue(subtotal)}</span>
          </div>

          {/* Tax - Configurable */}
          {settings.includeTax !== false && (
            <div className="p-2 border-b border-gray-200 flex justify-between">
              <span className="text-gray-600 text-xs">Tax ({settings.taxRate || 0}%):</span>
              <span className="font-medium text-xs">{formatCurrencyValue(taxAmount)}</span>
            </div>
          )}

          {/* Discount - Configurable */}
          {settings.includeDiscount && (
            <div className="p-2 border-b border-gray-200 flex justify-between">
              <span className="text-gray-600 text-xs">Discount ({settings.discountRate || 0}%):</span>
              <span className="font-medium text-red-600 text-xs">-{formatCurrencyValue((subtotal * (settings.discountRate || 0)) / 100)}</span>
            </div>
          )}

          <div className="p-2 bg-orange-50 flex justify-between">
            <span className="font-semibold text-gray-800 text-xs">Total:</span>
            <span className="font-bold text-orange-600 text-xs">
              {formatCurrencyValue(
                subtotal +
                (settings.includeTax !== false ? taxAmount : 0) -
                (settings.includeDiscount ? (subtotal * (settings.discountRate || 0)) / 100 : 0)
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Spacer to push notes and payment details to the bottom */}
      <div className="flex-grow"></div>

      {/* Notes and Payment Details - Side by Side at the bottom */}
      <div className="px-6 py-2 bg-white border-t border-gray-200 mt-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Notes Section */}
          <div>
            <h3 className="font-medium text-gray-700 text-xs mb-1">NOTES</h3>
            <div className="bg-gray-50 p-2 rounded-md border border-gray-200 shadow-sm" style={{ minHeight: '80px' }}>
              {settings.notes ? (
                <p className="text-gray-600 text-xs">{settings.notes}</p>
              ) : (
                <p className="text-gray-400 text-xs italic">No notes provided</p>
              )}
            </div>
          </div>

          {/* Payment Details - With compact layout and space for more details */}
          <div>
            <h3 className="font-medium text-gray-700 text-xs mb-1">PAYMENT DETAILS</h3>
            <div className="bg-gray-50 p-2 rounded-md border border-gray-200 shadow-sm" style={{ minHeight: '80px' }}>
              {/* Bank Details */}
              {settings.bankDetails && settings.bankDetails.length > 0 ? (
                <div>
                  <h4 className="font-medium text-gray-700 text-xs mb-1 flex items-center">
                    <Building2 className="h-3 w-3 mr-1 text-orange-500" />
                    Bank Details
                  </h4>
                  <div className="mb-1">
                    {settings.bankDetails.map((bank) => (
                      <div key={bank.id} className="border-b border-gray-100 pb-1 last:border-0 last:pb-0">
                        <div className="grid grid-cols-2 gap-1 text-xs text-gray-600">
                          <p><span className="text-gray-500">Account:</span> {bank.accountName}</p>
                          <p><span className="text-gray-500">Bank:</span> {bank.bankName}</p>
                          <p><span className="text-gray-500">Number:</span> {bank.accountNumber}</p>
                        </div>
                      </div>
                    ))}
                    {/* No placeholder text for additional bank details */}
                  </div>
                </div>
              ) : null}

              {/* Mobile Money */}
              {settings.mobileMoneyDetails && settings.mobileMoneyDetails.length > 0 ? (
                <div>
                  <h4 className="font-medium text-gray-700 text-xs mb-1 flex items-center">
                    <Phone className="h-3 w-3 mr-1 text-orange-500" />
                    Mobile Money
                  </h4>
                  <div>
                    {settings.mobileMoneyDetails.map((mobile) => (
                      <div key={mobile.id} className="border-b border-gray-100 pb-1 last:border-0 last:pb-0">
                        <div className="grid grid-cols-2 gap-1 text-xs text-gray-600">
                          <p><span className="text-gray-500">Provider:</span> {mobile.provider}</p>
                          <p><span className="text-gray-500">Phone:</span> {mobile.phoneNumber}</p>
                          <p><span className="text-gray-500">Contact:</span> {mobile.contactName}</p>
                        </div>
                      </div>
                    ))}
                    {/* No placeholder text for additional mobile money details */}
                  </div>
                </div>
              ) : null}

              {(!settings.bankDetails || settings.bankDetails.length === 0) &&
               (!settings.mobileMoneyDetails || settings.mobileMoneyDetails.length === 0) && (
                <p className="text-gray-400 text-xs italic">No payment details provided</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer - Compact design */}
      <div>
        {settings.includeFooter && (
          <div className="bg-gradient-to-r from-orange-600 to-orange-400 text-white py-2 px-6 relative overflow-hidden">
            <div className="text-center relative z-10">
              <p className="font-bold tracking-wide text-xs">
                {settings.customFooter || 'M A K I N G   Y O U   V I S I B L E'}
              </p>
              <p className="text-xs opacity-80">Thank you for your business!</p>
            </div>
          </div>
        )}

        {/* Small copyright notice - Black background */}
        <div className="bg-black text-white py-1 px-6 text-center">
          <p className="copyright-text text-xs">© {new Date().getFullYear()} {settings.companyName || 'IVAN PRINTS'}. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default InvoiceTemplatePreview;
