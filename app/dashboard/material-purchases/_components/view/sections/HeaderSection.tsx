'use client';

import React, { useState } from 'react';
import { X, Trash2, Loader2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SheetHeader, SheetClose } from '@/components/ui/sheet';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatDate } from '@/lib/utils';
import { useMaterialPurchaseView } from '../context/MaterialPurchaseViewContext';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export function HeaderSection() {
  const { purchase, onDelete, isDeleting } = useMaterialPurchaseView();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  if (!purchase) return null;

  // Get initials from material name
  const getInitials = (name: string) => {
    if (!name) return 'MP';
    return name.split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  };

  // Handle delete purchase
  const handleConfirmedDelete = async () => {
    try {
      await onDelete(purchase.id);
    } catch (error) {
      console.error('Error deleting material purchase:', error);
    }
  };

  return (
    <>
      <SheetHeader className="px-6 py-4 border-b border-border/40">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12 bg-blue-100">
              <AvatarFallback className="bg-blue-100 text-blue-700">
                {getInitials(purchase.material_name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-semibold">{purchase.material_name}</h2>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="text-xs px-2 py-0.5 rounded-full bg-muted/30 text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(purchase.date)}
                </span>
                {purchase.supplier_name && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted/30 text-muted-foreground">
                    {purchase.supplier_name}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <SheetClose asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </SheetClose>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setDeleteDialogOpen(true)}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 text-destructive" />
              )}
            </Button>
          </div>
        </div>
      </SheetHeader>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Material Purchase</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this material purchase? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmedDelete}
              className="bg-red-500 hover:bg-red-600"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
