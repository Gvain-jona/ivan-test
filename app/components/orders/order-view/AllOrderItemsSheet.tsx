import React, { useState } from 'react';
import { formatCurrency } from '@/lib/utils';
import { OrderItem } from '@/types/orders';
import { Package, Tag, Hash, DollarSign, Pencil, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import OrderSheet from '@/components/ui/sheets/OrderSheet';
import { ItemEditForm } from './ItemEditForm';

interface AllOrderItemsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: OrderItem[];
  canEdit?: boolean;
  onEditItem?: (item: OrderItem) => void;
  onDeleteItem?: (itemId: string) => void;
  loadingStates?: {
    editItem?: string | null;
    deleteItem?: string | null;
  };
  orderNumber?: string;
}

/**
 * Sheet component to display all order items
 */
const AllOrderItemsSheet: React.FC<AllOrderItemsSheetProps> = ({
  open,
  onOpenChange,
  items,
  canEdit = false,
  onEditItem,
  onDeleteItem,
  loadingStates = {},
  orderNumber,
}) => {
  // State for tracking which item is being edited
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

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

  return (
    <OrderSheet
      open={open}
      onOpenChange={onOpenChange}
      title={`All Order Items${orderNumber ? ` for Order ${orderNumber}` : ''}`}
      description={`Viewing all ${items.length} items in this order`}
      size="lg"
    >
      <div className="p-6">
        <div className="space-y-4">
          {items.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 w-full">
              {items.map((item: OrderItem) => (
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
          ) : (
            <div className="border border-border/40 bg-popover backdrop-blur-md rounded-xl p-4 text-center shadow-sm">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500/10 to-orange-600/5 rounded-full flex items-center justify-center shadow-sm ring-1 ring-orange-500/20 mx-auto mb-2">
                <Package className="h-5 w-5 text-orange-500/70" strokeWidth={1.5} />
              </div>
              <p className="text-sm text-muted-foreground">No items found</p>
            </div>
          )}
        </div>
      </div>
    </OrderSheet>
  );
};

export default AllOrderItemsSheet;
