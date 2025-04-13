import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import OrderSheet from '@/components/ui/sheets/OrderSheet';
import { OrderViewSheetProps } from './types';
import { OrderPayment } from '@/types/orders';
import { useToast } from '@/components/ui/use-toast';

// Import tab components
import OrderDetailsTab from './OrderDetailsTab';
import OrderItemsTab from './OrderItemsTab';
import OrderPaymentsTab from './OrderPaymentsTab';
import OrderNotesTab from './OrderNotesTab';

/**
 * OrderViewSheet displays order details in a side panel
 */
const OrderViewSheet: React.FC<OrderViewSheetProps> = ({
  open,
  onOpenChange,
  order,
  onClose,
  onEdit,
  onGenerateInvoice,
  userRole = 'user'
}) => {
  const { toast } = useToast();
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  // Determine if the user can edit based on role
  const canEdit = ['admin', 'manager'].includes(userRole);

  /**
   * Calculate the balance percent for the progress bar
   */
  const calculateBalancePercent = () => {
    if (!order || order.total_amount === 0) return 0;
    return (order.amount_paid / order.total_amount) * 100;
  };

  /**
   * Handle adding a new payment
   */
  const handleAddPayment = (newPayment: OrderPayment) => {
    if (!order) return;

    // Update the order with the new payment
    // In a real app, this would be an API call
    const updatedPayments = [...(order.payments || []), newPayment];
    const newAmountPaid = updatedPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const newBalance = order.total_amount - newAmountPaid;

    const newPaymentStatus =
      newAmountPaid >= order.total_amount ? 'paid' :
      newAmountPaid > 0 ? 'partially_paid' : 'unpaid';

    // Create a new order object to pass to onEdit
    const updatedOrder = {
      ...order,
      payments: updatedPayments,
      amount_paid: newAmountPaid,
      balance: newBalance,
      payment_status: newPaymentStatus
    };

    // Call the edit handler with the updated order
    onEdit(updatedOrder);

    // Hide the payment form
    setShowPaymentForm(false);
  };

  return (
    <OrderSheet
      open={open}
      onOpenChange={onOpenChange}
      title={order ? `Order ${order.order_number || `#${order.id.substring(0, 8)}`}` : 'Order Details'}
      description={order ? `Client: ${order.client_name}` : 'Loading order details...'}
      onClose={onClose}
      size="lg"
    >
      <div className="p-6">
        <div className="space-y-8">
          {/* Order Details Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-border/40 pb-2">
              <h3 className="text-lg font-semibold">Order Details</h3>
              <Button
                onClick={() => order && onGenerateInvoice(order)}
                variant="outline"
                size="sm"
                className="border-[#2B2B40] bg-transparent hover:bg-white/[0.02] text-[#6D6D80] hover:text-white"
              >
                <Printer className="mr-2 h-4 w-4" />
                Generate Invoice
              </Button>
            </div>
            {order && (
              <OrderDetailsTab
                order={order}
                calculateBalancePercent={calculateBalancePercent}
              />
            )}
          </div>

          {/* Order Items Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-border/40 pb-2">
              <h3 className="text-lg font-semibold">Order Items</h3>
            </div>
            {order && <OrderItemsTab order={order} />}
          </div>

          {/* Payments Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-border/40 pb-2">
              <h3 className="text-lg font-semibold">Payments</h3>
            </div>
            <OrderPaymentsTab
              order={order}
              showPaymentForm={showPaymentForm}
              setShowPaymentForm={setShowPaymentForm}
              canEdit={canEdit}
              onAddPayment={handleAddPayment}
            />
          </div>

          {/* Notes Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-border/40 pb-2">
              <h3 className="text-lg font-semibold">Notes</h3>
            </div>
            {order && <OrderNotesTab order={order} canEdit={canEdit} />}
          </div>
        </div>
      </div>

      <div className="border-t border-[#2B2B40] p-6">
        <div className="flex flex-wrap gap-3">
          {canEdit && (
            <Button
              onClick={() => order && onEdit(order)}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              Edit Order
            </Button>
          )}
        </div>
      </div>
    </OrderSheet>
  );
};

export default OrderViewSheet;
