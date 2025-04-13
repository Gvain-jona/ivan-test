import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, CreditCard, DollarSign, Wallet, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { OrderPaymentsTabProps } from './types';
import PaymentForm from './PaymentForm';
import { OrderPayment } from '@/types/orders';

/**
 * OrderPaymentsTab displays the order payments and payment form
 */
const OrderPaymentsTab: React.FC<OrderPaymentsTabProps> = ({
  order,
  showPaymentForm,
  setShowPaymentForm,
  canEdit,
  onAddPayment
}) => {
  return (
    <div>
      {showPaymentForm ? (
        <PaymentForm
          onSubmit={onAddPayment}
          onCancel={() => setShowPaymentForm(false)}
        />
      ) : (
        canEdit && (
          <div className="mb-4">
            <Button
              onClick={() => setShowPaymentForm(true)}
              variant="outline"
              className="border-[#2B2B40] bg-transparent hover:bg-white/[0.02] text-[#6D6D80] hover:text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Payment
            </Button>
          </div>
        )
      )}

      <div className="space-y-4">
        {order?.payments?.length ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {order.payments.map((payment: OrderPayment) => (
                <div
                  key={payment.id}
                  className="border border-[#2B2B40] rounded-lg p-4 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-[#1E1E2D] rounded-md">
                      {payment.method === 'cash' ? (
                        <Wallet className="h-5 w-5 text-green-500" />
                      ) : payment.method === 'bank_transfer' ? (
                        <CreditCard className="h-5 w-5 text-blue-500" />
                      ) : (
                        <DollarSign className="h-5 w-5 text-orange-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-white capitalize">
                        {payment.method.replace('_', ' ')} Payment
                      </h4>
                      <div className="flex items-center mt-1">
                        <Calendar className="h-3 w-3 text-[#6D6D80] mr-1" />
                        <span className="text-xs text-[#6D6D80]">
                          {new Date(payment.payment_date).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="mt-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-[#6D6D80]">Amount</span>
                          <span className="text-sm font-medium text-green-500">{formatCurrency(payment.amount)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border border-[#2B2B40] rounded-lg p-4 mt-4">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                  <Wallet className="h-4 w-4 text-[#6D6D80] mr-2" />
                  <span className="text-sm text-[#6D6D80]">Total Paid</span>
                </div>
                <span className="text-sm font-medium text-green-500">{formatCurrency(order.amount_paid)}</span>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 text-[#6D6D80] mr-2" />
                  <span className="text-sm text-[#6D6D80]">Balance</span>
                </div>
                <span className="text-sm font-medium text-orange-500">{formatCurrency(order.balance || (order.total_amount - order.amount_paid))}</span>
              </div>
            </div>
          </>
        ) : (
          <div className="border border-[#2B2B40] rounded-lg p-6 text-center">
            <AlertCircle className="h-8 w-8 text-[#6D6D80] mx-auto mb-2" />
            <p className="text-sm text-[#6D6D80]">No payments found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderPaymentsTab;
