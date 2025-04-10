import React, { useState } from 'react';
import { Order, OrderStatus } from '@/types/orders';
import StatusBadge from './StatusBadge';
import OrderActions from './OrderActions';
import { ChevronDown, ChevronRight, FileText } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { motion, AnimatePresence } from 'framer-motion';
import { tableRowHover, tableRowExpand } from '@/utils/animation-variants';

interface OrderRowProps {
  order: Order;
  userRole: 'admin' | 'manager' | 'employee';
  onView: (order: Order) => void;
  onEdit: (order: Order) => void;
  onDelete: (order: Order) => void;
  onDuplicate: (order: Order) => void;
  onInvoice: (order: Order) => void;
  onStatusChange: (order: Order, status: OrderStatus) => void;
  isHovered?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

/**
 * OrderRow displays a single order row with expand/collapse functionality
 * Enhanced with animations using Framer Motion
 */
const OrderRow: React.FC<OrderRowProps> = ({
  order,
  userRole,
  onView,
  onEdit,
  onDelete,
  onDuplicate,
  onInvoice,
  onStatusChange,
  isHovered,
  onMouseEnter,
  onMouseLeave,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Generate initials from client name
  const getInitials = (name: string): string => {
    if (!name) return '--';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Get avatar background color based on client name with expanded color palette
  const getAvatarColor = (name: string): string => {
    if (!name) return 'bg-orange-500 text-white';
    const colors = [
      'bg-orange-500 text-white',
      'bg-blue-500 text-white',
      'bg-green-500 text-white',
      'bg-purple-500 text-white',
      'bg-red-500 text-white',
      'bg-yellow-500 text-black',
      'bg-teal-500 text-white',
      'bg-indigo-500 text-white',
    ];
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  };

  return (
    <>
      <motion.tr
        className={cn(
          "hover:bg-table-hover transition-colors duration-150 cursor-pointer",
          isExpanded && "bg-table-hover"
        )}
        initial="initial"
        whileHover="hover"
        variants={tableRowHover}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        layout="position"
        onClick={() => onView(order)}
      >
        <td className="px-4 py-3 whitespace-nowrap">
          <div className="flex items-center space-x-2">
            <motion.button
              onClick={(e) => {
                e.stopPropagation(); // Prevent row click event
                setIsExpanded(!isExpanded);
              }}
              className="group inline-flex items-center text-sm text-table-header hover:text-white focus:outline-none"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              aria-expanded={isExpanded}
              aria-label={isExpanded ? "Collapse order details" : "Expand order details"}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-table-header group-hover:text-white" />
              ) : (
                <ChevronRight className="h-4 w-4 text-table-header group-hover:text-white" />
              )}
            </motion.button>
            <Avatar className={cn("h-8 w-8", getAvatarColor(order.client_name))}>
              <AvatarFallback>{getInitials(order.client_name)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <div className="text-sm font-medium text-white">{order.client_name}</div>
            </div>
          </div>
        </td>
        <td className="px-4 py-3 whitespace-nowrap">
          <div className="text-sm text-white">{order.client_type || 'Regular'}</div>
        </td>
        <td className="px-4 py-3 whitespace-nowrap">
          <div className="text-sm text-table-header">{order.date || 'N/A'}</div>
        </td>
        <td className="px-4 py-3 whitespace-nowrap">
          <StatusBadge status={order.status} />
        </td>
        <td className="px-4 py-3 whitespace-nowrap text-right">
          <div className="text-sm text-white">{formatCurrency(order.total_amount || 0)}</div>
        </td>
        <td className="px-4 py-3 whitespace-nowrap text-right">
          <div className="text-sm text-white">{formatCurrency(order.amount_paid || 0)}</div>
        </td>
        <td className="px-4 py-3 whitespace-nowrap text-right">
          <div className="text-sm text-white">{formatCurrency(order.balance || 0)}</div>
        </td>
        <td className="px-4 py-3 whitespace-nowrap text-right">
          <div className="w-full flex justify-end items-center space-x-2">
            <motion.button
              onClick={(e) => {
                e.stopPropagation(); // Prevent row click event
                onInvoice(order);
              }}
              className="inline-flex items-center px-2 py-1 text-xs rounded-md bg-brand hover:bg-brand/80 text-white"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Generate Invoice"
            >
              <FileText className="h-3 w-3 mr-1" />
              Invoice
            </motion.button>
            <OrderActions
              order={order}
              userRole={userRole}
              onView={onView}
              onEdit={onEdit}
              onDelete={onDelete}
              onDuplicate={onDuplicate}
              onInvoice={onInvoice}
              onStatusChange={onStatusChange}
            />
          </div>
        </td>
      </motion.tr>

      <AnimatePresence>
        {isExpanded && (
          <motion.tr
            className="bg-table-hover"
            initial="initial"
            animate="animate"
            exit="exit"
            variants={tableRowExpand}
            layout="position"
          >
            <td colSpan={8} className="px-4 py-4">
              <div className="space-y-4">
                {/* Order Items Table */}
                <div>
                  <h4 className="text-sm font-medium text-table-header mb-2">Order Items</h4>
                  <div className="border border-table-border rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-table-border table-fixed">
                      <thead className="bg-background">
                        <tr>
                          <th scope="col" className="w-1/3 px-4 py-2 text-left text-xs font-medium text-table-header">Item</th>
                          <th scope="col" className="w-1/5 px-4 py-2 text-left text-xs font-medium text-table-header">Category</th>
                          <th scope="col" className="w-1/6 px-4 py-2 text-center text-xs font-medium text-table-header">Quantity</th>
                          <th scope="col" className="w-1/6 px-4 py-2 text-right text-xs font-medium text-table-header">Unit Price</th>
                          <th scope="col" className="w-1/6 px-4 py-2 text-right text-xs font-medium text-table-header">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-table-border">
                        {console.log('Order items:', order.items) || (order.items && order.items.length > 0) ? (
                          order.items.map((item) => (
                            <tr key={item.id} className="hover:bg-table-hover">
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-white">{item.item_name}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-table-header">{item.category_name}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-white text-center">{item.quantity}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-white text-right">{formatCurrency(item.unit_price)}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-white text-right">{formatCurrency(item.total_amount)}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="px-4 py-2 text-sm text-table-header text-center">No items found</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Notes Section */}
                <div>
                  <h4 className="text-sm font-medium text-table-header mb-2">Notes</h4>
                  {console.log('Order notes:', order.notes) || (order.notes && order.notes.length > 0) ? (
                    <div className="space-y-2">
                      {order.notes.map((note) => (
                        <div
                          key={note.id}
                          className="border border-table-border rounded-lg p-3"
                        >
                          <div className="flex items-start space-x-2">
                            <div className="flex-1">
                              <p className="text-sm text-white">{note.text}</p>
                              <p className="text-xs text-brand mt-1">
                                {new Date(note.created_at).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="border border-table-border rounded-lg p-3 text-center">
                      <p className="text-sm text-table-header">No notes available</p>
                    </div>
                  )}
                </div>
              </div>
            </td>
          </motion.tr>
        )}
      </AnimatePresence>
    </>
  );
};

export default React.memo(OrderRow);