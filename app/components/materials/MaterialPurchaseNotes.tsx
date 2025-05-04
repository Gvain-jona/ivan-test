import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Loader2, Trash2, Send, StickyNote } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { MaterialNote } from '@/hooks/materials/types';
import { useMaterialPurchaseDetails } from '@/hooks/materials';
import { useToast } from '@/components/ui/use-toast';

interface MaterialPurchaseNotesProps {
  purchaseId: string;
}

export function MaterialPurchaseNotes({ purchaseId }: MaterialPurchaseNotesProps) {
  const {
    purchase,
    isLoading: isLoadingNotes,
    isSubmitting,
    mutate,
    addNote,
    deleteNote
  } = useMaterialPurchaseDetails(purchaseId);

  const [noteText, setNoteText] = useState('');
  const [noteToDelete, setNoteToDelete] = useState<MaterialNote | null>(null);

  // Loading states
  const isCreatingNote = isSubmitting;
  const isDeletingNote = isSubmitting;

  // Get notes from purchase
  const notes = purchase?.purchase_notes || [];
  const { toast } = useToast();

  // Handle create note
  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!noteText.trim()) {
      toast({
        title: 'Note text is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      await addNote({ text: noteText, type: 'note' });
      setNoteText('');
      mutate();
      toast({
        title: 'Note added',
        description: 'Your note has been added successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Error adding note',
        description: error.message || 'An error occurred while adding the note.',
        variant: 'destructive',
      });
    }
  };

  // Handle delete note
  const handleDeleteNote = async () => {
    if (!noteToDelete) return;

    try {
      await deleteNote(noteToDelete.id);
      mutate();
      setNoteToDelete(null);
      toast({
        title: 'Note deleted',
        description: 'Your note has been deleted successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Error deleting note',
        description: error.message || 'An error occurred while deleting the note.',
        variant: 'destructive',
      });
    }
  };

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <StickyNote className="h-5 w-5 mr-2" />
          Notes
        </CardTitle>
        <CardDescription>
          Add notes and comments about this material purchase
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Note Form */}
        <form onSubmit={handleCreateNote} className="space-y-4">
          <Textarea
            placeholder="Add a note..."
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            className="resize-none"
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              size="sm"
              disabled={isCreatingNote || !noteText.trim()}
            >
              {isCreatingNote && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Send className="h-4 w-4 mr-2" />
              Add Note
            </Button>
          </div>
        </form>

        <Separator />

        {/* Notes List */}
        <div className="space-y-4">
          {isLoadingNotes ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : notes.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              No notes yet. Add your first note above.
            </div>
          ) : (
            notes.map((note) => (
              <div key={note.id} className="flex space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{getInitials('User')}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">User</div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-muted-foreground">
                        {format(parseISO(note.created_at), 'MMM d, yyyy h:mm a')}
                      </span>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-destructive"
                            onClick={() => setNoteToDelete(note)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Note</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this note? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setNoteToDelete(null)}>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleDeleteNote}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              {isDeletingNote && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  <p className="text-sm">{note.text}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
