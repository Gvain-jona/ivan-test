import React, { useState } from 'react';
import StatusDropdown from './StatusDropdown';
import OrderActions from './OrderActions';
import { ChevronDown, ChevronRight, ShoppingBag, MessageSquare, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFormatCurrency } from '@/hooks/organization/useFormatCurrency';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useOrder } from '@/hooks/orders/useOrders';
import type { OrderSummary } from '@/hooks/orders/useOrders';
import { useNotes } from '@/hooks/notes/useNotes';
import { OPTION_COLORS, OPTION_COLOR_NAMES } from '@/lib/fields/colors';

/**
 * Status tints for the client avatar and its corner dot, from the shared
 * option palette so they hold in light and dark. The hues match the
 * --status-* tokens for the same stages.
 */
type OrderStatusKey = 'completed' | 'in_progress' | 'pending' | 'delivered' | 'cancelled';

const STATUS_TINT: Record<OrderStatusKey, string> = {
  completed: OPTION_COLORS.green.chip,
  in_progress: OPTION_COLORS.blue.chip,
  pending: OPTION_COLORS.amber.chip,
  delivered: OPTION_COLORS.violet.chip,
  cancelled: OPTION_COLORS.red.chip,
};

const STATUS_DOT: Record<OrderStatusKey, string> = {
  completed: OPTION_COLORS.green.dot,
  in_progress: OPTION_COLORS.blue.dot,
  pending: OPTION_COLORS.amber.dot,
  delivered: OPTION_COLORS.violet.dot,
  cancelled: OPTION_COLORS.red.dot,
};

interface OrderRowProps {
  order: OrderSummary;
  userRole: 'admin' | 'manager' | 'employee';
  onView: (order: OrderSummary) => void;
  onDelete: (order: OrderSummary) => void;
  onStatusChange: (order: OrderSummary, status: string) => void;
  isHovered?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

/**
 * OrderRow displays a single order row with expand/collapse details.
 * Expansion lazily fetches the order detail (items) and notes — the
 * list payload stays light and the expanded data is always fresh.
 */
function OrderRow(props: OrderRowProps) {
  const fmt = useFormatCurrency();
  const {
    order,
    userRole,
    onView,
    onDelete,
    onStatusChange,
    onMouseEnter,
    onMouseLeave,
  } = props;
  const [isExpanded, setIsExpanded] = useState(false);

  const clientName = order.clients?.name ?? 'Unknown';

  // Lazy: both hooks pause (null key) until the row is expanded
  const { order: detail, isLoading: detailLoading } = useOrder(isExpanded ? order.id : null);
  const { notes } = useNotes('order', isExpanded ? order.id : null);

  const getInitials = (name: string): string => {
    if (!name) return '--';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  /**
   * Deterministic avatar tint from the client's name. Uses the shared option
   * palette, whose chip pairs are contrast-verified in both themes — the
   * previous list was saturated *-500 fills with hardcoded white (and one
   * black) text, none of which survives a light background.
   */
  const getAvatarColor = (name: string): string => {
    const palette = OPTION_COLOR_NAMES;
    if (!name) return OPTION_COLORS[palette[0]].chip;
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return OPTION_COLORS[palette[index % palette.length]].chip;
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
          const target = e.target as HTMLElement;
          const isInteractive = !!target.closest(
            'button, .interactive-element, [role="button"], a, input, select, textarea, [data-dropdown-trigger], [data-dropdown-content], [data-dropdown-item]'
          );

          if (!isInteractive) {
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
                e.stopPropagation();
                e.preventDefault();
                setIsExpanded(!isExpanded);
              }}
              className="group inline-flex items-center text-sm text-table-header hover:text-foreground focus:outline-none interactive-element relative z-10 flex-shrink-0 dropdown-icon"
              aria-expanded={isExpanded}
              aria-label={isExpanded ? "Collapse order details" : "Expand order details"}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-table-header group-hover:text-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-table-header group-hover:text-foreground" />
              )}
            </button>
            <div className="relative">
              <Avatar
                className={cn(
                  'h-10 w-10 border-2 border-border shadow-md',
                  STATUS_TINT[order.status as OrderStatusKey] ?? getAvatarColor(clientName),
                )}
              >
                <AvatarFallback className="bg-transparent text-sm font-medium">
                  {getInitials(clientName)}
                </AvatarFallback>
              </Avatar>
              <span
                className={cn(
                  'absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-background',
                  STATUS_DOT[order.status as OrderStatusKey] ?? OPTION_COLORS.green.dot,
                )}
              ></span>
            </div>
            <div>
              <div className="text-sm font-medium text-foreground max-w-[220px] line-clamp-1">{clientName}</div>
              <div className="text-xs text-muted-foreground flex items-center gap-1 max-w-[220px]">
                <span className="font-medium text-primary truncate">{order.order_number || (order.id ? `#${order.id.substring(0, 8)}` : 'Unknown')}</span>
              </div>
            </div>
          </div>
        </td>

        <td className="date-column">
          <div className="text-sm text-foreground">
            {order.order_date ? new Date(order.order_date).toLocaleDateString('en-US', {
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
          <div className="text-sm text-foreground font-medium">{fmt(order.total_amount || 0)}</div>
        </td>
        <td className="financial-column">
          <div className="text-sm text-foreground">{fmt(order.amount_paid || 0)}</div>
        </td>
        <td className="financial-column">
          <div className="text-sm text-foreground font-medium">{fmt(order.balance || 0)}</div>
        </td>
        <td className="actions-column">
          <div className="w-full flex justify-end items-center space-x-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setTimeout(() => {
                  onView(order);
                }, 50);
              }}
              className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded-md interactive-element relative z-10 shadow-sm bg-primary hover:bg-primary/90 text-primary-foreground"
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
              onDelete={async (o) => { onDelete(o); return true; }}
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
                <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-1.5">
                  <ShoppingBag className="h-4 w-4 text-primary" />
                  Order Items
                </h4>
                <div className="border border-table-border rounded-lg overflow-hidden w-full shadow-sm">
                  <table className="w-full divide-y divide-table-border table-fixed">
                    <thead className="bg-[hsl(var(--table-header-bg))]">
                      <tr>
                        <th scope="col" className="w-2/5 px-4 py-2 text-left text-xs font-medium text-foreground">Item</th>
                        <th scope="col" className="w-1/5 px-4 py-2 text-center text-xs font-medium text-foreground">Quantity</th>
                        <th scope="col" className="w-1/5 px-4 py-2 text-right text-xs font-medium text-foreground">Unit Price</th>
                        <th scope="col" className="w-1/5 px-4 py-2 text-right text-xs font-medium text-foreground">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-table-border">
                      {detailLoading ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-2 text-sm text-table-header text-center">Loading…</td>
                        </tr>
                      ) : detail?.order_items?.length ? (
                        detail.order_items.map((item) => (
                          <tr key={item.id} className="hover:bg-table-hover">
                            <td className="px-4 py-2.5 whitespace-nowrap text-sm text-foreground">{item.product_name_raw ?? '—'}</td>
                            <td className="px-4 py-2.5 whitespace-nowrap text-sm text-foreground text-center">{item.quantity}</td>
                            <td className="px-4 py-2.5 whitespace-nowrap text-sm text-foreground text-right">{fmt(item.unit_price)}</td>
                            <td className="px-4 py-2.5 whitespace-nowrap text-sm text-foreground text-right font-medium">{fmt(item.total_amount)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-4 py-2 text-sm text-table-header text-center">No items found</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Notes Section */}
              <div className="w-full">
                <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-1.5">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  Notes
                </h4>
                {notes.length > 0 ? (
                  <div className="space-y-2 w-full">
                    {notes.map((note) => (
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
                              <p className="text-xs text-muted-foreground">
                                {new Date(note.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <p className="text-sm text-foreground">{note.content}</p>
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
