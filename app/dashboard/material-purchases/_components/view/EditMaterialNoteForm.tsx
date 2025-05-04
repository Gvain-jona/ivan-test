'use client';

import React, { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, Save, FileText } from 'lucide-react';
import { MaterialNote } from '@/types/materials';
import { BottomOverlayForm } from './BottomOverlayForm';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatDate } from '@/lib/utils';

// Form schema
const formSchema = z.object({
  text: z.string().min(1, 'Note text is required'),
});

type FormValues = z.infer<typeof formSchema>;

interface EditMaterialNoteFormProps {
  note: MaterialNote;
  onSubmit: (note: MaterialNote) => Promise<boolean>;
  onClose: () => void;
  isSubmitting: boolean;
}

/**
 * Form for editing an existing note
 * Matches the styling used in expense view
 */
export function EditMaterialNoteForm({
  note,
  onSubmit,
  onClose,
  isSubmitting
}: EditMaterialNoteFormProps) {
  const [formError, setFormError] = useState<string | null>(null);

  // Initialize form with note data
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      text: note.text || '',
    },
  });

  // Handle form submission
  const handleSubmit = async (data: FormValues) => {
    try {
      setFormError(null);

      const updatedNote: MaterialNote = {
        ...note,
        text: data.text,
      };

      const success = await onSubmit(updatedNote);

      if (success) {
        onClose();
      }
    } catch (error) {
      console.error('Error updating note:', error);
      setFormError(error instanceof Error ? error.message : 'An error occurred while updating the note');
    }
  };

  return (
    <BottomOverlayForm title="Edit Note" onClose={onClose}>
      <div className="mb-6">
        <div className="bg-muted/50 rounded-lg p-4 mb-4 border border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Note Details</p>
                <p className="text-xs text-muted-foreground">Created: {formatDate(note.created_at || '')}</p>
              </div>
            </div>
          </div>
        </div>

        {formError && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="text"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Note</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Enter your note here..."
                    className="min-h-[180px] md:min-h-[200px] resize-none w-full text-base"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex flex-col gap-2 pt-4">
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} className="w-full">
              Cancel
            </Button>
          </div>
        </form>
      </Form>
    </BottomOverlayForm>
  );
}
