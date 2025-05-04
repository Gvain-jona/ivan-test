import React from 'react';
import { PlusCircle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Expense, ExpenseNote } from '@/hooks/expenses';
import { NoteCard, EmptyState } from '../shared';

interface ExpenseViewNotesProps {
  expense: Expense;
  onAddNote: () => void;
  onEditNote?: (note: ExpenseNote) => void;
  onDeleteNote?: (id: string) => Promise<void>;
  isSubmitting?: boolean;
}

/**
 * Notes section of the expense view
 */
export function ExpenseViewNotes({ 
  expense, 
  onAddNote,
  onEditNote,
  onDeleteNote,
  isSubmitting = false
}: ExpenseViewNotesProps) {
  const hasNotes = expense.notes && Array.isArray(expense.notes) && expense.notes.length > 0;

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium">
          Notes
          {hasNotes && (
            <Badge variant="outline" className="ml-2 bg-muted">
              {expense.notes.length}
            </Badge>
          )}
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={onAddNote}
          disabled={isSubmitting}
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Note
        </Button>
      </div>

      {hasNotes ? (
        <div className="space-y-3">
          {expense.notes.map((note: ExpenseNote) => (
            <NoteCard
              key={note.id}
              note={note}
              onEdit={onEditNote}
              onDelete={onDeleteNote}
              isSubmitting={isSubmitting}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<FileText className="h-8 w-8" />}
          title="No notes yet"
          actionLabel="Add Note"
          onAction={onAddNote}
        />
      )}
    </div>
  );
}
