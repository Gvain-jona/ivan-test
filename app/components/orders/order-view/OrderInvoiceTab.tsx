import React from 'react';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { Order } from '@/types/orders';

interface OrderInvoiceTabProps {
  order: Order | null;
  onPrint: () => void;
}

/**
 * OrderInvoiceTab displays invoice options and preview for an order
 */
export const OrderInvoiceTab: React.FC<OrderInvoiceTabProps> = ({
  order,
  onPrint
}) => {
  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-muted-foreground">No order data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Invoice Options</h3>
        <Button onClick={onPrint} className="flex items-center gap-2">
          <Printer className="h-4 w-4" />
          Print Invoice
        </Button>
      </div>
      
      <div className="bg-muted/20 rounded-lg p-6 text-center">
        <p className="text-muted-foreground mb-4">
          Click the Print Invoice button to generate and print an invoice for this order.
        </p>
        <div className="text-sm text-muted-foreground">
          <p>Order #: {order.order_number || order.id.substring(0, 8)}</p>
          <p>Client: {order.client_name}</p>
          <p>Total Amount: {order.total_amount ? new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX' }).format(order.total_amount) : 'N/A'}</p>
        </div>
      </div>
    </div>
  );
};

export default OrderInvoiceTab;
