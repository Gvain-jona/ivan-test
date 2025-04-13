import React from 'react';
import { formatCurrency } from '@/lib/utils';
import { OrderItemsTabProps } from './types';
import { OrderItem } from '@/types/orders';
import { Package, Tag, Hash, DollarSign, Calculator } from 'lucide-react';

/**
 * OrderItemsTab displays the order items in cards with icons
 */
const OrderItemsTab: React.FC<OrderItemsTabProps> = ({ order }) => {
  // Determine if we should show all items or just a limited number
  const hasMoreItems = order.items?.length > 3;
  const displayedItems = hasMoreItems ? order.items.slice(0, 3) : order.items;

  return (
      <div className="space-y-4">
        {order.items?.length ? (
          <>
            <div className="grid grid-cols-1 gap-4 w-full">
              {displayedItems.map((item: OrderItem) => (
                <div
                  key={item.id}
                  className="border border-[#2B2B40] rounded-lg p-4 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-[#1E1E2D] rounded-md">
                      <Package className="h-5 w-5 text-orange-500" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-white">{item.item_name}</h4>
                      <div className="flex items-center mt-1">
                        <Tag className="h-3 w-3 text-[#6D6D80] mr-1" />
                        <span className="text-xs text-[#6D6D80]">{item.category_name}</span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 mt-3">
                        <div className="flex flex-col">
                          <div className="flex items-center">
                            <Hash className="h-3 w-3 text-[#6D6D80] mr-1" />
                            <span className="text-xs text-[#6D6D80]">Quantity</span>
                          </div>
                          <span className="text-sm font-medium">{item.quantity}</span>
                        </div>

                        <div className="flex flex-col">
                          <div className="flex items-center">
                            <DollarSign className="h-3 w-3 text-[#6D6D80] mr-1" />
                            <span className="text-xs text-[#6D6D80]">Unit Price</span>
                          </div>
                          <span className="text-sm font-medium">{formatCurrency(item.unit_price)}</span>
                        </div>

                        <div className="flex flex-col">
                          <div className="flex items-center">
                            <Calculator className="h-3 w-3 text-[#6D6D80] mr-1" />
                            <span className="text-xs text-[#6D6D80]">Total</span>
                          </div>
                          <span className="text-sm font-medium text-orange-500">{formatCurrency(item.total_amount)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {hasMoreItems && (
              <div className="mt-4">
                <button
                  className="w-full py-2 px-4 border border-[#2B2B40] rounded-md text-sm text-[#6D6D80] hover:bg-white/[0.02] transition-colors"
                  onClick={() => window.alert(`View all ${order.items.length} items`)}
                >
                  View All {order.items.length} Items
                </button>
              </div>
            )}

            <div className="border-t border-[#2B2B40] pt-4 mt-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-[#6D6D80]">Subtotal</span>
                <span className="text-lg font-semibold text-white">{formatCurrency(order.total_amount)}</span>
              </div>
            </div>
          </>
        ) : (
          <div className="border border-[#2B2B40] rounded-lg p-6 text-center">
            <Package className="h-8 w-8 text-[#6D6D80] mx-auto mb-2" />
            <p className="text-sm text-[#6D6D80]">No items found</p>
          </div>
        )}
      </div>
  );
};

export default OrderItemsTab;
