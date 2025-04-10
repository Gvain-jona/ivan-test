import React from 'react';
import { motion } from 'framer-motion';
import { OrderNotesTabProps } from './types';
import { fadeIn } from '@/utils/animation-variants';

/**
 * OrderNotesTab displays the order notes
 */
const OrderNotesTab: React.FC<OrderNotesTabProps> = ({ order }) => {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={fadeIn}
      className="space-y-4"
    >
      <div className="border border-[#2B2B40] rounded-lg p-4">
        <h3 className="text-sm font-medium text-[#6D6D80] mb-3">Order Notes</h3>
        {order.notes && order.notes.length > 0 ? (
          <div className="space-y-3">
            {order.notes.map((note, index) => (
              <div key={note.id || index} className="border-l-2 border-brand pl-3 py-1">
                <p className="text-sm text-white whitespace-pre-line">{note.text}</p>
                <div className="flex justify-between mt-1">
                  <p className="text-xs text-brand">{note.created_by_name}</p>
                  <p className="text-xs text-[#6D6D80]">{new Date(note.created_at).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[#6D6D80]">No notes available for this order.</p>
        )}
      </div>

      {/* Order Timeline/History Section */}
      <div className="border border-[#2B2B40] rounded-lg p-4">
        <h3 className="text-sm font-medium text-[#6D6D80] mb-3">Order Timeline</h3>
        <div className="space-y-4">
          <div className="border-l-2 border-[#2B2B40] pl-4 py-1">
            <p className="text-sm text-white">Order created</p>
            <p className="text-xs text-[#6D6D80]">{new Date(order.created_at).toLocaleString()}</p>
          </div>
          {order.updated_at && order.updated_at !== order.created_at && (
            <div className="border-l-2 border-[#2B2B40] pl-4 py-1">
              <p className="text-sm text-white">Order updated</p>
              <p className="text-xs text-[#6D6D80]">{new Date(order.updated_at).toLocaleString()}</p>
            </div>
          )}
          {order.payments && order.payments.map((payment, index) => (
            <div key={`payment-${index}`} className="border-l-2 border-green-800 pl-4 py-1">
              <p className="text-sm text-white">Payment received</p>
              <p className="text-xs text-green-500">Amount: ${payment.amount.toFixed(2)}</p>
              <p className="text-xs text-[#6D6D80]">{new Date(payment.date).toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default OrderNotesTab;
