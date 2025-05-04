'use client';

import React, { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet';
import { MaterialPurchase } from '@/types/materials';
import { useMaterialPurchaseDetails } from '@/hooks/materials/useMaterialPurchases';
import { MaterialPurchaseViewContext } from './context/MaterialPurchaseViewContext';
import { HeaderSection } from './sections/HeaderSection';
import { DetailsSection } from './sections/DetailsSection';
import { FinancialSummarySection } from './sections/FinancialSummarySection';
import { PaymentsSection } from './sections/PaymentsSection';
import { NotesSection } from './sections/NotesSection';
import { InstallmentsSection } from './sections/InstallmentsSection';

interface MaterialPurchaseViewSheetProps {
  purchase: MaterialPurchase;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (purchase: MaterialPurchase) => Promise<any>;
  onDelete: (id: string) => Promise<void>;
}

export function MaterialPurchaseViewSheet({
  purchase: initialPurchase,
  open,
  onOpenChange,
  onEdit,
  onDelete
}: MaterialPurchaseViewSheetProps) {
  // Use the purchase ID to fetch the latest data if needed
  const purchaseId = initialPurchase?.id;

  // Use the hook with the initialPurchase as fallbackData to avoid unnecessary fetching
  const {
    purchase: fetchedPurchase,
    isLoading,
    isError,
    mutate: refreshPurchase
  } = useMaterialPurchaseDetails(purchaseId, {
    fallbackData: initialPurchase,
    revalidateOnMount: true, // Always revalidate on mount to ensure we have the latest data
    revalidateOnFocus: false, // Don't revalidate on focus to avoid unnecessary API calls
    dedupingInterval: 10000, // 10 seconds - reduce duplicate requests
  });

  // Use the fetched purchase if available, otherwise fall back to the initial purchase
  const purchase = fetchedPurchase || initialPurchase;

  // Refresh data when the sheet is opened
  useEffect(() => {
    if (open && purchaseId) {
      refreshPurchase();
    }
  }, [open, purchaseId, refreshPurchase]);

  // Ensure purchase has all required arrays initialized
  const normalizedPurchase = purchase ? {
    ...purchase,
    payments: Array.isArray(purchase.payments) ? purchase.payments : [],
    installments: Array.isArray(purchase.installments) ? purchase.installments : [],
    purchase_notes: Array.isArray(purchase.purchase_notes) ? purchase.purchase_notes : []
  } : null;

  // Loading state for delete operation
  const [isDeleting, setIsDeleting] = useState(false);

  // Handle delete purchase with loading state
  const handleDelete = async (id: string) => {
    try {
      setIsDeleting(true);
      await onDelete(id);
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting material purchase:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Context value for child components
  const contextValue = {
    purchase: normalizedPurchase,
    isLoading,
    isError,
    refreshPurchase,
    onEdit,
    onDelete: handleDelete,
    isDeleting
  };

  if (!normalizedPurchase) return null;

  return (
    <MaterialPurchaseViewContext.Provider value={contextValue}>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-xl w-full p-0 overflow-y-auto" hideCloseButton={true}>
          {/* Header */}
          <HeaderSection />

          <div className="px-6 py-5 space-y-8">
            {/* Details Section */}
            <DetailsSection />

            {/* Financial Summary Section */}
            <FinancialSummarySection />

            {/* Installments Section - Only showing settings, cards are temporarily hidden */}
            {(normalizedPurchase.installment_plan || normalizedPurchase.enable_installments) && (
              <InstallmentsSection />
            )}

            {/* Payments Section */}
            <PaymentsSection />

            {/* Notes Section */}
            <NotesSection />
          </div>
        </SheetContent>
      </Sheet>
    </MaterialPurchaseViewContext.Provider>
  );
}
