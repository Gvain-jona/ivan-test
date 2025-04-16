"use client"

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { OrderNoteFormValues, orderNoteSchema } from '@/schemas/order-schema';
import { OrderNote, NoteType } from '@/types/orders';
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
  // New props for form state persistence
  initialData?: Partial<OrderNoteFormValues>;
  onUpdatePartialData?: (data: Partial<OrderNoteFormValues>) => void;
}

export function InlineNoteForm({
  onAddNote,
  onRemoveForm,
  formIndex,
  initialData,
  onUpdatePartialData,
}: InlineNoteFormProps) {
  // Load initial data from props or use defaults
  const getInitialValues = () => {
    if (initialData) {
      return {
        type: initialData.type || 'info',
        text: initialData.text || '',
      };
    }

    // Default values
    return {
      type: 'info' as NoteType,
      text: '',
    };
  };

  const form = useForm<OrderNoteFormValues>({
    mode: 'onChange',
    resolver: zodResolver(orderNoteSchema),
    defaultValues: getInitialValues(),
  });


  // Generate a unique ID for this note if it doesn't have one yet
  const [noteId] = useState(() => initialData?.id || `note-${Date.now()}-${formIndex}`);
  
  // Refs to track form state and prevent issues
  const hasValidData = useRef(false);
  const isAutoSaving = useRef(false);
  const lastAutoSaveAttempt = useRef<number>(0);

  // Watch all form values to persist partial data when switching tabs
  const formValues = form.watch();
  
  // Function to check if all required fields are filled
  const checkFormCompleteness = useCallback(() => {
    const formData = form.getValues();
    return (
      formData.type &&
      formData.text &&
      formData.text.trim().length > 0
    );
  }, [form]);

  // Function to save the note
  const saveNote = useCallback((formData: OrderNoteFormValues) => {
    // Only create/update the note if we have valid data
    if (checkFormCompleteness()) {
      const newNote: OrderNote = {
        id: noteId,
        ...formData,
        linked_item_type: 'order',
        linked_item_id: '',
        created_by: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Send the note to the parent component
      onAddNote(newNote);
      hasValidData.current = true;
      return true;
    }
    return false;
  }, [noteId, onAddNote, checkFormCompleteness]);

  // Auto-save handler
  const handleAutoSave = useCallback(() => {
    // Don't auto-save if we're already in the process of saving
    if (isAutoSaving.current) return;
    
    // Throttle auto-save attempts (no more than once every 2 seconds)
    const now = Date.now();
    if (now - lastAutoSaveAttempt.current < 2000) return;
    lastAutoSaveAttempt.current = now;
    
    const formData = form.getValues();

    // Only auto-save if all required fields are filled
    if (checkFormCompleteness()) {
      // Set flag to prevent duplicate auto-saves
      isAutoSaving.current = true;
      console.log('Auto-saving note with valid data:', formData);
      saveNote(formData);
      
      // Reset auto-save flag after a delay
      setTimeout(() => {
        isAutoSaving.current = false;
      }, 1000);
    }
  }, [form, saveNote, checkFormCompleteness]);
  
  // Update partial data whenever form values change
  useEffect(() => {
    if (onUpdatePartialData) {
      // Save current form state to parent component regardless of visibility
      // This ensures data is always persisted even when tab is not active
      onUpdatePartialData(formValues);
    }
  }, [formValues, onUpdatePartialData]);
  
  // When the form becomes visible again, ensure we have the latest data
  useEffect(() => {
    if (initialData) {
      // Update form with any saved data when tab becomes active
      Object.entries(initialData).forEach(([key, value]) => {
        if (value !== undefined) {
          form.setValue(key as any, value);
        }
      });
    }
  }, [initialData, form]);
  
  // Watch form values for auto-save
  useEffect(() => {
    // Only attempt auto-save if form is complete
    if (checkFormCompleteness()) {
      // Debounce the auto-save to prevent too many saves while typing
      const timer = setTimeout(() => {
        handleAutoSave();
      }, 1500); // Wait 1.5 seconds after last change before auto-saving
      
      return () => clearTimeout(timer);
    }
  }, [formValues, handleAutoSave, checkFormCompleteness]);
  
  // Manual save handler - called when Save button is clicked
  const handleManualSave = useCallback(() => {
    const formData = form.getValues();
    saveNote(formData);
  }, [form, saveNote]);

  // Add a button to manually save the note
  const saveButton = (
    <Button
      type="button"
      variant="default"
      size="sm"
      className="bg-primary hover:bg-primary/90"
      onClick={handleManualSave}
    >
      Save Note
    </Button>
  );

  // Handle removing this form
  const handleRemoveForm = () => {
    // Clear form errors when removing
    form.clearErrors();
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

          <div className="mt-6 p-4 bg-muted/20 rounded-md border border-border/30">
            <div className="flex justify-between items-center">
              <div>
                {checkFormCompleteness() && (
                  <span className="text-xs text-muted-foreground italic">
                    Auto-saving enabled
                  </span>
                )}
              </div>
              {saveButton}
            </div>
          </div>
        </div>
      </Form>
    </div>
  );
}
