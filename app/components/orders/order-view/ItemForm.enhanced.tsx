import React, { useState, useEffect } from 'react';
import { OrderItem } from '@/types/orders';
import { X, Save, Loader2, AlertCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { formatCurrency } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';

/**
 * ItemForm component for adding new order items with enhanced feedback
 */
export interface ItemFormProps {
  onSubmit: (newItem: Partial<OrderItem>) => Promise<void>;
  onCancel: () => void;
  orderId: string;
  loadingState?: {
    status: 'idle' | 'preparing' | 'submitting' | 'processing' | 'success' | 'error';
    message?: string;
    error?: string | null;
    progress?: number;
  };
}

export const ItemForm: React.FC<ItemFormProps> = ({
  onSubmit,
  onCancel,
  orderId,
  loadingState = { status: 'idle' }
}) => {
  const { toast } = useToast();
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [formTouched, setFormTouched] = useState<Record<string, boolean>>({});

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

  // Validate form data
  useEffect(() => {
    const errors: Record<string, string> = {};

    if (formTouched.category_name && !formData.category_name.trim()) {
      errors.category_name = 'Category name is required';
    }

    if (formTouched.item_name && !formData.item_name.trim()) {
      errors.item_name = 'Item name is required';
    }

    if (formTouched.size && !formData.size.trim()) {
      errors.size = 'Size is required';
    }

    if (formTouched.quantity && (formData.quantity <= 0 || isNaN(formData.quantity))) {
      errors.quantity = 'Quantity must be greater than 0';
    }

    if (formTouched.unit_price && (formData.unit_price < 0 || isNaN(formData.unit_price))) {
      errors.unit_price = 'Unit price cannot be negative';
    }

    setValidationErrors(errors);
  }, [formData, formTouched]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Mark field as touched
    setFormTouched(prev => ({
      ...prev,
      [name]: true
    }));

    setFormData(prev => ({
      ...prev,
      [name]: name === 'quantity' || name === 'unit_price' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[ItemForm] Form submission started');

    // Mark all fields as touched for validation
    const allTouched = Object.keys(formData).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {} as Record<string, boolean>);

    setFormTouched(allTouched);
    console.log('[ItemForm] Form data:', formData);

    // Check for validation errors
    const errors: Record<string, string> = {};

    if (!formData.category_name.trim()) {
      errors.category_name = 'Category name is required';
    }

    if (!formData.item_name.trim()) {
      errors.item_name = 'Item name is required';
    }

    if (!formData.size.trim()) {
      errors.size = 'Size is required';
    }

    if (formData.quantity <= 0 || isNaN(formData.quantity)) {
      errors.quantity = 'Quantity must be greater than 0';
    }

    if (formData.unit_price < 0 || isNaN(formData.unit_price)) {
      errors.unit_price = 'Unit price cannot be negative';
    }

    if (Object.keys(errors).length > 0) {
      console.log('[ItemForm] Validation errors:', errors);
      setValidationErrors(errors);
      return;
    }

    try {
      console.log('[ItemForm] Validation passed, preparing item data');
      // Prepare the item data for submission
      // We don't need to generate IDs or calculate total_amount here
      // The API will handle that for us
      const newItem: Partial<OrderItem> = {
        // Only include the necessary fields for the API
        item_name: formData.item_name.trim(),
        category_name: formData.category_name.trim(),
        size: formData.size,
        quantity: formData.quantity,
        unit_price: formData.unit_price,
      };

      console.log('[ItemForm] Submitting new item:', newItem);
      // Pass the new item to the parent component
      await onSubmit(newItem);
      console.log('[ItemForm] Item submitted successfully');

      // Don't reset form or close it here - let the parent component handle it
      // based on the loading state
    } catch (error) {
      console.error('[ItemForm] Error preparing new item:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to add item',
        variant: "destructive"
      });
    }
  };

  // Check if form is complete
  const isFormComplete =
    formData.category_name.trim() !== '' &&
    formData.item_name.trim() !== '' &&
    formData.size.trim() !== '' &&
    formData.quantity > 0 &&
    formData.unit_price >= 0;

  // Determine if form is submitting
  const isSubmitting = loadingState.status !== 'idle' && loadingState.status !== 'error';

  // Auto-close form on success after a delay
  useEffect(() => {
    if (loadingState.status === 'success') {
      console.log('[ItemForm] Operation successful, preparing to close form');
      const timer = setTimeout(() => {
        console.log('[ItemForm] Closing form after successful operation');
        onCancel();
      }, 2000); // Increased delay to ensure API operation completes

      return () => clearTimeout(timer);
    }
  }, [loadingState.status, onCancel]);

  return (
    <div className="bg-background/95 backdrop-blur-sm border border-border rounded-md shadow-sm">
      <div className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Loading progress indicator */}
          {isSubmitting && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{loadingState.message || 'Processing...'}</span>
                <span className="text-xs text-muted-foreground">{loadingState.progress ? `${Math.round(loadingState.progress)}%` : ''}</span>
              </div>
              <Progress value={loadingState.progress} className="h-2" />
            </div>
          )}

          {/* Success message */}
          {loadingState.status === 'success' && (
            <Alert className="bg-green-500/10 border-green-500/20 text-green-600">
              <Check className="h-4 w-4 mr-2" />
              <AlertDescription>
                Item added successfully!
              </AlertDescription>
            </Alert>
          )}

          {/* Error message */}
          {loadingState.status === 'error' && loadingState.error && (
            <Alert className="bg-destructive/10 border-destructive/20 text-destructive">
              <AlertCircle className="h-4 w-4 mr-2" />
              <AlertDescription>
                {loadingState.error}
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="category_name" className="text-xs font-medium">Category</Label>
              <Input
                id="category_name"
                name="category_name"
                value={formData.category_name}
                onChange={handleChange}
                className={`h-8 text-sm ${validationErrors.category_name ? 'border-destructive' : ''}`}
                placeholder="Enter category name"
                required
                disabled={isSubmitting}
              />
              {validationErrors.category_name && (
                <p className="text-xs text-destructive mt-1">{validationErrors.category_name}</p>
              )}
            </div>

            <div>
              <Label htmlFor="item_name" className="text-xs font-medium">Item</Label>
              <Input
                id="item_name"
                name="item_name"
                value={formData.item_name}
                onChange={handleChange}
                className={`h-8 text-sm ${validationErrors.item_name ? 'border-destructive' : ''}`}
                placeholder="Enter item name"
                required
                disabled={isSubmitting}
              />
              {validationErrors.item_name && (
                <p className="text-xs text-destructive mt-1">{validationErrors.item_name}</p>
              )}
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
                className={`h-8 text-sm ${validationErrors.size ? 'border-destructive' : ''}`}
                placeholder="Enter size"
                required
                disabled={isSubmitting}
              />
              {validationErrors.size && (
                <p className="text-xs text-destructive mt-1">{validationErrors.size}</p>
              )}
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
                className={`h-8 text-sm ${validationErrors.quantity ? 'border-destructive' : ''}`}
                required
                disabled={isSubmitting}
              />
              {validationErrors.quantity && (
                <p className="text-xs text-destructive mt-1">{validationErrors.quantity}</p>
              )}
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
                className={`h-8 text-sm ${validationErrors.unit_price ? 'border-destructive' : ''}`}
                required
                disabled={isSubmitting}
              />
              {validationErrors.unit_price && (
                <p className="text-xs text-destructive mt-1">{validationErrors.unit_price}</p>
              )}
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
                {isFormComplete && !Object.keys(validationErrors).length && (
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
              disabled={isSubmitting}
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              className="bg-orange-600 hover:bg-orange-700 text-white px-4"
              disabled={!isFormComplete || Object.keys(validationErrors).length > 0 || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {loadingState.status === 'preparing' ? 'Preparing...' :
                   loadingState.status === 'submitting' ? 'Submitting...' :
                   loadingState.status === 'processing' ? 'Processing...' : 'Adding...'}
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
