import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { OrderPaymentsTabProps } from './types';
import { fadeIn } from '@/utils/animation-variants';
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
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={fadeIn}
    >
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

      <div className="border border-[#2B2B40] rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-[#2B2B40]">
          <thead className="bg-[#1E1E2D]">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-[#6D6D80] uppercase tracking-wider">Date</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-[#6D6D80] uppercase tracking-wider">Method</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-[#6D6D80] uppercase tracking-wider">Amount</th>
            </tr>
          </thead>
          <tbody className="bg-transparent divide-y divide-[#2B2B40]">
            {order.payments?.length ? order.payments.map((payment: OrderPayment) => (
              <tr key={payment.id} className="hover:bg-white/[0.02]">
                <td className="px-4 py-3 whitespace-nowrap text-sm text-white">
                  {new Date(payment.date).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-white capitalize">
                  {payment.method.replace('_', ' ')}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-green-500">
                  {formatCurrency(payment.amount)}
                </td>

              </tr>
            )) : (
              <tr>
                <td colSpan={3} className="px-4 py-4 text-center text-sm text-[#6D6D80]">No payments found</td>
              </tr>
            )}
          </tbody>
          <tfoot className="bg-[#1E1E2D]">
            <tr>
              <td colSpan={2} className="px-4 py-3 text-right text-sm font-medium text-[#6D6D80]">Total Paid</td>
              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-green-500">{formatCurrency(order.amount_paid)}</td>

            </tr>
            <tr>
              <td colSpan={2} className="px-4 py-3 text-right text-sm font-medium text-[#6D6D80]">Balance</td>
              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-orange-500">{formatCurrency(order.balance)}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </motion.div>
  );
};

export default OrderPaymentsTab;
