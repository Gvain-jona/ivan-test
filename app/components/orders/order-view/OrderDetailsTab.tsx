import React from 'react';
import { CalendarIcon, CheckCircle, Clock, User, Tag, FileText } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/status-badge';
import { PaymentStatusBadge } from '@/components/ui/payment-status-badge';
import { OrderDetailsTabProps } from './types';

/**
 * OrderDetailsTab displays the order details, status, and payment information
 */
const OrderDetailsTab: React.FC<OrderDetailsTabProps> = ({
  order,
  calculateBalancePercent
}) => {
  return (
    <div className="space-y-4">
      {/* Order Information Section */}
      <div className="border border-[#2B2B40] rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-[#6D6D80]">Order Information</h3>
          <div className="flex gap-2">
            <StatusBadge status={order.status} />
          </div>
        </div>

        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 bg-[#1E1E2D] rounded-md">
            <FileText className="h-5 w-5 text-orange-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-medium text-white">Order {order.order_number || `#${order.id.substring(0, 8)}`}</h4>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#1E1E2D] text-[#6D6D80]">{order.date}</span>
            </div>
            <div className="flex items-center mt-1">
              <CalendarIcon className="h-3 w-3 text-[#6D6D80] mr-1" />
              <span className="text-xs text-[#6D6D80]">{new Date(order.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-start gap-2">
            <User className="h-4 w-4 text-[#6D6D80] mt-0.5" />
            <div>
              <p className="text-xs text-[#6D6D80]">Client</p>
              <p className="text-sm text-white">{order.client_name}</p>
              <p className="text-xs text-[#6D6D80] mt-1">{order.client_type || 'Regular'} Client</p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Tag className="h-4 w-4 text-[#6D6D80] mt-0.5" />
            <div>
              <p className="text-xs text-[#6D6D80]">Details</p>
              <p className="text-sm text-white">{order.items?.length || 0} Items</p>
              <p className="text-xs text-[#6D6D80] mt-1">Delivery: {order.delivery_method || 'Pickup'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Information Section */}
      <div className="border border-[#2B2B40] rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-[#6D6D80]">Payment Information</h3>
          <PaymentStatusBadge status={order.payment_status} />
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-[#6D6D80]">Total Amount</p>
              <p className="text-lg font-medium text-white">{formatCurrency(order.total_amount)}</p>
            </div>
            <div>
              <p className="text-xs text-[#6D6D80]">Amount Paid</p>
              <p className="text-lg font-medium text-green-500">{formatCurrency(order.amount_paid)}</p>
            </div>
            <div>
              <p className="text-xs text-[#6D6D80]">Balance Due</p>
              <p className="text-lg font-medium text-orange-500">{formatCurrency(order.balance || (order.total_amount - order.amount_paid))}</p>
            </div>
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
  );
};

export default OrderDetailsTab;
