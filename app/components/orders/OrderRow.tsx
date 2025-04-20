import React, { useState } from 'react';
import { Order, OrderStatus } from '@/types/orders';
import StatusDropdown from './StatusDropdown';
import OrderActions from './OrderActions';
import { ChevronDown, ChevronRight, ShoppingBag, MessageSquare, Eye } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';


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
function OrderRow(props: OrderRowProps) {
  const {
  order,
  userRole,
  onView,
  onEdit,
  onDelete,
  onDuplicate,
  onInvoice,
  onStatusChange,
  onMouseEnter,
  onMouseLeave,
  } = props;
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
      <tr
        className={cn(
          "hover:bg-table-hover transition-colors duration-150 relative cursor-pointer",
          isExpanded && "bg-table-hover"
        )}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onClick={(e) => {
          // Only trigger if the click wasn't on an interactive element
          // Use a more comprehensive check for interactive elements
          const target = e.target as HTMLElement;
          const isInteractive = (
            // Check for dropdown elements
            target.closest('button, .interactive-element, [role="button"], a, input, select, textarea, [data-dropdown-trigger], [data-dropdown-content], [data-dropdown-item]') ||
            target.tagName.toLowerCase() === 'button' ||
            target.getAttribute('role') === 'button' ||
            target.classList.contains('interactive-element') ||
            // Check for any dropdown-related data attributes
            target.hasAttribute('data-dropdown-trigger') ||
            target.hasAttribute('data-dropdown-content') ||
            target.hasAttribute('data-dropdown-item') ||
            // Check for any parent with interactive-element class
            !!Array.from(target.parentElement?.querySelectorAll('.interactive-element') || []).length ||
            // Check if any dropdown is currently open
            !!document.querySelector('[data-dropdown-content]')
          );

          if (!isInteractive) {
            // Add a larger delay to ensure dropdowns have time to open if clicked
            // and to prevent accidental row clicks
            setTimeout(() => {
              onView(order);
            }, 200);
          }
        }}
      >
        <td className="px-2 py-3 whitespace-nowrap client-column">
          <div className="flex items-center space-x-3 w-full">
            <button
              onClick={(e) => {
                e.stopPropagation(); // Prevent row click event
                e.preventDefault(); // Prevent any default behavior
                setIsExpanded(!isExpanded);
              }}
              className="group inline-flex items-center text-sm text-table-header hover:text-white focus:outline-none interactive-element relative z-10 flex-shrink-0 dropdown-icon"
              aria-expanded={isExpanded}
              aria-label={isExpanded ? "Collapse order details" : "Expand order details"}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-table-header group-hover:text-white" />
              ) : (
                <ChevronRight className="h-4 w-4 text-table-header group-hover:text-white" />
              )}
            </button>
            <div className="relative">
              <Avatar className={cn("h-10 w-10 border-2 shadow-md",
                order.status === 'completed' ? 'border-green-500/50 bg-green-500/10' :
                order.status === 'in_progress' ? 'border-blue-500/50 bg-blue-500/10' :
                order.status === 'pending' ? 'border-amber-500/50 bg-amber-500/10' :
                order.status === 'delivered' ? 'border-purple-500/50 bg-purple-500/10' :
                order.status === 'cancelled' ? 'border-red-500/50 bg-red-500/10' :
                order.status === 'paused' ? 'border-gray-500/50 bg-gray-500/10' :
                `${getAvatarColor(order.client_name || 'Unknown')} ${getAvatarColor(order.client_name || 'Unknown').replace('bg-', 'border-')}`
              )}>
                <AvatarFallback className="text-sm font-medium">{getInitials(order.client_name || 'Unknown')}</AvatarFallback>
              </Avatar>
              <span className={cn("absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-background",
                order.status === 'completed' ? 'bg-green-500' :
                order.status === 'in_progress' ? 'bg-blue-500' :
                order.status === 'pending' ? 'bg-amber-500' :
                order.status === 'delivered' ? 'bg-purple-500' :
                order.status === 'cancelled' ? 'bg-red-500' :
                order.status === 'paused' ? 'bg-gray-500' : 'bg-green-500'
              )}></span>
            </div>
            <div>
              <div className="text-sm font-medium text-white max-w-[220px] line-clamp-1">{order.client_name}</div>
              <div className="text-xs text-muted-foreground flex items-center gap-1 max-w-[220px]">
                <span className="capitalize truncate">{order.client_type || 'Regular'}</span>
                <span className="text-muted-foreground/50 flex-shrink-0">•</span>
                <span className="font-medium text-primary truncate">{order.order_number || (order.id ? `#${order.id.substring(0, 8)}` : 'Unknown')}</span>
              </div>
            </div>
          </div>
        </td>

        <td className="date-column">
          <div className="text-sm text-white">
            {order.date ? new Date(order.date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            }) : 'N/A'}
          </div>
        </td>
        <td className="status-column">
          <StatusDropdown
            order={order}
            onStatusChange={onStatusChange}
            userRole={userRole}
          />
        </td>
        <td className="financial-column">
          <div className="text-sm text-white font-medium">{formatCurrency(order.total_amount || 0)}</div>
        </td>
        <td className="financial-column">
          <div className="text-sm text-white">{formatCurrency(order.amount_paid || 0)}</div>
        </td>
        <td className="financial-column">
          <div className="text-sm text-white font-medium">{formatCurrency(order.balance || 0)}</div>
        </td>
        <td className="actions-column">
          <div className="w-full flex justify-end items-center space-x-1">
            <button
              onClick={(e) => {
                e.stopPropagation(); // Prevent row click event
                e.preventDefault(); // Prevent any default behavior

                // Add a small delay to ensure the action completes properly
                setTimeout(() => {
                  onView(order);
                }, 50);
              }}
              className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded-md interactive-element relative z-10 shadow-sm bg-blue-600 hover:bg-blue-700 text-white"
              aria-label="View Order"
              title="View Order"
            >
              <Eye className="h-3.5 w-3.5 mr-1.5" />
              View
            </button>
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
      </tr>

      {isExpanded && (
        <tr
          className="bg-table-hover w-full border-t border-b border-[hsl(var(--table-border))] order-subrow"
        >
          <td colSpan={7} className="p-4 w-full">
            <div className="space-y-5 w-full overflow-x-auto">
              {/* Order Items Table */}
              <div>
                <h4 className="text-sm font-medium text-white mb-2 flex items-center gap-1.5">
                  <ShoppingBag className="h-4 w-4 text-primary" />
                  Order Items
                </h4>
                <div className="border border-table-border rounded-lg overflow-hidden w-full shadow-sm">
                  <table className="w-full divide-y divide-table-border table-fixed">
                    <thead className="bg-[hsl(var(--table-header-bg))]">
                      <tr>
                        <th scope="col" className="w-1/3 px-4 py-2 text-left text-xs font-medium text-white">Item</th>
                        <th scope="col" className="w-1/5 px-4 py-2 text-left text-xs font-medium text-white">Category</th>
                        <th scope="col" className="w-1/6 px-4 py-2 text-center text-xs font-medium text-white">Quantity</th>
                        <th scope="col" className="w-1/6 px-4 py-2 text-right text-xs font-medium text-white">Unit Price</th>
                        <th scope="col" className="w-1/6 px-4 py-2 text-right text-xs font-medium text-white">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-table-border">
                      {(order.items && order.items.length > 0) ? (
                        order.items.map((item) => (
                          <tr key={item.id} className="hover:bg-table-hover">
                            <td className="px-4 py-2.5 whitespace-nowrap text-sm text-white">{item.item_name}</td>
                            <td className="px-4 py-2.5 whitespace-nowrap text-sm text-muted-foreground">{item.category_name}</td>
                            <td className="px-4 py-2.5 whitespace-nowrap text-sm text-white text-center">{item.quantity}</td>
                            <td className="px-4 py-2.5 whitespace-nowrap text-sm text-white text-right">{formatCurrency(item.unit_price)}</td>
                            <td className="px-4 py-2.5 whitespace-nowrap text-sm text-white text-right font-medium">{formatCurrency(item.total_amount)}</td>
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
              <div className="w-full">
                <h4 className="text-sm font-medium text-white mb-2 flex items-center gap-1.5">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  Notes
                </h4>
                {(order.notes && order.notes.length > 0) ? (
                  <div className="space-y-2 w-full">
                    {order.notes.map((note) => (
                      <div
                        key={note.id}
                        className="border border-table-border rounded-lg p-4 w-full bg-muted/10 hover:bg-muted/20 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                            <MessageSquare className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-xs font-medium text-muted-foreground">
                                {note.type || 'General Note'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(note.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <p className="text-sm text-white">{note.text}</p>
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
          </tr>
        )}
    </>
  );
}

export default OrderRow;