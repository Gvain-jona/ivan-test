import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Save, Info, AlertTriangle, User, StickyNote } from 'lucide-react';
import { OrderNote, NoteType } from '@/types/orders';
import { useToast } from '@/components/ui/use-toast';
import { v4 as uuidv4 } from 'uuid';

interface AddOrderNoteFormProps {
  orderId: string;
  onSubmit: (note: Partial<OrderNote>) => Promise<void>;
  onCancel: () => void;
}

const AddOrderNoteForm: React.FC<AddOrderNoteFormProps> = ({
  orderId,
  onSubmit,
  onCancel
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  // Generate a UUID for the created_by field
  const systemUserId = uuidv4();

  const [formData, setFormData] = useState<Partial<OrderNote>>({
    linked_item_id: orderId,
    linked_item_type: 'order',
    type: 'info',
    text: '',
    // Add createdBy field to match the API expectations with a valid UUID
    created_by: systemUserId, // Use a valid UUID
    createdBy: systemUserId, // Also include the camelCase version for the API
  });

  // Handle textarea changes
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle select changes
  const handleSelectChange = (value: string) => {
    setFormData({
      ...formData,
      type: value as NoteType
    });
  };

  // Get note type icon
  const getNoteTypeIcon = () => {
    switch (formData.type) {
      case 'urgent':
        return <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />;
      case 'client_follow_up':
        return <User className="h-4 w-4 text-blue-500 mr-2" />;
      case 'internal':
        return <StickyNote className="h-4 w-4 text-purple-500 mr-2" />;
      case 'info':
      default:
        return <Info className="h-4 w-4 text-green-500 mr-2" />;
    }
  };

  // Format note type for display
  const formatNoteType = (type: string) => {
    switch (type) {
      case 'client_follow_up':
        return 'Follow Up';
      case 'urgent':
        return 'Urgent';
      case 'internal':
        return 'Internal';
      case 'info':
      default:
        return 'Info';
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!formData.text || formData.text.trim() === '') {
      toast({
        title: 'Error',
        description: 'Note text is required',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsLoading(true);
      await onSubmit(formData);
      // Form will be closed by the parent component
    } catch (error) {
      console.error('Error adding note:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add note',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="type">Note Type</Label>
        <Select
          value={formData.type}
          onValueChange={handleSelectChange}
          disabled={isLoading}
        >
          <SelectTrigger id="type">
            <SelectValue placeholder="Select type">
              <div className="flex items-center">
                {getNoteTypeIcon()}
                <span>{formatNoteType(formData.type || 'info')}</span>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="info">
              <div className="flex items-center">
                <Info className="h-4 w-4 text-green-500 mr-2" />
                <span>Info</span>
              </div>
            </SelectItem>
            <SelectItem value="urgent">
              <div className="flex items-center">
                <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
                <span>Urgent</span>
              </div>
            </SelectItem>
            <SelectItem value="client_follow_up">
              <div className="flex items-center">
                <User className="h-4 w-4 text-blue-500 mr-2" />
                <span>Client Follow-up</span>
              </div>
            </SelectItem>
            <SelectItem value="internal">
              <div className="flex items-center">
                <StickyNote className="h-4 w-4 text-purple-500 mr-2" />
                <span>Internal</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="text">Note Text</Label>
        <Textarea
          id="text"
          name="text"
          value={formData.text}
          onChange={handleChange}
          placeholder="Enter note text..."
          className="min-h-[120px]"
          disabled={isLoading}
          required
        />
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
          disabled={isLoading || !formData.text || formData.text.trim() === ''}
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Adding...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Add Note
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

export default AddOrderNoteForm;
