import React from 'react';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { InvoicePreviewProps } from './types';
import { OrderItem } from '@/types/orders';

/**
 * Component for displaying an invoice preview
 *
 * Shows either an empty state with a generate button or a preview of the generated invoice
 */
const InvoicePreview: React.FC<InvoicePreviewProps> = ({
  order,
  invoiceUrl,
  isGenerating,
  settings,
  onGenerate,
}) => {
  // If no invoice has been generated, show the empty state
  if (!invoiceUrl) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center h-full">
        <FileText className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-xl font-medium mb-2">Invoice Preview</h3>
        <p className="text-muted-foreground mb-6 max-w-md">
          Configure your invoice settings and click the generate button to preview your invoice.
        </p>
        <Button
          onClick={onGenerate}
          className="bg-orange-500 hover:bg-orange-600 text-white min-w-[150px]"
          disabled={isGenerating}
        >
          {isGenerating ? 'Generating...' : 'Generate Invoice'}
        </Button>
      </div>
    );
  }

  // If an invoice has been generated, show the preview
  return (
    <div className="bg-white p-8 rounded-md text-gray-900 flex-1 overflow-auto">
      {/* Invoice Header */}
      <div className="border-b border-gray-200 pb-6">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-2xl font-bold">INVOICE</h2>
            <p className="text-gray-600">#{order.id.substring(0, 8)}</p>
          </div>
          <div className="text-right">
            <h3 className="font-bold">Ivan Prints</h3>
            <p className="text-sm text-gray-600">123 Print Avenue</p>
            <p className="text-sm text-gray-600">Pretoria, South Africa</p>
            <p className="text-sm text-gray-600">info@ivanprints.com</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <h4 className="text-sm font-bold uppercase text-gray-500 mb-2">Bill To:</h4>
            <p className="font-medium">{order.client_name}</p>
            <p className="text-sm text-gray-600">Client Address Line 1</p>
            <p className="text-sm text-gray-600">Client Address Line 2</p>
          </div>
          <div className="text-right">
            <h4 className="text-sm font-bold uppercase text-gray-500 mb-2">Invoice Details:</h4>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Invoice Date:</span>
                <span className="text-sm">{formatDate(new Date().toISOString())}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Order Date:</span>
                <span className="text-sm">{formatDate(order.date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Payment Terms:</span>
                <span className="text-sm">30 days</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Items Table */}
      <div className="my-6">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-300">
              <th className="py-3 text-sm font-semibold">Item</th>
              <th className="py-3 text-sm font-semibold">Quantity</th>
              <th className="py-3 text-sm font-semibold text-right">Price</th>
              <th className="py-3 text-sm font-semibold text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items?.map((item: OrderItem) => (
              <tr key={item.id} className="border-b border-gray-200">
                <td className="py-4">
                  <div className="font-medium">{item.item_name}</div>
                  <div className="text-sm text-gray-500">{item.category_name}</div>
                </td>
                <td className="py-4">{item.quantity}</td>
                <td className="py-4 text-right">{formatCurrency(item.unit_price)}</td>
                <td className="py-4 text-right">{formatCurrency(item.total_amount)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={2} className="pt-6"></td>
              <td className="pt-6 text-right font-medium">Subtotal</td>
              <td className="pt-6 text-right font-medium">{formatCurrency(order.total_amount)}</td>
            </tr>
            <tr>
              <td colSpan={2}></td>
              <td className="py-2 text-right font-medium">Tax</td>
              <td className="py-2 text-right font-medium">{formatCurrency(0)}</td>
            </tr>
            <tr className="border-t border-gray-300">
              <td colSpan={2}></td>
              <td className="py-4 text-right font-bold">Total</td>
              <td className="py-4 text-right font-bold">{formatCurrency(order.total_amount)}</td>
            </tr>
            <tr>
              <td colSpan={2}></td>
              <td className="py-2 text-right font-medium">Amount Paid</td>
              <td className="py-2 text-right font-medium">{formatCurrency(order.amount_paid)}</td>
            </tr>
            <tr className="border-t border-gray-300">
              <td colSpan={2}></td>
              <td className="py-4 text-right font-bold">Balance Due</td>
              <td className="py-4 text-right font-bold">{formatCurrency(order.balance)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Invoice Footer */}
      <div className="mt-8 pt-8 border-t border-gray-200">
        <div className="text-sm text-gray-500">
          <p className="font-semibold mb-2">Notes:</p>
          <p>{settings.notes}</p>
        </div>

        <div className="mt-8 text-sm text-gray-500">
          <p>{settings.paymentTerms}</p>
        </div>
      </div>
    </div>
  );
};

export default InvoicePreview;
