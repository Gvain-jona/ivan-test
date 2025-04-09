import React from 'react';
import { motion } from 'framer-motion';
import { CalendarIcon, CheckCircle, Clock } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/status-badge';
import { PaymentStatusBadge } from '@/components/ui/payment-status-badge';
import { OrderDetailsTabProps } from './types';
import { fadeIn } from '@/utils/animation-variants';

/**
 * OrderDetailsTab displays the order details, status, and payment information
 */
const OrderDetailsTab: React.FC<OrderDetailsTabProps> = ({ 
  order,
  calculateBalancePercent
}) => {
  return (
    <motion.div 
      initial="initial"
      animate="animate"
      exit="exit"
      variants={fadeIn}
      className="space-y-4"
    >
      {/* Status Section */}
      <div className="border border-[#2B2B40] rounded-lg p-4">
        <h3 className="text-sm font-medium text-[#6D6D80] mb-3">Order Status</h3>
        <div className="flex flex-wrap gap-3">
          <StatusBadge status={order.status} />
          <PaymentStatusBadge status={order.payment_status} />
        </div>
        
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <Clock className="h-4 w-4 text-[#6D6D80] mr-2" />
              <span className="text-sm text-[#6D6D80]">Payment Progress</span>
            </div>
            <span className="text-sm text-white">{Math.round(calculateBalancePercent())}%</span>
          </div>
          <div className="w-full bg-[#2B2B40] rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-orange-500 to-orange-400 h-2 rounded-full" 
              style={{ width: `${calculateBalancePercent()}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-[#6D6D80]">
              {formatCurrency(order.amount_paid)} paid
            </span>
            <span className="text-xs text-[#6D6D80]">
              {formatCurrency(order.total_amount)} total
            </span>
          </div>
        </div>
      </div>
      
      {/* Order Information Section */}
      <div className="border border-[#2B2B40] rounded-lg p-4">
        <h3 className="text-sm font-medium text-[#6D6D80] mb-3">Order Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-[#6D6D80]">Client Name</p>
            <p className="text-sm text-white">{order.client_name}</p>
          </div>
          <div>
            <p className="text-xs text-[#6D6D80]">Client Type</p>
            <p className="text-sm text-white">{order.client_type || 'Regular'}</p>
          </div>
          <div>
            <p className="text-xs text-[#6D6D80]">Order Date</p>
            <p className="text-sm text-white flex items-center">
              <CalendarIcon className="mr-1 h-3 w-3 text-[#6D6D80]" />
              {order.date}
            </p>
          </div>
          <div>
            <p className="text-xs text-[#6D6D80]">Delivery Method</p>
            <p className="text-sm text-white">{order.delivery_method || 'Pickup'}</p>
          </div>
        </div>
      </div>
      
      {/* Payment Information Section */}
      <div className="border border-[#2B2B40] rounded-lg p-4">
        <h3 className="text-sm font-medium text-[#6D6D80] mb-3">Payment Information</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-[#6D6D80]">Total Amount</p>
              <p className="text-lg font-medium text-white">{formatCurrency(order.total_amount)}</p>
            </div>
            <div>
              <p className="text-xs text-[#6D6D80]">Amount Paid</p>
              <p className="text-lg font-medium text-green-500">{formatCurrency(order.amount_paid)}</p>
            </div>
          </div>
          
          <div className="pt-4 border-t border-[#2B2B40]">
            <div className="flex justify-between items-center">
              <p className="text-sm text-[#6D6D80]">Balance Due</p>
              <p className="text-lg font-medium text-orange-500">{formatCurrency(order.balance)}</p>
            </div>
            {order.payment_status === 'paid' && (
              <div className="flex items-center justify-center mt-2 text-green-500 bg-green-500/10 rounded-md py-1">
                <CheckCircle className="h-4 w-4 mr-2" />
                <span className="text-sm">Fully Paid</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default OrderDetailsTab;
