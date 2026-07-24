import React, { useState } from 'react';
import { StickyNote, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { OrderNotesTabProps } from './types';

/**
 * OrderNotesTab lists notes (polymorphic notes engine) and adds new
 * ones. Notes are append-oriented; edit/delete flows come later if
 * needed.
 */
const OrderNotesTab: React.FC<OrderNotesTabProps> = ({ notes, onAddNote, isSubmitting }) => {
  const [showForm, setShowForm] = useState(false);
  const [content, setContent] = useState('');

  const handleSubmit = async () => {
    const trimmed = content.trim();
    if (!trimmed) return;
    await onAddNote(trimmed);
    setContent('');
    setShowForm(false);
  };

  return (
    <div className="space-y-4">
      {notes.length === 0 ? (
        <div className="border border-border/40 rounded-lg p-8 text-center text-muted-foreground">
          <StickyNote className="h-6 w-6 mx-auto mb-2 opacity-60" />
          <p className="text-sm">No notes on this order</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notes.map(note => (
            <div key={note.id} className="border border-border/40 rounded-lg p-3">
              <p className="text-sm text-foreground whitespace-pre-wrap">{note.content}</p>
              <p className="text-xs text-muted-foreground mt-1.5">
                {new Date(note.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}

      {showForm ? (
        <div className="border border-border/40 rounded-lg p-4 space-y-3">
          <Textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Write a note…"
            rows={3}
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSubmit} disabled={isSubmitting || !content.trim()}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
              Add Note
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setShowForm(true)} className="w-full">
          <Plus className="h-4 w-4 mr-1.5" />
          Add Note
        </Button>
      )}
    </div>
  );
};

export default OrderNotesTab;
