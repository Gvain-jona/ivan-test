import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Save } from 'lucide-react';
import { OrderPayment } from '@/types/orders';
import { useToast } from '@/components/ui/use-toast';
import { formatCurrency } from '@/lib/utils';

interface AddOrderPaymentFormProps {
  orderId: string;
  onSubmit: (payment: Partial<OrderPayment>) => Promise<void>;
  onCancel: () => void;
}

const AddOrderPaymentForm: React.FC<AddOrderPaymentFormProps> = ({
  orderId,
  onSubmit,
  onCancel
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<OrderPayment>>({
    order_id: orderId,
    amount: 0,
    payment_method: 'cash',
    payment_date: new Date().toISOString().split('T')[0],
  });

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === 'amount') {
      setFormData({
        ...formData,
        [name]: parseFloat(value) || 0
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  // Handle select changes
  const handleSelectChange = (value: string) => {
    setFormData({
      ...formData,
      payment_method: value
    });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!formData.amount || formData.amount <= 0) {
      toast({
        title: 'Error',
        description: 'Payment amount must be greater than 0',
        variant: 'destructive'
      });
      return;
    }

    if (!formData.payment_method) {
      toast({
        title: 'Error',
        description: 'Payment method is required',
        variant: 'destructive'
      });
      return;
    }

    if (!formData.payment_date) {
      toast({
        title: 'Error',
        description: 'Payment date is required',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsLoading(true);
      await onSubmit(formData);
      // Form will be closed by the parent component
    } catch (error) {
      console.error('Error adding payment:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add payment',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="amount">Payment Amount</Label>
        <Input
          id="amount"
          name="amount"
          type="number"
          min="0.01"
          step="0.01"
          value={formData.amount}
          onChange={handleChange}
          placeholder="Enter payment amount"
          disabled={isLoading}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="payment_method">Payment Method</Label>
          <Select
            value={formData.payment_method}
            onValueChange={handleSelectChange}
            disabled={isLoading}
          >
            <SelectTrigger id="payment_method">
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

        <div className="space-y-2">
          <Label htmlFor="payment_date">Payment Date</Label>
          <Input
            id="payment_date"
            name="payment_date"
            type="date"
            value={formData.payment_date}
            onChange={handleChange}
            disabled={isLoading}
            required
          />
        </div>
      </div>

      <div className="bg-muted/30 p-4 rounded-lg border border-border/50">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Payment Amount:</span>
          <span className="text-lg font-semibold text-green-500">
            {formatCurrency(formData.amount || 0)}
          </span>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading || !formData.amount || formData.amount <= 0 || !formData.payment_method || !formData.payment_date}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Adding...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Add Payment
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

export default AddOrderPaymentForm;
