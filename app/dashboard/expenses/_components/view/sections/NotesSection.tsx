import React from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Loader2, Plus } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { Expense, ExpenseNote } from '@/hooks/expenses';
import { SectionHeader } from '../SectionHeader';
import { ItemCard } from '../ItemCard';
import { EmptyStateMessage } from '../EmptyStateMessage';

interface NotesSectionProps {
  expense: Expense;
  notes: ExpenseNote[];
  loadingStates: {
    addNote: boolean;
    editNote: string | null;
    deleteNote: string | null;
  };
  onAddNote: () => void;
  onEditNote: (note: ExpenseNote) => void;
  onDeleteNote: (id: string) => void;
}

/**
 * Notes section component for the expense view
 * Displays a list of notes and provides actions to add, edit, and delete notes
 */
export function NotesSection({
  expense,
  notes,
  loadingStates,
  onAddNote,
  onEditNote,
  onDeleteNote
}: NotesSectionProps) {
  return (
    <div className="space-y-4">
      <SectionHeader
        title="Notes"
        count={notes.length}
        badgeColor="blue"
        icon={<FileText className="h-5 w-5" />}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={onAddNote}
            disabled={loadingStates?.addNote}
          >
            {loadingStates?.addNote ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Add Note
          </Button>
        }
      />

      {notes.length > 0 ? (
        <div className="space-y-3">
          {notes.map((note) => (
            <ItemCard
              key={note.id}
              id={note.id}
              badges={[
                <span key="type" className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">
                  {note.type}
                </span>,
                <span key="date" className="text-xs text-muted-foreground">
                  {formatDate(note.created_at || '')}
                </span>
              ]}
              content={<p className="text-sm">{note.text}</p>}
              accentColor="blue"
              onEdit={() => onEditNote(note)}
              onDelete={() => onDeleteNote(note.id)}
              isEditLoading={loadingStates?.editNote === note.id}
              isDeleteLoading={loadingStates?.deleteNote === note.id}
            />
          ))}
        </div>
      ) : (
        <EmptyStateMessage
          title="No notes yet"
          description="Add a note to keep track of important information"
          icon={<FileText className="h-8 w-8" />}
          actionLabel="Add Note"
          onAction={onAddNote}
          isLoading={loadingStates?.addNote}
        />
      )}
    </div>
  );
}
