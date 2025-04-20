import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Save } from 'lucide-react';
import { OrderItem } from '@/types/orders';
import { useToast } from '@/components/ui/use-toast';

interface AddOrderItemFormProps {
  orderId: string;
  onSubmit: (item: Partial<OrderItem>) => Promise<void>;
  onCancel: () => void;
}

const AddOrderItemForm: React.FC<AddOrderItemFormProps> = ({
  orderId,
  onSubmit,
  onCancel
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<OrderItem>>({
    order_id: orderId,
    item_name: '',
    category_name: '',
    size: 'Default',
    quantity: 1,
    unit_price: 0,
    total_amount: 0
  });

  // Update total amount when quantity or unit price changes
  const updateTotalAmount = (quantity: number, unitPrice: number) => {
    return quantity * unitPrice;
  };

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'quantity' || name === 'unit_price') {
      const numValue = parseFloat(value) || 0;
      const newFormData = {
        ...formData,
        [name]: numValue
      };
      
      // Update total amount if quantity or unit price changes
      if (name === 'quantity') {
        newFormData.total_amount = updateTotalAmount(numValue, formData.unit_price || 0);
      } else if (name === 'unit_price') {
        newFormData.total_amount = updateTotalAmount(formData.quantity || 1, numValue);
      }
      
      setFormData(newFormData);
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.item_name) {
      toast({
        title: 'Error',
        description: 'Item name is required',
        variant: 'destructive'
      });
      return;
    }
    
    if (!formData.category_name) {
      toast({
        title: 'Error',
        description: 'Category name is required',
        variant: 'destructive'
      });
      return;
    }
    
    if (!formData.quantity || formData.quantity <= 0) {
      toast({
        title: 'Error',
        description: 'Quantity must be greater than 0',
        variant: 'destructive'
      });
      return;
    }
    
    if (!formData.unit_price || formData.unit_price <= 0) {
      toast({
        title: 'Error',
        description: 'Unit price must be greater than 0',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      setIsLoading(true);
      await onSubmit(formData);
      // Form will be closed by the parent component
    } catch (error) {
      console.error('Error adding item:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add item',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="item_name">Item Name</Label>
          <Input
            id="item_name"
            name="item_name"
            value={formData.item_name}
            onChange={handleChange}
            placeholder="Enter item name"
            disabled={isLoading}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="category_name">Category</Label>
          <Input
            id="category_name"
            name="category_name"
            value={formData.category_name}
            onChange={handleChange}
            placeholder="Enter category name"
            disabled={isLoading}
            required
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="size">Size</Label>
          <Select
            value={formData.size}
            onValueChange={(value) => handleSelectChange('size', value)}
            disabled={isLoading}
          >
            <SelectTrigger id="size">
              <SelectValue placeholder="Select size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Small">Small</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Large">Large</SelectItem>
              <SelectItem value="XL">XL</SelectItem>
              <SelectItem value="XXL">XXL</SelectItem>
              <SelectItem value="Default">Default</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="quantity">Quantity</Label>
          <Input
            id="quantity"
            name="quantity"
            type="number"
            min="1"
            step="1"
            value={formData.quantity}
            onChange={handleChange}
            disabled={isLoading}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="unit_price">Unit Price</Label>
          <Input
            id="unit_price"
            name="unit_price"
            type="number"
            min="0"
            step="0.01"
            value={formData.unit_price}
            onChange={handleChange}
            disabled={isLoading}
            required
          />
        </div>
      </div>
      
      <div className="bg-muted/30 p-4 rounded-lg border border-border/50">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Total Amount:</span>
          <span className="text-lg font-semibold">
            {new Intl.NumberFormat('en-UG', {
              style: 'currency',
              currency: 'UGX',
              minimumFractionDigits: 0
            }).format(formData.total_amount || 0)}
          </span>
        </div>
      </div>
      
      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading || !formData.item_name || !formData.category_name || !formData.quantity || !formData.unit_price}
        >
          {isLoading ? (
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
  );
};

export default AddOrderItemForm;
