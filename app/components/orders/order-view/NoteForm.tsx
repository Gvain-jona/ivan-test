import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { OrderNote, NoteType } from '@/types/orders';

interface NoteFormProps {
  onSubmit: (note: Partial<OrderNote>) => void;
  onCancel: () => void;
}

/**
 * NoteForm component for adding notes to an order
 */
const NoteForm: React.FC<NoteFormProps> = ({
  onSubmit,
  onCancel
}) => {
  const [noteText, setNoteText] = useState<string>('');
  const [noteType, setNoteType] = useState<NoteType>('info');

  const handleSubmit = () => {
    if (!noteText.trim()) {
      return;
    }

    const newNote: Partial<OrderNote> = {
      text: noteText,
      type: noteType,
      created_at: new Date().toISOString(),
    };

    onSubmit(newNote);
    resetForm();
  };

  const resetForm = () => {
    setNoteText('');
    setNoteType('info');
  };

  return (
    <div className="border border-[#2B2B40] rounded-lg p-4 mb-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-medium text-white">Add Note</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="h-8 w-8 p-0 text-[#6D6D80] hover:text-white"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="space-y-4">
        <div>
          <Label htmlFor="type">Note Type</Label>
          <Select
            value={noteType}
            onValueChange={(value) => setNoteType(value as NoteType)}
          >
            <SelectTrigger id="type" className="bg-transparent border-[#2B2B40] focus:border-orange-500">
              <SelectValue placeholder="Select note type" />
            </SelectTrigger>
            <SelectContent className="bg-gray-950 border-[#2B2B40]">
              <SelectItem value="info">Information</SelectItem>
              <SelectItem value="client_follow_up">Client Follow-up</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="internal">Internal</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="text">Note Text</Label>
          <Textarea
            id="text"
            placeholder="Enter note text..."
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            className="bg-transparent border-[#2B2B40] focus:border-orange-500 min-h-[100px]"
          />
        </div>

        <Button
          onClick={handleSubmit}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white"
          disabled={!noteText.trim()}
        >
          Add Note
        </Button>
      </div>
    </div>
  );
};

export default NoteForm;
