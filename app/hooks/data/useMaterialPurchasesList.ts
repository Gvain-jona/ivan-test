import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { API_ENDPOINTS } from '@/lib/api-endpoints';
import { MaterialPurchase } from './useMaterialPurchases';
import { toast } from 'sonner';

interface UseMaterialPurchasesListProps {
  mutate: (data?: any, options?: any) => Promise<any>;
}

export function useMaterialPurchasesList({ mutate }: UseMaterialPurchasesListProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Create a new material purchase with optimistic update
  const createMaterialPurchase = async (purchaseData: Partial<MaterialPurchase>) => {
    if (isCreating) return null;
    setIsCreating(true);

    // Generate a temporary ID for optimistic update
    const tempId = uuidv4();

    // Create an optimistic purchase object
    const optimisticPurchase: MaterialPurchase = {
      id: tempId,
      supplier_name: purchaseData.supplier_name || 'New Supplier',
      material_name: purchaseData.material_name || 'New Material',
      date: purchaseData.date || new Date().toISOString(),
      quantity: purchaseData.quantity || 1,
      total_amount: purchaseData.total_amount || 0,
      amount_paid: purchaseData.amount_paid || 0,
      balance: (purchaseData.total_amount || 0) - (purchaseData.amount_paid || 0),
      payment_status: (purchaseData.amount_paid || 0) >= (purchaseData.total_amount || 0)
        ? 'paid'
        : (purchaseData.amount_paid || 0) > 0
          ? 'partially_paid'
          : 'unpaid',
      notes: purchaseData.notes || '',
      created_by: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      // Add empty arrays for related data to prevent null/undefined errors
      payments: [],
      installments: [],
    };

    try {
      // Optimistically update the UI
      console.log('Before optimistic update - createMaterialPurchase');
      mutate(
        prev => {
          console.log('Optimistic update - prev:', prev);
          const updatedPurchases = prev ?
            {
              ...prev,
              purchases: [optimisticPurchase, ...(prev.purchases || [])]
            } :
            {
              purchases: [optimisticPurchase],
              total: 1,
              limit: 10,
              page: 1
            };
          console.log('Optimistic update - updatedPurchases:', updatedPurchases);
          return updatedPurchases;
        },
        { revalidate: false } // Don't revalidate yet
      );

      // Make the actual API call
      console.log('Making API call to create material purchase...');
      const response = await fetch(API_ENDPOINTS.MATERIALS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(purchaseData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to create material purchase');
      }

      // Update the cache with the actual data from the server
      console.log('Before server update - createMaterialPurchase');
      console.log('Server response - result:', result);

      // Extract the purchase from the result
      const serverPurchase = result.purchase || result.data?.purchase;

      if (!serverPurchase) {
        console.error('Server response does not contain purchase data:', result);
        throw new Error('Server response does not contain purchase data');
      }

      mutate(
        prev => {
          console.log('Server update - prev:', prev);
          if (!prev) return { purchases: [serverPurchase], total: 1, limit: 10, page: 1 };

          const updatedPurchases = {
            ...prev,
            purchases: prev.purchases.map(purchase =>
              purchase.id === tempId ? serverPurchase : purchase
            ),
          };
          console.log('Server update - updatedPurchases:', updatedPurchases);
          return updatedPurchases;
        },
        { revalidate: true } // Revalidate to ensure we have the correct data
      );

      // Show success toast with the purchase name for better user feedback
      const purchaseName = serverPurchase.material_name || 'New purchase';
      toast.success('Purchase Created', {
        description: `Created purchase "${purchaseName}" successfully`,
        duration: 4000,
      });

      console.log('Material purchase creation completed successfully');
      setIsCreating(false);
      return serverPurchase;
    } catch (error) {
      console.error('Error creating material purchase:', error);

      // Revert the optimistic update
      mutate(
        prev => {
          if (!prev) return { purchases: [], total: 0, limit: 10, page: 1 };

          return {
            ...prev,
            purchases: prev.purchases.filter(purchase => purchase.id !== tempId),
            total: prev.total > 0 ? prev.total - 1 : 0
          };
        },
        { revalidate: true } // Revalidate to ensure we have the correct data
      );

      // Show error toast
      toast.error('Failed to Create Purchase', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        duration: 5000,
      });

      setIsCreating(false);
      return null;
    }
  };

  // Update an existing material purchase with optimistic update
  const updateMaterialPurchase = async (id: string, purchaseData: Partial<MaterialPurchase>) => {
    if (isUpdating) return null;
    setIsUpdating(true);

    try {
      // Get the current purchase from the cache
      let currentPurchase: MaterialPurchase | undefined;
      mutate(
        prev => {
          if (!prev) return { purchases: [], total: 0, limit: 10, page: 1 };

          // Find the current purchase
          currentPurchase = prev.purchases.find(purchase => purchase.id === id);

          if (!currentPurchase) {
            throw new Error('Purchase not found');
          }

          // Create an optimistic updated purchase
          const updatedPurchase = {
            ...currentPurchase,
            ...purchaseData,
            balance: (purchaseData.total_amount || currentPurchase.total_amount) -
                    (purchaseData.amount_paid || currentPurchase.amount_paid),
            payment_status: (purchaseData.amount_paid || currentPurchase.amount_paid) >=
                           (purchaseData.total_amount || currentPurchase.total_amount)
                           ? 'paid'
                           : (purchaseData.amount_paid || currentPurchase.amount_paid) > 0
                             ? 'partially_paid'
                             : 'unpaid',
            updated_at: new Date().toISOString(),
            // Preserve existing payments and installments arrays
            payments: currentPurchase.payments || [],
            installments: currentPurchase.installments || [],
          };

          // Update the cache optimistically
          return {
            ...prev,
            purchases: prev.purchases.map(purchase =>
              purchase.id === id ? updatedPurchase : purchase
            ),
          };
        },
        { revalidate: false } // Don't revalidate yet
      );

      if (!currentPurchase) {
        throw new Error('Purchase not found');
      }

      // Make the actual API call
      console.log('Making API call to update material purchase...');
      const response = await fetch(`${API_ENDPOINTS.MATERIALS}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(purchaseData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to update material purchase');
      }

      // Update the cache with the actual data from the server
      console.log('Server response - update result:', result);

      // Extract the purchase from the result
      const serverPurchase = result.purchase || result.data?.purchase;

      if (!serverPurchase) {
        console.error('Server response does not contain purchase data:', result);
        throw new Error('Server response does not contain purchase data');
      }

      mutate(
        prev => {
          console.log('Server update - prev:', prev);
          if (!prev) return { purchases: [serverPurchase], total: 1, limit: 10, page: 1 };

          const updatedPurchases = {
            ...prev,
            purchases: prev.purchases.map(purchase =>
              purchase.id === id ? serverPurchase : purchase
            ),
          };
          console.log('Server update - updatedPurchases:', updatedPurchases);
          return updatedPurchases;
        },
        { revalidate: true } // Revalidate to ensure we have the correct data
      );

      // Show success toast
      toast.success('Purchase Updated', {
        description: `Updated purchase "${serverPurchase.material_name}" successfully`,
        duration: 4000,
      });

      console.log('Material purchase update completed successfully');
      setIsUpdating(false);
      return serverPurchase;
    } catch (error) {
      console.error('Error updating material purchase:', error);

      // Revalidate to revert the optimistic update
      mutate(undefined, { revalidate: true });

      // Show error toast
      toast.error('Failed to Update Purchase', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        duration: 5000,
      });

      setIsUpdating(false);
      return null;
    }
  };

  // Delete a material purchase with optimistic update
  const deleteMaterialPurchase = async (id: string) => {
    if (isDeleting) return false;
    setIsDeleting(true);

    // Store the purchase to be deleted for potential restoration
    let deletedPurchase: MaterialPurchase | undefined;

    try {
      // Optimistically update the UI
      mutate(
        prev => {
          if (!prev) return { purchases: [], total: 0, limit: 10, page: 1 };

          // Find the purchase to be deleted
          deletedPurchase = prev.purchases.find(purchase => purchase.id === id);

          if (!deletedPurchase) {
            throw new Error('Purchase not found');
          }

          // Remove the purchase from the cache
          return {
            ...prev,
            purchases: prev.purchases.filter(purchase => purchase.id !== id),
            total: prev.total > 0 ? prev.total - 1 : 0
          };
        },
        { revalidate: false } // Don't revalidate yet
      );

      if (!deletedPurchase) {
        throw new Error('Purchase not found');
      }

      // Make the actual API call
      console.log('Making API call to delete material purchase...');
      const response = await fetch(`${API_ENDPOINTS.MATERIALS}/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to delete material purchase');
      }

      // Show success toast
      toast.success('Purchase Deleted', {
        description: `Deleted purchase "${deletedPurchase.material_name}" successfully`,
        duration: 4000,
      });

      console.log('Material purchase deletion completed successfully');
      setIsDeleting(false);
      return true;
    } catch (error) {
      console.error('Error deleting material purchase:', error);

      // Restore the deleted purchase
      if (deletedPurchase) {
        mutate(
          prev => {
            if (!prev) return { purchases: [deletedPurchase!], total: 1, limit: 10, page: 1 };

            return {
              ...prev,
              purchases: [...prev.purchases, deletedPurchase!],
              total: prev.total + 1
            };
          },
          { revalidate: true } // Revalidate to ensure we have the correct data
        );
      }

      // Show error toast
      toast.error('Failed to Delete Purchase', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        duration: 5000,
      });

      setIsDeleting(false);
      return false;
    }
  };

  return {
    createMaterialPurchase,
    updateMaterialPurchase,
    deleteMaterialPurchase,
    isCreating,
    isUpdating,
    isDeleting,
  };
}
