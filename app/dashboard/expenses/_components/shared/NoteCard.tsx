import React from 'react';
import { Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { cn, formatDate } from '@/lib/utils';
import { ExpenseNote } from '@/hooks/expenses';
import { StatusBadge } from './StatusBadge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface NoteCardProps {
  note: ExpenseNote;
  onEdit?: (note: ExpenseNote) => void;
  onDelete?: (id: string) => Promise<void>;
  isSubmitting?: boolean;
}

/**
 * A reusable card component for displaying note information
 */
export function NoteCard({ note, onEdit, onDelete, isSubmitting = false }: NoteCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between">
          <StatusBadge status={note.type} type="note" />
          <CardDescription>
            {formatDate(note.created_at || '')}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <p className="text-sm">{note.text}</p>
      </CardContent>
      <CardFooter className="flex justify-end gap-2 pt-0">
        {onEdit && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onEdit(note)}
            disabled={isSubmitting}
          >
            <Edit className="h-4 w-4" />
            <span className="sr-only">Edit</span>
          </Button>
        )}
        {onDelete && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                disabled={isSubmitting}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
                <span className="sr-only">Delete</span>
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
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(note.id)}
                  className="bg-red-500 hover:bg-red-600"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Deleting...' : 'Delete'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </CardFooter>
    </Card>
  );
}
