'use client';

import { useState } from 'react';
import { MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

interface RecordActionsProps {
  /** Open the edit sheet for this record. */
  onEdit: () => void;
  /**
   * Archive the record. Must handle its own errors (toast) and navigation —
   * this component only drives the confirm + the in-flight state, and does not
   * surface failures itself. Archiving is v2's delete: records are never hard
   * removed.
   */
  onArchive: () => void | Promise<void>;
  /** The kind of record, lowercase — "client", "product". Used in copy + labels. */
  noun: string;
  /** The record's name, shown in the confirm prompt. */
  name: string;
}

/**
 * The trailing header menu for a detail record (C2/D2): Edit, and Archive
 * behind a confirm. One wired kebab rather than two competing header buttons,
 * and the destructive action is gated by an AlertDialog so a stray tap can't
 * delete a client mid-scroll.
 */
export function RecordActions({ onEdit, onArchive, noun, name }: RecordActionsProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [archiving, setArchiving] = useState(false);

  const archive = async () => {
    if (archiving) return;
    setArchiving(true);
    try {
      await onArchive();
    } finally {
      setArchiving(false);
      setConfirmOpen(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={`${noun} actions`}
            className="rounded text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <MoreVertical className="h-[20px] w-[20px]" strokeWidth={2} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={onEdit}>Edit</DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            // Keep the menu's select from stealing focus before the dialog mounts.
            onSelect={event => {
              event.preventDefault();
              setConfirmOpen(true);
            }}
          >
            Archive
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmOpen} onOpenChange={open => !archiving && setConfirmOpen(open)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive {name}?</AlertDialogTitle>
            <AlertDialogDescription>
              It will be hidden from lists and pickers. Existing orders keep it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={archiving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={event => {
                event.preventDefault();
                void archive();
              }}
              disabled={archiving}
              className={cn(
                'bg-destructive text-destructive-foreground hover:bg-destructive/90',
              )}
            >
              {archiving ? 'Archiving…' : `Archive ${noun}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
