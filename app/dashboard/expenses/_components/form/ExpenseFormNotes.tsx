import React from 'react';
import { Control, UseFieldArrayReturn } from 'react-hook-form';
import { PlusCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { NOTE_TYPES } from './schema';

interface ExpenseFormNotesProps {
  control: Control<any>;
  noteFields: UseFieldArrayReturn['fields'];
  appendNote: UseFieldArrayReturn['append'];
  removeNote: UseFieldArrayReturn['remove'];
}

/**
 * Notes section of the expense form
 * Memoized to prevent unnecessary re-renders
 */
export function ExpenseFormNotes({
  control,
  noteFields,
  appendNote,
  removeNote
}: ExpenseFormNotesProps) {
  // Add note handler
  const handleAddNote = () => {
    appendNote({ type: 'info', text: '' });
  };
  return (
    <div className="space-y-4 border-t pt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium">Notes</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddNote}
          className="h-9"
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Note
        </Button>
      </div>

      <div className="space-y-6">
        {noteFields.length > 0 ? (
          <div className="space-y-6">
            {noteFields.map((field, index) => (
              <div key={field.id} className="border rounded-lg p-4 bg-muted/5 shadow-sm relative">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 absolute top-2 right-2"
                  onClick={() => removeNote(index)}
                >
                  <X className="h-4 w-4" />
                </Button>

                <div className="grid grid-cols-1 gap-4">
                  <FormField
                    control={control}
                    name={`notes.${index}.type`}
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="font-medium">Note Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="h-10">
                              <SelectValue placeholder="Select type" />
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
                    control={control}
                    name={`notes.${index}.text`}
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="font-medium">Note Content</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter note text"
                            className="resize-none min-h-[100px] p-3"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center p-6 border rounded-md bg-muted/10">
            <p className="text-sm text-muted-foreground">No notes added yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
