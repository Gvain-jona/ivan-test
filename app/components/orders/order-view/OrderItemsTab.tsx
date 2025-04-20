import React, { useState } from 'react';
import { formatCurrency } from '@/lib/utils';
import { OrderItemsTabProps } from './types';
import { OrderItem } from '@/types/orders';
import { Package, Tag, Hash, DollarSign, Pencil, Trash2, Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ItemEditForm } from './ItemEditForm';
import { ItemForm } from './ItemForm';
import AllOrderItemsSheet from './AllOrderItemsSheet';


/**
 * OrderItemsTab displays the order items in cards with icons
 */
const OrderItemsTab: React.FC<OrderItemsTabProps> = ({
  order,
  canEdit = false,
  onAddItem,
  onEditItem,
  onDeleteItem,
  loadingStates = {},
  onAddItemClick
}) => {
  // State for tracking which item is being edited
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // State for showing the add item form
  const [showAddItemForm, setShowAddItemForm] = useState(false);

  // State for the all items sheet
  const [showAllItemsSheet, setShowAllItemsSheet] = useState(false);

  // Determine if we should show all items or just a limited number
  const hasMoreItems = order.items?.length > 3;
  const displayedItems = hasMoreItems ? order.items.slice(0, 3) : order.items;

  // Handle edit button click
  const handleEditClick = (item: OrderItem) => {
    setEditingItemId(item.id);
  };

  // Handle save edited item
  const handleSaveItem = (updatedItem: OrderItem) => {
    if (onEditItem) {
      onEditItem(updatedItem);
      setEditingItemId(null);
    }
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingItemId(null);
  };

  // Handle delete button click
  const handleDeleteItem = (itemId: string) => {
    if (onDeleteItem) {
      onDeleteItem(itemId);
    }
  };

  // Handle add item button click
  const handleAddItemClick = () => {
    if (onAddItemClick) {
      onAddItemClick(order.id);
    } else {
      setShowAddItemForm(true);
    }
  };

  // Handle item form submission
  const handleItemSubmit = (newItem: Partial<OrderItem>) => {
    if (onAddItem) {
      onAddItem(newItem);
      setShowAddItemForm(false);
    }
  };

  // Handle item form cancel
  const handleItemFormCancel = () => {
    setShowAddItemForm(false);
  };

  // Handle view all items button click
  const handleViewAllItems = () => {
    setShowAllItemsSheet(true);
  };

  return (
      <div className="space-y-4">
        {showAddItemForm ? (
          <ItemForm
            onSubmit={handleItemSubmit}
            onCancel={handleItemFormCancel}
            orderId={order.id}
          />
        ) : (
          <div className="mb-4">
            <Button
              onClick={handleAddItemClick}
              variant="outline"
              className="border-border/40 bg-popover backdrop-blur-md rounded-xl hover:bg-popover/90 text-muted-foreground hover:text-foreground shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              disabled={loadingStates.addItem}
            >
              {loadingStates.addItem ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding Item...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Item
                </>
              )}
            </Button>
          </div>
        )}

        {order.items?.length ? (
          <>
            <div className="grid grid-cols-1 gap-4 w-full">
              {displayedItems.map((item: OrderItem) => (
                <div
                  key={item.id}
                  className={`border ${editingItemId === item.id ? 'border-primary/30' : 'border-border/40'} bg-popover backdrop-blur-md rounded-xl p-3 transition-all duration-200 shadow-sm ${editingItemId !== item.id ? 'hover:shadow-md hover:-translate-y-1 hover:bg-popover/90 relative after:absolute after:inset-x-0 after:bottom-0 after:h-1 after:bg-orange-500/20 after:rounded-b-xl after:opacity-0 hover:after:opacity-100 after:transition-opacity' : ''}`}
                >
                  {editingItemId === item.id ? (
                    <ItemEditForm
                      item={item}
                      onSave={handleSaveItem}
                      onCancel={handleCancelEdit}
                    />
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-orange-500/10 to-orange-600/5 rounded-lg flex items-center justify-center shadow-sm ring-1 ring-orange-500/20">
                          <Package className="h-4 w-4 text-orange-500" strokeWidth={1.5} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium truncate">{item.item_name}</h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <div className="flex items-center">
                              <Tag className="h-3 w-3 text-muted-foreground mr-1" />
                              <span className="text-xs text-muted-foreground truncate">{item.category_name}</span>
                            </div>
                            {item.size && (
                              <div className="flex items-center">
                                <span className={`text-xs px-1.5 py-0.5 ${loadingStates.editItem === item.id ? 'bg-primary/10 text-primary animate-pulse' : 'bg-orange-500/10 text-orange-500'} rounded-sm flex items-center gap-1`}>
                                  {loadingStates.editItem === item.id && <Loader2 className="h-2.5 w-2.5 animate-spin" />}
                                  {item.size}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`text-sm font-medium ${loadingStates.editItem === item.id ? 'text-primary animate-pulse' : 'text-orange-500'}`}>
                            {loadingStates.editItem === item.id && <Loader2 className="h-3 w-3 inline mr-1 animate-spin" />}
                            {formatCurrency(item.total_amount)}
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center mt-2 pt-2 border-t border-border/30">
                        <div className="grid grid-cols-2 gap-2 flex-1">
                          <div className="flex items-center gap-1.5">
                            <div className="flex items-center">
                              <Hash className="h-3 w-3 text-muted-foreground mr-1" />
                              <span className="text-xs text-muted-foreground">Quantity:</span>
                            </div>
                            <span className={`text-xs font-medium ml-1 ${loadingStates.editItem === item.id ? 'text-primary animate-pulse' : ''}`}>{item.quantity}</span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <div className="flex items-center">
                              <DollarSign className="h-3 w-3 text-muted-foreground mr-1" />
                              <span className="text-xs text-muted-foreground">Unit Price:</span>
                            </div>
                            <span className={`text-xs font-medium ml-1 ${loadingStates.editItem === item.id ? 'text-primary animate-pulse' : ''}`}>{formatCurrency(item.unit_price)}</span>
                          </div>
                        </div>

                        {canEdit && (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 p-0 hover:bg-muted/50 text-muted-foreground hover:text-primary"
                              onClick={() => handleEditClick(item)}
                              disabled={loadingStates.editItem === item.id || loadingStates.deleteItem === item.id}
                            >
                              {loadingStates.editItem === item.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Pencil className="h-3.5 w-3.5" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 p-0 hover:bg-muted/50 text-muted-foreground hover:text-destructive"
                              onClick={() => handleDeleteItem(item.id)}
                              disabled={loadingStates.editItem === item.id || loadingStates.deleteItem === item.id}
                            >
                              {loadingStates.deleteItem === item.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            {hasMoreItems && (
              <div className="mt-4">
                <button
                  className="w-full py-2 px-4 border border-border/40 bg-popover backdrop-blur-md rounded-xl text-sm text-muted-foreground hover:bg-popover/90 transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5"
                  onClick={handleViewAllItems}
                >
                  View All {order.items.length} Items
                </button>
              </div>
            )}

            {/* Sheet for viewing all items */}
            <AllOrderItemsSheet
              open={showAllItemsSheet}
              onOpenChange={setShowAllItemsSheet}
              items={order.items || []}
              canEdit={canEdit}
              onEditItem={onEditItem}
              onDeleteItem={onDeleteItem}
              loadingStates={loadingStates}
              orderNumber={order.order_number}
            />

            {/* Subtotal section removed as requested */}
          </>
        ) : (
          <div className="border border-border/40 bg-popover backdrop-blur-md rounded-xl p-4 text-center shadow-sm">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500/10 to-orange-600/5 rounded-full flex items-center justify-center shadow-sm ring-1 ring-orange-500/20 mx-auto mb-2">
              <Package className="h-5 w-5 text-orange-500/70" strokeWidth={1.5} />
            </div>
            <p className="text-sm text-muted-foreground">No items found</p>
            <Button
              onClick={handleAddItemClick}
              variant="outline"
              className="mt-3 border-border/40 bg-popover backdrop-blur-md rounded-xl hover:bg-popover/90 text-muted-foreground hover:text-foreground shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add First Item
            </Button>
          </div>
        )}
      </div>
  );
};

// Memoize the component to prevent unnecessary re-renders
export default React.memo(OrderItemsTab);
