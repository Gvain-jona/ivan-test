import React, { useState, useCallback, useMemo } from 'react';
import { Plus, Loader2, AlertCircle, Package, ChevronRight, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { Order, OrderItem } from '@/types/orders';
// ItemForm import removed - will be used in a separate component
import { ItemEditForm } from './ItemEditForm';
import { AllOrderItemsSheet } from './AllOrderItemsSheet';
import { useOrderUpdates } from './hooks/useOrderUpdates.enhanced';

interface OrderItemsTabProps {
  order: Order | null;
  onEdit: (order: Order) => Promise<any>;
  refreshOrder: (optimisticData?: any, shouldRevalidate?: boolean) => Promise<any>;
  isLoading?: boolean;
  isError?: boolean;
  onAddItemClick?: (orderId: string) => void; // New prop for handling add item clicks
}

export const OrderItemsTab: React.FC<OrderItemsTabProps> = ({
  order,
  onEdit,
  refreshOrder,
  isLoading = false,
  isError = false,
  onAddItemClick
}) => {
  // State for editing and viewing items
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [showAllItems, setShowAllItems] = useState(false);

  // Use our enhanced order updates hook
  const {
    loadingStates,
    isLoading: isOperationLoading,
    getLoadingMessage,
    getProgress,
    handleAddItem,
    handleEditItem,
    handleDeleteItem
  } = useOrderUpdates({ order, onEdit, refreshOrder });

  // Get the items to display (limited to 3 for the main view)
  const displayItems = useMemo(() => {
    if (!order?.items?.length) return [];
    return order.items.slice(0, 3);
  }, [order?.items]);

  // Check if we have more than 3 items
  const hasMoreItems = useMemo(() => {
    return order?.items?.length > 3;
  }, [order?.items?.length]);

  // Adding items will be handled by a separate component

  // Handle editing an item
  const handleEditItemSubmit = useCallback(async (updatedItem: OrderItem) => {
    await handleEditItem(updatedItem);
    setEditingItemId(null);
  }, [handleEditItem]);

  // Handle deleting an item
  const handleDeleteItemClick = useCallback(async (itemId: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      await handleDeleteItem(itemId);
    }
  }, [handleDeleteItem]);

  // Get the item being edited
  const itemBeingEdited = useMemo(() => {
    if (!editingItemId || !order?.items) return null;
    return order.items.find(item => item.id === editingItemId) || null;
  }, [editingItemId, order?.items]);

  // Calculate total items and total cost
  const { totalItems, totalCost } = useMemo(() => {
    if (!order?.items?.length) return { totalItems: 0, totalCost: 0 };

    return order.items.reduce((acc, item) => {
      return {
        totalItems: acc.totalItems + (item.quantity || 0),
        totalCost: acc.totalCost + (item.total_amount || 0)
      };
    }, { totalItems: 0, totalCost: 0 });
  }, [order?.items]);

  return (
    <div className="space-y-4">
      {/* Header with item count and add button */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Order Items</h3>
          {order?.items?.length > 0 && (
            <Badge variant="outline" className="bg-background">
              {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
            </Badge>
          )}
        </div>
        <Button
          onClick={() => onAddItemClick ? onAddItemClick(order?.id || '') : null}
          variant="outline"
          className="border-border/40 bg-popover backdrop-blur-md rounded-xl hover:bg-popover/90 text-muted-foreground hover:text-foreground shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
          disabled={isLoading || !order?.id}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Item
        </Button>
      </div>

      {/* Add item form removed - will be handled by a separate component */}

      {/* Item cards */}
      <div className="space-y-3">
        {/* Only show loading state if we don't have any items data yet */}
        {isLoading && (!order?.items || order.items.length === 0) ? (
          <div className="border border-border/40 bg-popover backdrop-blur-md rounded-xl p-4 text-center shadow-sm">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500/10 to-orange-600/5 rounded-full flex items-center justify-center shadow-sm ring-1 ring-orange-500/20 mx-auto mb-2">
              <Loader2 className="h-5 w-5 text-orange-500/70 animate-spin" strokeWidth={1.5} />
            </div>
            <p className="text-sm text-muted-foreground">Loading order items...</p>
          </div>
        ) : isError && (!order?.items || order.items.length === 0) ? (
          <div className="border border-destructive/20 bg-popover backdrop-blur-md rounded-xl p-4 text-center shadow-sm">
            <div className="w-10 h-10 bg-gradient-to-br from-destructive/10 to-destructive/5 rounded-full flex items-center justify-center shadow-sm ring-1 ring-destructive/20 mx-auto mb-2">
              <AlertCircle className="h-5 w-5 text-destructive/70" strokeWidth={1.5} />
            </div>
            <p className="text-sm text-muted-foreground">Failed to load order items</p>
          </div>
        ) : order?.items && order.items.length > 0 ? (
          <>
            {displayItems.map((item) => (
              <div
                key={item.id}
                className={`relative border border-border/40 bg-popover backdrop-blur-md rounded-xl p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:translate-y-[-2px] ${
                  isOperationLoading('editItem') && loadingStates.editItem.entityId === item.id
                    ? 'opacity-70 pointer-events-none'
                    : isOperationLoading('deleteItem') && loadingStates.deleteItem.entityId === item.id
                    ? 'opacity-70 pointer-events-none'
                    : ''
                }`}
              >
                {/* Loading overlay for edit/delete operations */}
                {((isOperationLoading('editItem') && loadingStates.editItem.entityId === item.id) ||
                  (isOperationLoading('deleteItem') && loadingStates.deleteItem.entityId === item.id)) && (
                  <div className="absolute inset-0 bg-background/50 backdrop-blur-sm rounded-xl flex items-center justify-center z-10">
                    <div className="flex flex-col items-center">
                      <Loader2 className="h-6 w-6 text-primary animate-spin mb-2" />
                      <p className="text-sm font-medium">
                        {isOperationLoading('editItem')
                          ? getLoadingMessage('editItem') || 'Updating item...'
                          : getLoadingMessage('deleteItem') || 'Deleting item...'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Item content */}
                <div className="flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium text-base">{item.item_name}</h4>
                      <p className="text-sm text-muted-foreground">{item.category_name}</p>
                    </div>
                    <Badge variant="outline" className="bg-white/80 text-foreground">
                      {item.size}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Quantity</p>
                      <p className="font-medium">{item.quantity}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Unit Price</p>
                      <p className="font-medium">{formatCurrency(item.unit_price)}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-border/30">
                    <div>
                      <p className="text-xs text-muted-foreground">Total</p>
                      <p className="font-semibold text-orange-500">
                        {formatCurrency(item.total_amount)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2"
                        onClick={() => setEditingItemId(item.id)}
                        disabled={isOperationLoading('editItem') || isOperationLoading('deleteItem')}
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteItemClick(item.id)}
                        disabled={isOperationLoading('editItem') || isOperationLoading('deleteItem')}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* View all items button */}
            {hasMoreItems && (
              <Button
                variant="outline"
                className="w-full mt-2 border-dashed"
                onClick={() => setShowAllItems(true)}
              >
                <Package className="h-4 w-4 mr-2" />
                View All Items ({order.items.length})
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </>
        ) : (
          <div className="border border-border/40 bg-popover backdrop-blur-md rounded-xl p-4 text-center shadow-sm">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500/10 to-orange-600/5 rounded-full flex items-center justify-center shadow-sm ring-1 ring-orange-500/20 mx-auto mb-2">
              <Package className="h-5 w-5 text-orange-500/70" strokeWidth={1.5} />
            </div>
            <p className="text-sm text-muted-foreground">No items added to this order yet</p>
            <Button
              onClick={() => onAddItemClick ? onAddItemClick(order?.id || '') : null}
              variant="outline"
              className="mt-3 border-border/40 bg-popover backdrop-blur-md rounded-xl hover:bg-popover/90 text-muted-foreground hover:text-foreground shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              disabled={!order?.id}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add First Item
            </Button>
          </div>
        )}
      </div>

      {/* Order summary */}
      {order?.items && order.items.length > 0 && (
        <div className="mt-4 p-4 bg-muted/20 rounded-xl border border-border/30">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Total Items</p>
              <p className="font-semibold">{totalItems} items across {order.items.length} entries</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Cost</p>
              <p className="font-semibold text-lg text-orange-500">{formatCurrency(totalCost)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Edit item form */}
      {editingItemId && itemBeingEdited && (
        <ItemEditForm
          item={itemBeingEdited}
          onSubmit={handleEditItemSubmit}
          onCancel={() => setEditingItemId(null)}
          isLoading={isOperationLoading('editItem')}
        />
      )}

      {/* All items sheet */}
      <AllOrderItemsSheet
        open={showAllItems}
        onClose={() => setShowAllItems(false)}
        items={order?.items || []}
        onEdit={setEditingItemId}
        onDelete={handleDeleteItemClick}
        loadingStates={{
          editItem: loadingStates.editItem,
          deleteItem: loadingStates.deleteItem
        }}
      />
    </div>
  );
};
