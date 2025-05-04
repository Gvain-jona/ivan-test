import React, { useState, useRef } from 'react';
import { Eye, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MaterialPurchase } from '@/types/materials';
import { MaterialPurchaseDeleteConfirmation } from './MaterialPurchaseDeleteConfirmation';

interface MaterialPurchaseActionsProps {
  purchase: MaterialPurchase;
  onView: (purchase: MaterialPurchase) => void;
  onDelete: (id: string) => Promise<void>;
}

/**
 * Actions component for the material purchases table
 */
export function MaterialPurchaseActions({
  purchase,
  onView,
  onDelete,
}: MaterialPurchaseActionsProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const isProcessingRef = useRef(false);

  // Handle delete action with visual feedback
  const handleDeleteAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    // Prevent multiple rapid actions
    if (isProcessingRef.current) return;

    // Set processing flag to prevent multiple triggers
    isProcessingRef.current = true;

    // Add visual feedback with a slight delay before action
    const element = e.currentTarget as HTMLElement;
    if (element) {
      element.classList.add('bg-red-900/30');
    }

    // Open the confirmation dialog after a short delay
    setTimeout(() => {
      // Reset loading state when opening the dialog
      setDeleteLoading(false);
      setDeleteDialogOpen(true);

      // Reset processing flag after a delay
      setTimeout(() => {
        isProcessingRef.current = false;
        if (element) {
          element.classList.remove('bg-red-900/30');
        }
      }, 300);
    }, 50);
  };

  // Handle confirmed delete
  const handleConfirmedDelete = async () => {
    setDeleteLoading(true);
    try {
      await onDelete(purchase.id);
    } finally {
      setDeleteLoading(false);
      setDeleteDialogOpen(false);
    }
  };

  return (
    <div className="flex justify-end gap-1.5">
      {/* View button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-md hover:bg-muted/20"
        onClick={() => onView(purchase)}
        title="View material purchase details"
      >
        <Eye className="h-4 w-4" />
        <span className="sr-only">View</span>
      </Button>

      {/* Delete button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-md hover:bg-red-100 dark:hover:bg-red-900/20"
        title="Delete material purchase"
        onClick={handleDeleteAction}
      >
        <Trash2 className="h-4 w-4 text-red-500" />
        <span className="sr-only">Delete</span>
      </Button>

      {/* Delete confirmation dialog */}
      <MaterialPurchaseDeleteConfirmation
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmedDelete}
        isLoading={deleteLoading}
      />
    </div>
  );
}
