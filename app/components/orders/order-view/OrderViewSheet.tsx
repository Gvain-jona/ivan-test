import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { motion } from 'framer-motion';
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
  const [activeTab, setActiveTab] = useState('details');
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  // Determine if the user can edit based on role
  const canEdit = ['admin', 'manager'].includes(userRole);

  /**
   * Calculate the balance percent for the progress bar
   */
  const calculateBalancePercent = () => {
    if (order.total_amount === 0) return 0;
    return (order.amount_paid / order.total_amount) * 100;
  };

  /**
   * Handle adding a new payment
   */
  const handleAddPayment = (newPayment: OrderPayment) => {
    // Update the order with the new payment
    // In a real app, this would be an API call
    const updatedPayments = [...(order.payments || []), newPayment];
    const newAmountPaid = updatedPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const newBalance = order.total_amount - newAmountPaid;

    const newPaymentStatus =
      newAmountPaid >= order.total_amount ? 'paid' :
      newAmountPaid > 0 ? 'partially_paid' : 'unpaid';

    // Update the order object
    order.payments = updatedPayments;
    order.amount_paid = newAmountPaid;
    order.balance = newBalance;
    order.payment_status = newPaymentStatus;

    // Hide the payment form
    setShowPaymentForm(false);
  };

  return (
    <OrderSheet
      open={open}
      onOpenChange={onOpenChange}
      title={`Order #${order.id}`}
      description={`Client: ${order.client_name}`}
      onClose={onClose}
      size="lg"
    >
      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="border-b border-border/40">
            <TabsList className="bg-transparent">
              <TabsTrigger
                value="details"
                className="data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none text-muted-foreground px-4 py-2"
              >
                Details
              </TabsTrigger>
              <TabsTrigger
                value="items"
                className="data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none text-muted-foreground px-4 py-2"
              >
                Items
              </TabsTrigger>
              <TabsTrigger
                value="payments"
                className="data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none text-muted-foreground px-4 py-2"
              >
                Payments
              </TabsTrigger>
              <TabsTrigger
                value="notes"
                className="data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none text-muted-foreground px-4 py-2"
              >
                Notes
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-4">
            <OrderDetailsTab
              order={order}
              calculateBalancePercent={calculateBalancePercent}
            />
          </TabsContent>

          {/* Items Tab */}
          <TabsContent value="items" className="space-y-4">
            <OrderItemsTab order={order} />
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-4">
            <OrderPaymentsTab
              order={order}
              showPaymentForm={showPaymentForm}
              setShowPaymentForm={setShowPaymentForm}
              canEdit={canEdit}
              onAddPayment={handleAddPayment}
            />
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes" className="space-y-4">
            <OrderNotesTab order={order} />
          </TabsContent>
        </Tabs>
      </div>

      <div className="border-t border-[#2B2B40] p-6">
        <div className="flex flex-wrap gap-3">
          {canEdit && (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => onEdit(order)}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                Edit Order
              </Button>
            </motion.div>
          )}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={() => onGenerateInvoice(order)}
              variant="outline"
              className="border-[#2B2B40] bg-transparent hover:bg-white/[0.02] text-[#6D6D80] hover:text-white"
            >
              <Printer className="mr-2 h-4 w-4" />
              Generate Invoice
            </Button>
          </motion.div>
        </div>
      </div>
    </OrderSheet>
  );
};

export default OrderViewSheet;
