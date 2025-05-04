'use client';

import React, { useState } from 'react';
import { FileText, Plus, Edit2, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { useMaterialPurchaseView } from '../context/MaterialPurchaseViewContext';
import { SectionHeader } from '../SectionHeader';
import { MaterialNote } from '@/types/materials';
import { AddMaterialNoteForm } from '../AddMaterialNoteForm';
import { EditMaterialNoteForm } from '../EditMaterialNoteForm';
import { EmptyStateMessage } from '../EmptyStateMessage';
import { ItemCard } from '../ItemCard';
import { useNoteManagement } from './NotesSection/hooks/useNoteManagement';

export function NotesSection() {
  const { purchase } = useMaterialPurchaseView();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingNote, setEditingNote] = useState<MaterialNote | null>(null);

  const {
    handleAddNote,
    handleEditNote,
    handleDeleteNote,
    loadingStates
  } = useNoteManagement();

  if (!purchase) return null;

  const notes = purchase.purchase_notes || [];

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Notes"
        count={notes.length}
        icon={<FileText className="h-5 w-5" />}
        badgeColor="blue"
        actions={
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2 text-xs"
            onClick={() => setShowAddForm(true)}
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add Note
          </Button>
        }
      />

      {notes.length === 0 ? (
        <EmptyStateMessage
          message="No notes added yet"
          actionLabel="Add Note"
          onAction={() => setShowAddForm(true)}
        />
      ) : (
        <div className="space-y-3">
          {notes.map((note) => {
            const dateBadge = (
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted/30 text-muted-foreground">
                {formatDate(note.created_at || '')}
              </span>
            );

            return (
              <ItemCard
                key={note.id}
                title={note.text.length > 50 ? `${note.text.substring(0, 50)}...` : note.text}
                description={note.text.length > 50 ? note.text : undefined}
                badges={dateBadge}
                icon={<FileText className="h-5 w-5 text-blue-500" />}
                accentColor="blue"
                actions={
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setEditingNote(note)}
                      disabled={loadingStates.deleteNote === note.id}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleDeleteNote(note.id)}
                      disabled={loadingStates.deleteNote === note.id}
                    >
                      {loadingStates.deleteNote === note.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-destructive" />
                      )}
                    </Button>
                  </>
                }
              />
            );
          })}
        </div>
      )}

      {/* Add Note Form */}
      {showAddForm && (
        <AddMaterialNoteForm
          purchase={purchase}
          onSubmit={handleAddNote}
          onClose={() => setShowAddForm(false)}
          isSubmitting={loadingStates.addNote}
        />
      )}

      {/* Edit Note Form */}
      {editingNote && (
        <EditMaterialNoteForm
          note={editingNote}
          onSubmit={(updatedNote) => {
            handleEditNote(updatedNote);
            setEditingNote(null);
          }}
          onClose={() => setEditingNote(null)}
          isSubmitting={loadingStates.editNote === editingNote.id}
        />
      )}
    </div>
  );
}
