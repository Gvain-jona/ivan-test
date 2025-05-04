import React, { useState } from 'react';
import { Save, Loader2, Calendar, Tag, Package, DollarSign, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Expense } from '@/hooks/expenses';
import { formatDate } from '@/lib/utils';
import { CATEGORIES } from '../form/schema';

interface EditExpenseDetailsFormProps {
  expense: Expense;
  onSubmit: (updatedExpense: Partial<Expense>) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const EditExpenseDetailsForm: React.FC<EditExpenseDetailsFormProps> = ({
  expense,
  onSubmit,
  onCancel,
  isSubmitting = false
}) => {
  const [formData, setFormData] = useState<Partial<Expense>>({
    id: expense.id,
    item_name: expense.item_name || '',
    category: expense.category || '',
    date: expense.date || new Date().toISOString(),
    unit_cost: expense.unit_cost || 0,
    quantity: expense.quantity || 1,
    total_amount: expense.total_amount || 0,
    responsible: expense.responsible || '',
    vat: expense.vat || 0
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    
    // Handle numeric inputs
    if (type === 'number') {
      const numValue = parseFloat(value);
      
      setFormData(prev => {
        const updatedData = {
          ...prev,
          [name]: numValue
        };
        
        // Auto-calculate total amount when unit_cost or quantity changes
        if (name === 'unit_cost' || name === 'quantity') {
          const quantity = name === 'quantity' ? numValue : (prev.quantity || 1);
          const unitCost = name === 'unit_cost' ? numValue : (prev.unit_cost || 0);
          updatedData.total_amount = quantity * unitCost;
        }
        
        return updatedData;
      });
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      date: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error updating expense details:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-4">
        {/* Item Name */}
        <div>
          <Label htmlFor="item_name" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Item Name
          </Label>
          <Input
            id="item_name"
            name="item_name"
            placeholder="Enter item name"
            value={formData.item_name || ''}
            onChange={handleChange}
            className="mt-1"
            required
          />
        </div>

        {/* Category */}
        <div>
          <Label htmlFor="category" className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Category
          </Label>
          <Select
            value={formData.category || ''}
            onValueChange={(value) => handleSelectChange('category', value)}
          >
            <SelectTrigger id="category" className="mt-1">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((category) => (
                <SelectItem key={category.value} value={category.value}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date */}
        <div>
          <Label htmlFor="date" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Date
          </Label>
          <Input
            id="date"
            name="date"
            type="date"
            value={formData.date ? formData.date.split('T')[0] : ''}
            onChange={handleDateChange}
            className="mt-1"
            required
          />
        </div>

        {/* Unit Cost and Quantity */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="unit_cost" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Unit Cost
            </Label>
            <Input
              id="unit_cost"
              name="unit_cost"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={formData.unit_cost || ''}
              onChange={handleChange}
              className="mt-1"
              required
            />
          </div>
          <div>
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              name="quantity"
              type="number"
              min="1"
              placeholder="1"
              value={formData.quantity || ''}
              onChange={handleChange}
              className="mt-1"
              required
            />
          </div>
        </div>

        {/* Total Amount */}
        <div>
          <Label htmlFor="total_amount">Total Amount</Label>
          <Input
            id="total_amount"
            name="total_amount"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={formData.total_amount || ''}
            onChange={handleChange}
            className="mt-1"
            required
          />
        </div>

        {/* Responsible */}
        <div>
          <Label htmlFor="responsible" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Responsible Person (Optional)
          </Label>
          <Input
            id="responsible"
            name="responsible"
            placeholder="Enter responsible person"
            value={formData.responsible || ''}
            onChange={handleChange}
            className="mt-1"
          />
        </div>

        {/* VAT */}
        <div>
          <Label htmlFor="vat">VAT (Optional)</Label>
          <Input
            id="vat"
            name="vat"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={formData.vat || ''}
            onChange={handleChange}
            className="mt-1"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || !formData.item_name || !formData.category}
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
  );
};

export default EditExpenseDetailsForm;
