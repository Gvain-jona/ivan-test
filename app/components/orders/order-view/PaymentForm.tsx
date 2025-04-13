import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PaymentFormProps } from './types';
import useOrderPayments from './hooks/useOrderPayments';

/**
 * PaymentForm component for adding payments to an order
 */
const PaymentForm: React.FC<PaymentFormProps> = ({
  onSubmit,
  onCancel
}) => {
  const {
    paymentAmount,
    setPaymentAmount,
    paymentMethod,
    setPaymentMethod,
    paymentDate,
    setPaymentDate,

    handleSubmit
  } = useOrderPayments({
    order: { id: '' } as any, // This is a placeholder, actual order is handled in the parent
    onAddPayment: onSubmit
  });

  return (
    <div className="border border-[#2B2B40] rounded-lg p-4 mb-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-medium text-white">Add Payment</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="h-8 w-8 p-0 text-[#6D6D80] hover:text-white"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="space-y-4">
        <div>
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            type="number"
            placeholder="0.00"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            className="bg-transparent border-[#2B2B40] focus:border-orange-500"
          />
        </div>
        <div>
          <Label htmlFor="date">Payment Date</Label>
          <Input
            id="date"
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            className="bg-transparent border-[#2B2B40] focus:border-orange-500"
          />
        </div>
        <div>
          <Label htmlFor="method">Payment Method</Label>
          <Select
            value={paymentMethod}
            onValueChange={setPaymentMethod}
          >
            <SelectTrigger id="method" className="bg-transparent border-[#2B2B40] focus:border-orange-500">
              <SelectValue placeholder="Select payment method" />
            </SelectTrigger>
            <SelectContent className="bg-gray-950 border-[#2B2B40]">
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
              <SelectItem value="credit_card">Credit Card</SelectItem>
              <SelectItem value="cheque">Cheque</SelectItem>
              <SelectItem value="mobile_payment">Mobile Payment</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={handleSubmit}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white"
        >
          Add Payment
        </Button>
      </div>
    </div>
  );
};

export default PaymentForm;
