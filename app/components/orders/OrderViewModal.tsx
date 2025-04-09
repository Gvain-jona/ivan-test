import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Order, OrderPayment } from '@/types/orders';
import { CalendarIcon, CheckCircle, Clock, Printer, CreditCard, Plus, X } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/status-badge';
import { PaymentStatusBadge } from '@/components/ui/payment-status-badge';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface OrderViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order;
  onClose: () => void;
  onEdit: (order: Order) => void;
  onGenerateInvoice: (order: Order) => void;
  userRole?: string;
}

const OrderViewModal: React.FC<OrderViewModalProps> = ({
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
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');


  // Determine if the user can edit based on role
  const canEdit = ['admin', 'manager'].includes(userRole);

  const handleAddPayment = () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid payment amount",
        variant: "destructive",
      });
      return;
    }

    // Create the new payment
    const newPayment: OrderPayment = {
      id: `payment-${Date.now()}`,
      order_id: order.id,
      amount: parseFloat(paymentAmount),
      payment_method: paymentMethod as any, // Type cast
      payment_date: new Date().toISOString(),

      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

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

    // Reset form
    setPaymentAmount('');
    setPaymentMethod('cash');

    setShowPaymentForm(false);

    // Show toast
    toast({
      title: "Payment Added",
      description: `Payment of ${formatCurrency(newPayment.amount)} has been recorded.`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] bg-gray-950 border-gray-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Order Details
            <span className="text-sm font-normal text-gray-400 ml-2">
              #{order.id.substring(0, 8)}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-4">
          <div>
            <p className="text-sm font-medium text-gray-400">Client</p>
            <p className="text-base font-semibold">{order.client_name}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-400">Order Date</p>
            <p className="text-base">{new Date(order.date).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-400">Status</p>
            <StatusBadge status={order.status} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-400">Payment Status</p>
            <PaymentStatusBadge status={order.payment_status} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 py-2 bg-gray-900 rounded-md p-3 border border-gray-800">
          <div>
            <p className="text-sm font-medium text-gray-400">Total Amount</p>
            <p className="text-lg font-bold">{formatCurrency(order.total_amount)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-400">Amount Paid</p>
            <p className="text-lg font-bold">{formatCurrency(order.amount_paid || 0)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-400">Balance</p>
            <p className="text-lg font-bold text-orange-500">
              {formatCurrency((order.total_amount || 0) - (order.amount_paid || 0))}
            </p>
          </div>
        </div>

        <Tabs defaultValue="items" className="mt-4">
          <TabsList className="bg-gray-900 border-b border-gray-800">
            <TabsTrigger
              value="items"
              className="data-[state=active]:bg-gray-800 data-[state=active]:text-white"
            >
              Items
            </TabsTrigger>
            <TabsTrigger
              value="payments"
              className="data-[state=active]:bg-gray-800 data-[state=active]:text-white"
            >
              Payments
            </TabsTrigger>
            <TabsTrigger
              value="notes"
              className="data-[state=active]:bg-gray-800 data-[state=active]:text-white"
            >
              Notes
            </TabsTrigger>
            <TabsTrigger
              value="timeline"
              className="data-[state=active]:bg-gray-800 data-[state=active]:text-white"
            >
              Timeline
            </TabsTrigger>
          </TabsList>

          <TabsContent value="items" className="mt-4">
            <div className="bg-gray-900 rounded-md border border-gray-800 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-800">
                <thead className="bg-gray-900">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Item</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Quantity</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Unit Price</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {order.items?.map((item) => (
                    <tr key={item.id} className="bg-gray-900 hover:bg-gray-850">
                      <td className="px-4 py-3 text-sm text-gray-300">
                        <div>
                          <p className="font-medium">{item.item_name}</p>
                          <p className="text-xs text-gray-500">{item.category_name}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300">{item.quantity}</td>
                      <td className="px-4 py-3 text-sm text-gray-300">{formatCurrency(item.unit_price)}</td>
                      <td className="px-4 py-3 text-sm font-medium">{formatCurrency(item.total_amount)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-900/50">
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-sm font-medium text-right">Total:</td>
                    <td className="px-4 py-3 text-sm font-bold">{formatCurrency(order.total_amount)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="payments" className="mt-4">
            <div className="mb-4 flex justify-between items-center">
              <h3 className="text-base font-medium">Payment History</h3>
              {canEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-orange-600 text-orange-500 hover:bg-orange-950"
                  onClick={() => setShowPaymentForm(!showPaymentForm)}
                >
                  {showPaymentForm ? (
                    <X className="h-4 w-4 mr-1" />
                  ) : (
                    <Plus className="h-4 w-4 mr-1" />
                  )}
                  {showPaymentForm ? 'Cancel' : 'Add Payment'}
                </Button>
              )}
            </div>

            {showPaymentForm && (
              <div className="bg-gray-900 rounded-md border border-gray-800 p-4 mb-4">
                <h4 className="text-sm font-medium mb-3 flex items-center">
                  <CreditCard className="h-4 w-4 mr-2 text-orange-500" />
                  Record New Payment
                </h4>

                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <Label htmlFor="payment_amount">Amount</Label>
                    <Input
                      id="payment_amount"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Enter amount"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>
                  <div>
                    <Label htmlFor="payment_method">Payment Method</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger id="payment_method" className="bg-gray-800 border-gray-700">
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-950 border-gray-800">
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="credit_card">Credit Card</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="cheque">Cheque</SelectItem>
                        <SelectItem value="mobile_payment">Mobile Payment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>



                <div className="flex justify-end">
                  <Button
                    className="bg-orange-600 text-white hover:bg-orange-700"
                    onClick={handleAddPayment}
                  >
                    Record Payment
                  </Button>
                </div>
              </div>
            )}

            {(order.payments?.length || 0) > 0 ? (
              <div className="bg-gray-900 rounded-md border border-gray-800 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-800">
                  <thead className="bg-gray-900">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Method</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {order.payments?.map((payment) => (
                      <tr key={payment.id} className="bg-gray-900 hover:bg-gray-850">
                        <td className="px-4 py-3 text-sm text-gray-300">
                          {new Date(payment.payment_date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-300">
                          {(payment.payment_method || payment.payment_type || '').replace(/_/g, ' ')}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium">{formatCurrency(payment.amount)}</td>
                        <td className="px-4 py-3 text-sm text-gray-300">{payment.notes || ''}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-900/50">
                    <tr>
                      <td colSpan={2} className="px-4 py-3 text-sm font-medium text-right">Total Paid:</td>
                      <td colSpan={2} className="px-4 py-3 text-sm font-bold">{formatCurrency(order.amount_paid || 0)}</td>
                    </tr>
                    <tr>
                      <td colSpan={2} className="px-4 py-3 text-sm font-medium text-right">Balance:</td>
                      <td colSpan={2} className="px-4 py-3 text-sm font-bold text-orange-500">
                        {formatCurrency((order.total_amount || 0) - (order.amount_paid || 0))}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <div className="text-center py-6 bg-gray-900 rounded-md border border-gray-800">
                <p className="text-gray-400">No payments recorded yet</p>
                {canEdit && (
                  <p className="text-gray-500 text-sm mt-1">Use the "Add Payment" button to record a payment</p>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="notes" className="mt-4">
            <div className="space-y-3">
              {(order.notes?.length || 0) > 0 ? (
                order.notes?.map((note) => (
                  <div
                    key={note.id}
                    className="bg-gray-900 rounded-md border border-gray-800 p-3"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-xs uppercase font-medium px-2 py-1 rounded-full
                        ${note.type === 'urgent' ? 'bg-red-900 text-red-300' :
                          note.type === 'client_follow_up' ? 'bg-blue-900 text-blue-300' :
                          'bg-gray-800 text-gray-300'}`}
                      >
                        {note.type.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(note.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300">{note.text}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 bg-gray-900 rounded-md border border-gray-800">
                  <p className="text-gray-400">No notes for this order</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="timeline" className="mt-4">
            <div className="space-y-4">
              <div className="relative pl-8 pb-4">
                <div className="absolute top-0 left-3 w-px h-full bg-gray-800"></div>
                <div className="absolute top-0 left-0 w-6 h-6 rounded-full bg-green-900 border-2 border-green-500 flex items-center justify-center">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                </div>
                <div className="bg-gray-900 rounded-md border border-gray-800 p-3">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-sm font-medium text-white">Order Created</span>
                    <span className="text-xs text-gray-500">
                      {new Date(order.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">Order #{order.id.substring(0, 8)} was created</p>
                </div>
              </div>

              {/* We would populate other timeline events here from actual data */}
              <div className="relative pl-8 pb-4">
                <div className="absolute top-0 left-3 w-px h-full bg-gray-800"></div>
                <div className="absolute top-0 left-0 w-6 h-6 rounded-full bg-gray-900 border-2 border-gray-700 flex items-center justify-center">
                  <Clock className="h-3 w-3 text-gray-500" />
                </div>
                <div className="bg-gray-900 rounded-md border border-gray-800 p-3">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-sm font-medium text-white">Status Updated</span>
                    <span className="text-xs text-gray-500">
                      {new Date(order.updated_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">Status changed to "{order.status.replace(/_/g, ' ')}"</p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="sm:justify-between mt-4 pt-4 border-t border-gray-800">
          <Button
            variant="outline"
            className="border-gray-700 text-gray-300 hover:bg-gray-800"
            onClick={onClose}
          >
            Close
          </Button>
          <div className="flex gap-2">
            {canEdit && (
              <Button
                variant="outline"
                className="border-orange-600 text-orange-500 hover:bg-orange-950"
                onClick={() => onEdit(order)}
              >
                Edit Order
              </Button>
            )}
            <Button
              className="bg-orange-600 text-white hover:bg-orange-700"
              onClick={() => onGenerateInvoice(order)}
            >
              <Printer className="h-4 w-4 mr-2" />
              Generate Invoice
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OrderViewModal;