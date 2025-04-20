import React from 'react';
import { CalendarIcon, CheckCircle, Clock, User, Tag, FileText, Truck, Calendar } from 'lucide-react';
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

        {/* Order header information moved to the sheet header */}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <div className="flex items-start gap-2">
            <User className="h-4 w-4 text-[#6D6D80] mt-0.5" />
            <div>
              <p className="text-xs text-[#6D6D80]">Client Type</p>
              <p className="text-sm text-white capitalize">{order.client_type || 'Regular'} Client</p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Tag className="h-4 w-4 text-[#6D6D80] mt-0.5" />
            <div>
              <p className="text-xs text-[#6D6D80]">Order Items</p>
              <p className="text-sm text-white">{order.items?.length || 0} Items</p>
            </div>
          </div>

          {/* Delivery Method - Made more prominent for future inline editing */}
          <div className="flex items-start gap-2">
            <Truck className="h-4 w-4 text-[#6D6D80] mt-0.5" />
            <div>
              <p className="text-xs text-[#6D6D80]">Delivery Method</p>
              <p className="text-sm text-white font-medium">{order.delivery_method || 'Pickup'}</p>
            </div>
          </div>

          {/* Delivery Date - Made more prominent for future inline editing */}
          <div className="flex items-start gap-2">
            <Calendar className="h-4 w-4 text-[#6D6D80] mt-0.5" />
            <div>
              <p className="text-xs text-[#6D6D80]">Delivery Date</p>
              <p className="text-sm text-white font-medium">{order.delivery_date ? new Date(order.delivery_date).toLocaleDateString() : 'Not scheduled'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Summary Section */}
      <div className="border border-[#2B2B40] rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-[#6D6D80]">Financial Summary</h3>
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
