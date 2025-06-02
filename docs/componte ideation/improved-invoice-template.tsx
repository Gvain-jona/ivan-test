import { useState } from 'react';

export default function InvoiceTemplate() {
  // State for invoice data
  const [invoiceData, setInvoiceData] = useState({
    companyName: "IVAN PRINTS LIMITED",
    tagline: "DESIGN.PRINT.BRAND.",
    phone: "+256(0) 755 541 373",
    email: "sheriloz356@gmail.com",
    tin: "1050884489",
    invoiceNo: "001",
    date: "22/04/2025",
    clientName: "ATS EVENTS",
    clientSubtitle: "THE AIRTEL SMART",
    items: [
      { id: 1, qty: "2PCS", description: "6X3M(vinyl)", unitPrice: "288,000", amount: "576,000" },
      { id: 2, qty: "3PCS", description: "1.8X1M(vinyl)", unitPrice: "25,000", amount: "75,000" },
      { id: 3, qty: "1PCS", description: "3.6X2.4M(sticker)", unitPrice: "138,000", amount: "138,000" },
    ],
    grandTotal: "789,000/=",
    amountInWords: "SEVEN HUNDRED NINE THOUSAND SHILLINGS ONLY",
    bankDetails: {
      accountName: "IVAN PRINTS",
      bankName: "ABSA BANK",
      accountNumber: "6008084570",
      mobileMoneyDetails: "0755 541 373 (Wadie Abduli)"
    }
  });

  // Enhanced color palette with better contrast and visual hierarchy
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

  return (
    <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-sm overflow-hidden">
      {/* Header - Clean and minimal inspired by the reference */}
      <div className="p-8 bg-white">
        <div className="flex justify-between items-start border-b pb-6 mb-6">
          {/* Company Logo and Name - Left aligned */}
          <div className="flex items-center">
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center relative overflow-hidden mr-4"
              style={{ backgroundColor: styles.primaryGreen }}
            >
              <div className="text-white text-center">
                <div className="text-white font-bold italic text-base">Ivan</div>
                <div className="text-white font-bold italic text-base">Prints</div>
                <div className="text-white text-[7px] italic mt-0.5">MAKING YOU VISIBLE</div>
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold" style={{ color: styles.primaryGreen }}>{invoiceData.companyName}</h1>
              <p className="text-xs text-gray-500">{invoiceData.tagline}</p>
            </div>
          </div>
          
          {/* Invoice Number - Right aligned */}
          <div>
            <p className="text-lg font-medium text-right">INV {invoiceData.invoiceNo}</p>
          </div>
        </div>
        
        {/* Invoice Details Grid - 2x2 layout inspired by the reference */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-6">
          {/* Left Column */}
          <div>
            <div className="mb-6">
              <p className="text-sm text-gray-500 mb-1">Due Date</p>
              <p className="text-base font-medium">{invoiceData.date}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500 mb-1">Billed To</p>
              <p className="text-base font-medium">{invoiceData.clientName}</p>
              <p className="text-base font-medium">{invoiceData.clientSubtitle}</p>
            </div>
          </div>
          
          {/* Right Column */}
          <div>
            <div className="mb-6">
              <p className="text-sm text-gray-500 mb-1">Subject</p>
              <p className="text-base font-medium">Printing Services</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500 mb-1">Contact Info</p>
              <p className="text-sm">Tel: {invoiceData.phone}</p>
              <p className="text-sm">Email: {invoiceData.email}</p>
              <p className="text-sm">TIN: {invoiceData.tin}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Green Divider - Simple solid color instead of gradient */}
      <div className="h-2" style={{ backgroundColor: styles.primaryGreen }}></div>

      {/* Client Info - More compact design */}
      <div 
        className="py-3 px-5 border-l-4"
        style={{ borderColor: styles.accentRed, backgroundColor: styles.primaryOrange }}
      >
        <div className="flex flex-col">
          <p className="text-sm mb-0.5">
            <span className="text-gray-600">Bill To:</span>
          </p>
          <p className="text-lg font-bold" style={{ color: styles.accentRed }}>
            {invoiceData.clientName}
          </p>
          <p className="text-base font-medium" style={{ color: styles.accentRed }}>
            {invoiceData.clientSubtitle}
          </p>
        </div>
      </div>

      {/* Invoice Items Section - Fixed table to match description data with column */}
      <div className="flex">
        {/* Green Left Bar - Solid color */}
        <div style={{ backgroundColor: styles.primaryGreen }} className="w-3 flex-shrink-0"></div>
        
        <div className="flex-1 flex flex-col p-4">
          {/* Invoice Table Header - Improved alignment */}
          <div className="w-full rounded-t-md overflow-hidden">
            <div 
              className="grid grid-cols-12 py-2.5 font-bold text-white" 
              style={{ backgroundColor: styles.primaryGreen }}
            >
              <div className="col-span-1 px-2 text-sm text-center">QTY</div>
              <div className="col-span-7 px-2 text-sm text-left">DESCRIPTION</div>
              <div className="col-span-2 px-2 text-sm text-right">UNIT PRICE</div>
              <div className="col-span-2 px-2 text-sm text-right">AMOUNT</div>
            </div>

            {/* Invoice Items - Fixed alignment to match column headers */}
            {invoiceData.items.map((item, index) => (
              <div 
                key={item.id} 
                className="grid grid-cols-12 border-b" 
                style={{ borderColor: styles.tableBorderLight }}
              >
                <div className="col-span-1 py-2.5 px-2 text-sm text-center">{item.qty}</div>
                <div className="col-span-7 py-2.5 px-2 text-sm text-left">{item.description}</div>
                <div className="col-span-2 py-2.5 px-2 text-sm text-right">{item.unitPrice}</div>
                <div className="col-span-2 py-2.5 px-2 text-sm font-medium text-right" style={{ color: styles.accentRed }}>
                  {item.amount}
                </div>
              </div>
            ))}

            {/* Empty rows - 8 rows for more possible additions with fixed alignment */}
            <div className="border rounded-md mt-2 overflow-hidden" style={{ borderColor: styles.tableBorder }}>
              {Array.from({ length: 8 }).map((_, index) => (
                <div 
                  key={`empty-${index}`} 
                  className="grid grid-cols-12 border-b" 
                  style={{ 
                    borderColor: styles.tableBorderLight,
                    display: index === 7 ? 'none' : 'grid'
                  }}
                >
                  <div className="col-span-1 py-2.5 px-2"></div>
                  <div className="col-span-7 py-2.5 px-2"></div>
                  <div className="col-span-2 py-2.5 px-2"></div>
                  <div className="col-span-2 py-2.5 px-2"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Grand Total Section - Improved alignment */}
          <div className="flex justify-end mt-4">
            <div className="w-1/3 rounded-md overflow-hidden">
              <div className="bg-gray-100 p-3 border-b" style={{ borderColor: styles.tableBorder }}>
                <div className="flex justify-between">
                  <span className="font-medium text-sm">Subtotal:</span>
                  <span className="text-sm text-right">{invoiceData.grandTotal}</span>
                </div>
              </div>
              <div className="p-3 text-white" style={{ backgroundColor: styles.primaryGreen }}>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sm">TOTAL:</span>
                  <span className="font-bold text-base text-right">{invoiceData.grandTotal}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Amount in words - Improved spacing */}
      <div className="py-4 px-6 bg-gray-50">
        <p className="text-sm text-gray-600 mb-1">Amount in words:</p>
        <p style={{ color: styles.purple }} className="font-bold text-base">{invoiceData.amountInWords}</p>
      </div>

      {/* Payment Details - Restructured with single row for bank details */}
      <div className="px-5 py-4">
        <div className="border rounded-md overflow-hidden" style={{ borderColor: styles.tableBorder }}>
          <div className="p-2" style={{ backgroundColor: styles.primaryGreen, color: 'white' }}>
            <p className="font-bold text-xs">PAYMENT INFORMATION</p>
          </div>
          
          <div className="p-3">
            {/* Bank Details - Single row with label-value pairs */}
            <div className="border rounded mb-3" style={{ borderColor: styles.tableBorder }}>
              <table className="w-full text-xs">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2 text-left font-medium text-gray-600">Account Name</th>
                    <th className="p-2 text-left font-medium text-gray-600">Bank Name</th>
                    <th className="p-2 text-left font-medium text-gray-600">Account Number</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-2 font-bold" style={{ color: styles.purple }}>
                      {invoiceData.bankDetails.accountName}
                    </td>
                    <td className="p-2 font-bold" style={{ color: styles.purple }}>
                      {invoiceData.bankDetails.bankName}
                    </td>
                    <td className="p-2 font-bold" style={{ color: styles.purple }}>
                      {invoiceData.bankDetails.accountNumber}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            {/* Mobile Money - Second section */}
            <div className="border rounded p-2" style={{ borderColor: styles.tableBorder }}>
              <p className="text-xs font-medium text-gray-600 mb-1">Mobile Money</p>
              <p className="text-xs font-bold" style={{ color: styles.purple }}>
                {invoiceData.bankDetails.mobileMoneyDetails}
              </p>
            </div>
            
            {/* Space for additional payment methods */}
            <div className="mt-3 h-6">
              {/* Reserved space for additional payment methods */}
            </div>
          </div>
        </div>
        
        <div className="flex justify-end mt-4">
          <div className="text-center">
            <p className="text-xs text-gray-600 mb-1">Authorized Signature</p>
            <div 
              className="border-b w-28 h-12 mt-1 flex items-end justify-center pb-1"
              style={{ borderColor: styles.tableBorder }}
            >
              <p className="text-xs text-gray-500">FOR IVAN PRINTS</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer - Solid color without gradient */}
      <div className="py-4 px-4 text-center text-white" style={{ backgroundColor: styles.footerOrange }}>
        <p className="text-xl font-light italic mb-1">Making You Visible</p>
        <div className="flex justify-center gap-3 text-xs">
          <span>{invoiceData.phone}</span>
          <span>|</span>
          <span>{invoiceData.email}</span>
        </div>
      </div>
    </div>
  );
}