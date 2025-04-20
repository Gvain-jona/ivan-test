import React, { useState } from 'react';
import { OrderItem } from '@/types/orders';
import { X, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { formatCurrency } from '@/lib/utils';

/**
 * ItemForm component for adding new order items
 */
export interface ItemFormProps {
  onSubmit: (newItem: Partial<OrderItem>) => void;
  onCancel: () => void;
  orderId: string;
}

export const ItemForm: React.FC<ItemFormProps> = ({ onSubmit, onCancel, orderId }) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    // Generate temporary IDs for new items
    item_id: crypto.randomUUID(),
    category_id: crypto.randomUUID(),
    // Display names
    category_name: '',
    item_name: '',
    size: 'Default', // Provide a default value since it's required
    quantity: 1,
    unit_price: 0,
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
      // Calculate the total amount
      const total_amount = formData.quantity * formData.unit_price;

      // Create the new item
      const newItem: Partial<OrderItem> = {
        id: crypto.randomUUID(), // Generate a temporary ID
        order_id: orderId,
        item_id: formData.item_id,
        category_id: formData.category_id,
        item_name: formData.item_name.trim(),
        category_name: formData.category_name.trim(),
        size: formData.size,
        quantity: formData.quantity,
        unit_price: formData.unit_price,
        total_amount,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Pass the new item to the parent component
      onSubmit(newItem);
    } catch (error) {
      console.error('Error preparing new item:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to add item',
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
                <span className="text-lg font-semibold text-orange-500">
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
              className="bg-orange-600 hover:bg-orange-700 text-white px-4"
              disabled={!isFormComplete || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Add Item
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
