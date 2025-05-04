import React, { useState } from 'react';
import { Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { ExpenseNote } from '@/hooks/expenses';
import { NOTE_TYPES } from '../form/schema';

interface AddExpenseNoteFormProps {
  expenseId: string;
  onSubmit: (note: Partial<ExpenseNote>) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  defaultValues?: Partial<ExpenseNote>;
}

const AddExpenseNoteForm: React.FC<AddExpenseNoteFormProps> = ({
  expenseId,
  onSubmit,
  onCancel,
  isSubmitting = false,
  defaultValues
}) => {
  // Initialize form data with default values if provided
  const [formData, setFormData] = useState<Partial<ExpenseNote>>({
    expense_id: expenseId,
    type: defaultValues?.type || 'info',
    text: defaultValues?.text || ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      // Ensure all required fields are present
      const formattedData = {
        ...formData,
        expense_id: expenseId,
        type: formData.type || 'info',
        text: formData.text || ''
      };

      // Log the form data for debugging
      console.log('Submitting note form data:', {
        original: formData,
        formatted: formattedData,
        isEdit: !!defaultValues
      });

      await onSubmit(formattedData);
    } catch (error) {
      console.error('Error submitting note:', error);
      // No need to show toast here as it's handled in the parent component
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-4">
        <div>
          <Label htmlFor="type">Note Type</Label>
          <Select
            value={formData.type || 'info'}
            onValueChange={(value) => handleSelectChange('type', value)}
          >
            <SelectTrigger className="w-full mt-1">
              <SelectValue placeholder="Select note type" />
            </SelectTrigger>
            <SelectContent>
              {NOTE_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type === 'info' ? 'Information' :
                   type === 'follow_up' ? 'Follow Up' :
                   type.charAt(0).toUpperCase() + type.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="text">Note Text</Label>
          <Textarea
            id="text"
            name="text"
            placeholder="Enter note text..."
            value={formData.text || ''}
            onChange={handleChange}
            className="mt-1 min-h-[120px]"
            required
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
          disabled={isSubmitting || !formData.text || formData.text.trim() === ''}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {defaultValues ? 'Updating...' : 'Adding...'}
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {defaultValues ? 'Update Note' : 'Add Note'}
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

export default AddExpenseNoteForm;
