import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, CreditCard, DollarSign, Wallet, AlertCircle, Pencil, Trash2, Save, X, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { OrderPaymentsTabProps } from './types';
import PaymentForm from './PaymentForm';
import { OrderPayment } from '@/types/orders';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

/**
 * PaymentEditForm component for inline editing of payments
 */
interface PaymentEditFormProps {
  payment: OrderPayment;
  onSave: (updatedPayment: OrderPayment) => void;
  onCancel: () => void;
}

const PaymentEditForm: React.FC<PaymentEditFormProps> = ({ payment, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    amount: payment.amount || 0,
    payment_method: payment.payment_method || payment.payment_type || 'cash',
    payment_date: payment.payment_date || payment.date || new Date().toISOString().split('T')[0],
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      payment_method: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Create the updated payment with both naming conventions for compatibility
    const updatedPayment = {
      ...payment,
      ...formData,
      // Add both naming conventions for compatibility
      payment_date: formData.payment_date,
      date: formData.payment_date,
      payment_method: formData.payment_method,
      payment_type: formData.payment_method,
    };

    onSave(updatedPayment);
  };

  // Check if form is complete
  const isFormComplete =
    formData.amount > 0 &&
    formData.payment_method &&
    formData.payment_date;

  return (
    <div className="bg-background/95 backdrop-blur-sm border border-border rounded-md shadow-sm">
      <div className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="amount" className="text-xs font-medium">Payment Amount</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              min="0.01"
              step="0.01"
              value={formData.amount}
              onChange={handleChange}
              className="h-9 text-sm"
              placeholder="Enter payment amount"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="payment_method" className="text-xs font-medium">Payment Method</Label>
              <Select
                value={formData.payment_method}
                onValueChange={handleSelectChange}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="mobile_payment">Mobile Payment</SelectItem>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="payment_date" className="text-xs font-medium">Payment Date</Label>
              <Input
                id="payment_date"
                name="payment_date"
                type="date"
                value={formData.payment_date}
                onChange={handleChange}
                className="h-9 text-sm"
                required
              />
            </div>
          </div>

          <div className="mt-4 p-3 bg-muted/20 rounded-md border border-border/30">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <span className="text-sm font-medium mr-2">Payment Amount:</span>
                <span className="text-lg font-semibold text-green-500">
                  {formatCurrency(formData.amount || 0)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {isFormComplete && (
                  <span className="text-xs text-muted-foreground italic">
                    All fields complete
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="px-4"
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              className="bg-green-600 hover:bg-green-700 text-white px-4"
              disabled={!isFormComplete}
            >
              <Save className="mr-2 h-4 w-4" />
              Save Payment
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

/**
 * OrderPaymentsTab displays the order payments and payment form
 */
const OrderPaymentsTab: React.FC<OrderPaymentsTabProps> = ({
  order,
  onEdit,
  refreshOrder,
  isLoading = false,
  isError = false,
  loadingStates = {},
  onAddPaymentClick
}) => {
  const { toast } = useToast();

  // State for tracking which payment is being edited
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);

  // Handle edit button click
  const handleEditClick = (payment: OrderPayment) => {
    setEditingPaymentId(payment.id);
  };

  // Handle save edited payment
  const handleSavePayment = (updatedPayment: OrderPayment) => {
    // Call the onEdit function to update the payment
    if (onEdit) {
      // Create a new order object with the updated payment
      const updatedOrder = { ...order };
      if (updatedOrder.payments) {
        const paymentIndex = updatedOrder.payments.findIndex(p => p.id === updatedPayment.id);
        if (paymentIndex !== -1) {
          updatedOrder.payments[paymentIndex] = updatedPayment;
          onEdit(updatedOrder);
        }
      }
    }
    setEditingPaymentId(null);
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingPaymentId(null);
  };

  // Handle delete button click
  const handleDeletePayment = (paymentId: string) => {
    // Call the onEdit function to delete the payment
    if (onEdit) {
      // Create a new order object without the deleted payment
      const updatedOrder = { ...order };
      if (updatedOrder.payments) {
        updatedOrder.payments = updatedOrder.payments.filter(p => p.id !== paymentId);
        onEdit(updatedOrder);
      }
    }
  };
  // Ensure we have a valid order and payments array - use useMemo to avoid recalculations
  const { safeOrder, normalizedPayments } = React.useMemo(() => {
    const safeOrder = order || { payments: [] };
    const safePayments = Array.isArray(safeOrder.payments) ? safeOrder.payments : [];

    // Normalize payment data to ensure consistent structure
    const normalizedPayments = safePayments.map(payment => ({
      ...payment,
      // Ensure both naming conventions are present
      payment_date: payment.payment_date || payment.date || new Date().toISOString().split('T')[0],
      date: payment.date || payment.payment_date || new Date().toISOString().split('T')[0],
      payment_method: payment.payment_method || payment.payment_type || 'cash',
      payment_type: payment.payment_type || payment.payment_method || 'cash'
    }));

    return { safeOrder, normalizedPayments };
  }, [order]);

  // Log payment data for debugging - only when order ID changes
  useEffect(() => {
    if (safeOrder.id) {
      console.log('OrderPaymentsTab - order ID:', safeOrder.id);
      console.log('OrderPaymentsTab - normalized payments:', normalizedPayments);
      console.log('OrderPaymentsTab - payments count:', normalizedPayments.length);
    }
  }, [safeOrder.id]);
  return (
    <div>
      <div className="mb-4">
        <Button
          onClick={() => onAddPaymentClick ? onAddPaymentClick(order?.id || '') : null}
          variant="outline"
          className="border-border/40 bg-popover backdrop-blur-md rounded-xl hover:bg-popover/90 text-muted-foreground hover:text-foreground shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
          disabled={isLoading || !order?.id}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Payment
        </Button>
      </div>

      <div className="space-y-4">
        {/* Only show loading state if we don't have any payments data yet */}
        {isLoading && normalizedPayments.length === 0 ? (
          <div className="border border-border/40 bg-popover backdrop-blur-md rounded-xl p-4 text-center shadow-sm">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500/10 to-green-600/5 rounded-full flex items-center justify-center shadow-sm ring-1 ring-green-500/20 mx-auto mb-2">
              <Loader2 className="h-5 w-5 text-green-500/70 animate-spin" strokeWidth={1.5} />
            </div>
            <p className="text-sm text-muted-foreground">Loading payment details...</p>
          </div>
        ) : isError && normalizedPayments.length === 0 ? (
          <div className="border border-destructive/20 bg-popover backdrop-blur-md rounded-xl p-4 text-center shadow-sm">
            <div className="w-10 h-10 bg-gradient-to-br from-destructive/10 to-destructive/5 rounded-full flex items-center justify-center shadow-sm ring-1 ring-destructive/20 mx-auto mb-2">
              <AlertCircle className="h-5 w-5 text-destructive/70" strokeWidth={1.5} />
            </div>
            <p className="text-sm text-muted-foreground">Failed to load payment details</p>
          </div>
        ) : normalizedPayments.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 w-full">
            {normalizedPayments.map((payment: OrderPayment) => (
              <div
                key={payment.id}
                className={`border ${editingPaymentId === payment.id ? 'border-primary/30' : 'border-border/40'} bg-popover backdrop-blur-md rounded-xl p-3 transition-all duration-200 shadow-sm ${editingPaymentId !== payment.id ? 'hover:shadow-md hover:-translate-y-1 hover:bg-popover/90 relative after:absolute after:inset-x-0 after:bottom-0 after:h-1 after:bg-green-500/20 after:rounded-b-xl after:opacity-0 hover:after:opacity-100 after:transition-opacity' : ''} w-full`}
              >
                {editingPaymentId === payment.id ? (
                  <PaymentEditForm
                    payment={payment}
                    onSave={handleSavePayment}
                    onCancel={handleCancelEdit}
                  />
                ) : (
                  <div className="flex flex-col">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-8 h-8 bg-gradient-to-br from-green-500/10 to-green-600/5 rounded-lg flex items-center justify-center shadow-sm ring-1 ring-green-500/20">
                          {(payment.payment_method || payment.payment_type) ? (
                            (payment.payment_method || payment.payment_type) === 'cash' ? (
                              <Wallet className="h-4 w-4 text-green-500" strokeWidth={1.5} />
                            ) : (payment.payment_method || payment.payment_type) === 'bank_transfer' ? (
                              <CreditCard className="h-4 w-4 text-blue-500" strokeWidth={1.5} />
                            ) : (
                              <DollarSign className="h-4 w-4 text-orange-500" strokeWidth={1.5} />
                            )
                          ) : (
                            <DollarSign className="h-4 w-4 text-orange-500" strokeWidth={1.5} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className={`text-sm font-medium truncate capitalize ${loadingStates.editPayment === payment.id ? 'text-primary animate-pulse' : ''}`}>
                            {loadingStates.editPayment === payment.id && <Loader2 className="h-3 w-3 inline mr-1 animate-spin" />}
                            {(payment.payment_method || payment.payment_type) ?
                              (payment.payment_method || payment.payment_type).replace('_', ' ') + ' Payment' : 'Payment'}
                          </h4>
                          <div className="flex items-center mt-0.5">
                            <Calendar className="h-3 w-3 text-muted-foreground mr-1" />
                            <span className={`text-xs ${loadingStates.editPayment === payment.id ? 'text-primary/70 animate-pulse' : 'text-muted-foreground'} truncate flex items-center gap-1`}>
                              {loadingStates.editPayment === payment.id && <Loader2 className="h-2.5 w-2.5 animate-spin" />}
                              {payment.payment_date ? new Date(payment.payment_date).toLocaleDateString() :
                               payment.date ? new Date(payment.date).toLocaleDateString() :
                               new Date(payment.created_at || Date.now()).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-sm font-medium ${loadingStates.editPayment === payment.id ? 'text-primary animate-pulse' : 'text-green-500'}`}>
                          {loadingStates.editPayment === payment.id && <Loader2 className="h-3 w-3 inline mr-1 animate-spin" />}
                          {formatCurrency(payment.amount)}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-end mt-2 pt-2 border-t border-border/30">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 p-0 hover:bg-muted/50 text-muted-foreground hover:text-primary"
                          onClick={() => handleEditClick(payment)}
                          disabled={isLoading || loadingStates.editPayment === payment.id || loadingStates.deletePayment === payment.id}
                        >
                          {loadingStates.editPayment === payment.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Pencil className="h-3.5 w-3.5" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 p-0 hover:bg-muted/50 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDeletePayment(payment.id)}
                          disabled={isLoading || loadingStates.editPayment === payment.id || loadingStates.deletePayment === payment.id}
                        >
                          {loadingStates.deletePayment === payment.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="border border-border/40 bg-popover backdrop-blur-md rounded-xl p-4 text-center shadow-sm">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500/10 to-green-600/5 rounded-full flex items-center justify-center shadow-sm ring-1 ring-green-500/20 mx-auto mb-2">
              <AlertCircle className="h-5 w-5 text-green-500/70" strokeWidth={1.5} />
            </div>
            <p className="text-sm text-muted-foreground">No payments found</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Memoize the component to prevent unnecessary re-renders
export default React.memo(OrderPaymentsTab);
