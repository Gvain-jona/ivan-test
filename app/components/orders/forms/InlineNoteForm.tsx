"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { OrderNoteFormValues, orderNoteSchema } from '@/schemas/order-schema';
import { OrderNote, NoteType } from '@/types/orders';
import { useDebouncedCallback } from '@/hooks/useDebounce';
import { X, Info, AlertTriangle, UserRound, FileText } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface InlineNoteFormProps {
  onAddNote: (note: OrderNote) => void;
  onRemoveForm: (index: number) => void;
  formIndex: number;
}

export function InlineNoteForm({
  onAddNote,
  onRemoveForm,
  formIndex,
}: InlineNoteFormProps) {
  const form = useForm<OrderNoteFormValues>({
    mode: 'onChange',
    resolver: zodResolver(orderNoteSchema),
    defaultValues: {
      type: 'info',
      text: '',
    },
  });


  const [savedNoteId, setSavedNoteId] = useState<string | null>(null);
  const noteType = form.watch('type');
  const noteText = form.watch('text');

  // Create a save function
  const saveNote = useCallback((formData: OrderNoteFormValues) => {
    // Only save if we have the minimum required fields
    if (
      formData.type &&
      formData.text &&
      formData.text.trim().length > 0
    ) {
      const noteId = savedNoteId || `note-${Date.now()}-${formIndex}`;

      const newNote: OrderNote = {
        id: noteId,
        ...formData,
        linked_item_type: 'order',
        linked_item_id: '',
        created_by: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // If we haven't saved a note yet, store the ID
      if (!savedNoteId) {
        setSavedNoteId(noteId);
      }

      onAddNote(newNote);
    }
  }, [onAddNote, savedNoteId, formIndex, setSavedNoteId]);

  const debouncedSave = useDebouncedCallback(saveNote, 800); // 800ms debounce time

  // Watch for form changes and trigger the debounced save
  useEffect(() => {
    if (noteType || (noteText && noteText.trim().length > 0)) {
      const formData = form.getValues();
      debouncedSave(formData);
    }
  }, [noteType, noteText, form, debouncedSave]);

  // Handle removing this form
  const handleRemoveForm = () => {
    onRemoveForm(formIndex);
  };

  const noteTypes: { value: NoteType; label: string; icon: React.ReactNode }[] = [
    { value: 'info', label: 'Information', icon: <Info className="h-4 w-4 text-blue-500" /> },
    { value: 'client_follow_up', label: 'Client Follow-Up', icon: <UserRound className="h-4 w-4 text-green-500" /> },
    { value: 'urgent', label: 'Urgent', icon: <AlertTriangle className="h-4 w-4 text-red-500" /> },
    { value: 'internal', label: 'Internal', icon: <FileText className="h-4 w-4 text-gray-500" /> },
  ];

  return (
    <div className="bg-card/30 border border-border/50 rounded-md p-6 mb-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-sm font-medium">Note #{formIndex + 1}</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRemoveForm}
          className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <Form {...form}>
        <div className="space-y-6">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="text-sm font-medium">Note Type</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select note type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {noteTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center">
                          <span className="mr-2">{type.icon}</span>
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="text"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="text-sm font-medium">Note Text</FormLabel>
                <FormControl>
                  <Textarea {...field} placeholder="Enter note text" rows={3} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

        </div>
      </Form>
    </div>
  );
}
