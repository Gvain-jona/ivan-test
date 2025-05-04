'use client';

import React, { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
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
import { Loader2 } from 'lucide-react';
import { MaterialNote } from '@/hooks/materials/types';

// Define the form schema
const formSchema = z.object({
  text: z.string().min(1, 'Note text is required'),
  type: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface MaterialNoteFormProps {
  purchaseId: string;
  note?: MaterialNote;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (data: FormValues) => void;
  onCancel: () => void;
  children?: React.ReactNode;
}

/**
 * Form component for adding or editing a note for a material purchase
 */
export function MaterialNoteForm({
  purchaseId,
  note,
  open,
  onOpenChange,
  onSuccess,
  onCancel,
  children,
}: MaterialNoteFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!note;

  // Initialize form with default values or existing note data
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      text: note?.text || '',
      type: note?.type || 'general',
    },
  });

  // Handle form submission
  const onSubmit = async (data: FormValues) => {
    try {
      setIsSubmitting(true);
      await onSuccess(data);
      form.reset();
    } catch (error) {
      console.error('Error submitting note:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    form.reset();
    onCancel();
  };

  return (
    <>
      {children}
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{isEditing ? 'Edit Note' : 'Add Note'}</SheetTitle>
            <SheetDescription>
              {isEditing
                ? 'Update the note for this material purchase'
                : 'Add a note to this material purchase'}
            </SheetDescription>
          </SheetHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-6">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Note Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a note type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="payment">Payment</SelectItem>
                        <SelectItem value="supplier">Supplier</SelectItem>
                        <SelectItem value="quality">Quality</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
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
                  <FormItem>
                    <FormLabel>Note</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter your note here..."
                        className="min-h-[120px]"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <SheetFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isEditing ? 'Updating...' : 'Adding...'}
                    </>
                  ) : (
                    isEditing ? 'Update Note' : 'Add Note'
                  )}
                </Button>
              </SheetFooter>
            </form>
          </Form>
        </SheetContent>
      </Sheet>
    </>
  );
}
