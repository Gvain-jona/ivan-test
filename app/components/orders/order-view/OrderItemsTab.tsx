import React from 'react';
import { motion } from 'framer-motion';
import { formatCurrency } from '@/lib/utils';
import { OrderItemsTabProps } from './types';
import { fadeIn } from '@/utils/animation-variants';
import { OrderItem } from '@/types/orders';

/**
 * OrderItemsTab displays the order items in a table
 */
const OrderItemsTab: React.FC<OrderItemsTabProps> = ({ order }) => {
  return (
    <motion.div 
      initial="initial"
      animate="animate"
      exit="exit"
      variants={fadeIn}
    >
      <div className="border border-[#2B2B40] rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-[#2B2B40]">
          <thead className="bg-[#1E1E2D]">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-[#6D6D80] uppercase tracking-wider">Item</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-[#6D6D80] uppercase tracking-wider">Category</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-[#6D6D80] uppercase tracking-wider">Quantity</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-[#6D6D80] uppercase tracking-wider">Unit Price</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-[#6D6D80] uppercase tracking-wider">Total</th>
            </tr>
          </thead>
          <tbody className="bg-transparent divide-y divide-[#2B2B40]">
            {order.items?.length ? order.items.map((item: OrderItem) => (
              <tr key={item.id} className="hover:bg-white/[0.02]">
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-white">{item.item_name}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-[#6D6D80]">{item.category_name}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-white">{item.quantity}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-white">{formatCurrency(item.unit_price)}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-white">{formatCurrency(item.total_amount)}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5} className="px-4 py-4 text-center text-sm text-[#6D6D80]">No items found</td>
              </tr>
            )}
          </tbody>
          <tfoot className="bg-[#1E1E2D]">
            <tr>
              <td colSpan={4} className="px-4 py-3 text-right text-sm font-medium text-[#6D6D80]">Subtotal</td>
              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-white">{formatCurrency(order.total_amount)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </motion.div>
  );
};

export default OrderItemsTab;
