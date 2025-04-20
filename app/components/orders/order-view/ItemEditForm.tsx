import React, { useState } from 'react';
import { OrderItem } from '@/types/orders';
import { X, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { formatCurrency } from '@/lib/utils';

/**
 * ItemEditForm component for inline editing of order items
 */
export interface ItemEditFormProps {
  item: OrderItem;
  onSave: (updatedItem: OrderItem) => void;
  onCancel: () => void;
}

export const ItemEditForm: React.FC<ItemEditFormProps> = ({ item, onSave, onCancel }) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    // Preserve the original IDs
    item_id: item.item_id,
    category_id: item.category_id,
    // Display names
    category_name: item.category_name || '',
    item_name: item.item_name || '',
    size: item.size || 'Default', // Provide a default value since it's required
    quantity: item.quantity || 1,
    unit_price: item.unit_price || 0,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quantity' || name === 'unit_price' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Prepare data for batch processing
      const updates = {
        categoryName: formData.category_name.trim(),
        itemName: formData.item_name.trim(),
        size: formData.size || 'Default',
        quantity: formData.quantity,
        unit_price: formData.unit_price,
        categoryId: formData.category_id,
        itemId: formData.item_id,
        needsCategoryUpdate: formData.category_name.trim() !== item.category_name,
        needsItemUpdate: formData.item_name.trim() !== item.item_name
      };

      // Calculate the total amount
      const total_amount = updates.quantity * updates.unit_price;

      // Create the updated item with current values
      const updatedItem = {
        ...item,
        // Preserve the original order_id
        order_id: item.order_id,
        // Update with form data
        item_name: updates.itemName,
        category_name: updates.categoryName,
        size: updates.size,
        quantity: updates.quantity,
        unit_price: updates.unit_price,
        // Ensure these fields are explicitly set
        item_id: updates.itemId,
        category_id: updates.categoryId,
        // Set the calculated total amount
        total_amount
      };

      // Pass the updated item to the parent component
      // The parent component will handle the API calls and database updates
      onSave(updatedItem);

      // Don't set isSubmitting to false here - let the parent component handle it
      // The parent will show its own loading state
    } catch (error) {
      console.error('Error preparing item update:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to update item',
        variant: "destructive"
      });
      setIsSubmitting(false);
    }
  };

  // Check if form is complete
  const isFormComplete =
    formData.category_name.trim() !== '' &&
    formData.item_name.trim() !== '' &&
    formData.size.trim() !== '' &&
    formData.quantity > 0 &&
    formData.unit_price >= 0;

  return (
    <div className="bg-background/95 backdrop-blur-sm border border-border rounded-md shadow-sm">
      <div className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="category_name" className="text-xs font-medium">Category</Label>
              <Input
                id="category_name"
                name="category_name"
                value={formData.category_name}
                onChange={handleChange}
                className="h-8 text-sm"
                placeholder="Enter category name"
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <Label htmlFor="item_name" className="text-xs font-medium">Item</Label>
              <Input
                id="item_name"
                name="item_name"
                value={formData.item_name}
                onChange={handleChange}
                className="h-8 text-sm"
                placeholder="Enter item name"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label htmlFor="size" className="text-xs font-medium">Size</Label>
              <Input
                id="size"
                name="size"
                value={formData.size}
                onChange={handleChange}
                className="h-8 text-sm"
                placeholder="Enter size"
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <Label htmlFor="quantity" className="text-xs font-medium">Quantity</Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                min="1"
                step="1"
                value={formData.quantity}
                onChange={handleChange}
                className="h-8 text-sm"
                required
              />
            </div>

            <div>
              <Label htmlFor="unit_price" className="text-xs font-medium">Unit Price</Label>
              <Input
                id="unit_price"
                name="unit_price"
                type="number"
                min="0"
                step="0.01"
                value={formData.unit_price}
                onChange={handleChange}
                className="h-8 text-sm"
                required
              />
            </div>
          </div>

          <div className="mt-4 p-3 bg-muted/20 rounded-md border border-border/30">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <span className="text-sm font-medium mr-2">Total Cost:</span>
                <span className="text-lg font-semibold">
                  {formatCurrency(formData.quantity * formData.unit_price || 0)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {isFormComplete && (
                  <span className="text-xs text-muted-foreground italic">
                    All fields complete
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="px-4"
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              className="bg-primary hover:bg-primary/90 text-white px-4"
              disabled={!isFormComplete || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
