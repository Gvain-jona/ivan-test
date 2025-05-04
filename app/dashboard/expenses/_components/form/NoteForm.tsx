'use client';

import React, { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ExpenseNote } from '@/hooks/expenses';
import { NOTE_TYPES } from './schema';

// Form schema
const noteFormSchema = z.object({
  type: z.string().min(1, 'Note type is required'),
  text: z.string().min(1, 'Note text is required'),
});

type NoteFormValues = z.infer<typeof noteFormSchema>;

interface NoteFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: NoteFormValues) => Promise<void>;
  defaultValues?: Partial<ExpenseNote>;
  isSubmitting?: boolean;
}

export function NoteForm({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
  isSubmitting = false,
}: NoteFormProps) {
  const [formError, setFormError] = useState<string | null>(null);

  // Initialize form with default values
  const form = useForm<NoteFormValues>({
    resolver: zodResolver(noteFormSchema),
    defaultValues: {
      type: defaultValues?.type || 'info',
      text: defaultValues?.text || '',
    },
  });

  // Handle form submission
  const handleSubmit = async (values: NoteFormValues) => {
    try {
      setFormError(null);
      await onSubmit(values);
      form.reset();
    } catch (error) {
      console.error('Error submitting note form:', error);
      setFormError(error instanceof Error ? error.message : 'An error occurred while submitting the form');
    }
  };

  // Reset form when closed
  useEffect(() => {
    if (!open) {
      form.reset();
      setFormError(null);
    }
  }, [open, form]);

  // Handle body scroll locking
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm transition-all duration-100 ease-in-out"
        onClick={() => onOpenChange(false)}
      />

      {/* Content */}
      <div className="fixed inset-y-0 right-0 z-50 w-full md:w-1/2 border-l bg-background p-0 shadow-lg transition ease-in-out duration-300 sm:max-w-md flex flex-col h-screen">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-foreground">
              {defaultValues ? 'Edit Note' : 'Add Note'}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            {defaultValues
              ? 'Update the note details below'
              : 'Enter the note details below'}
          </p>
          {formError && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col h-[calc(100vh-73px)]">
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="font-medium">Note Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Select note type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {NOTE_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
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
                    <FormLabel className="font-medium">Note Text</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter note text..."
                        className="min-h-[150px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="sticky bottom-0 z-10 bg-background p-6 border-t">
              <Button
                type="submit"
                className="w-full h-10 font-medium bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : defaultValues ? 'Update Note' : 'Add Note'}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
