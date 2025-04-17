import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { clearAllOrderFormData } from '@/utils/form-storage';
import { Button } from '@/components/ui/button';
import { Order, OrderPayment, ClientType } from '@/types/orders';
import { Ban, Save, FileText, Box, CreditCard, StickyNote, AlertCircle, CheckCircle, Loader2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useModalState } from '@/hooks/ui/useModalState';
import { useOrderForm } from '@/hooks/orders/useOrderForm';
import { useOrderCreation } from '@/hooks/useOrderCreation';
import ApprovalDialog, { DeletionRequest, DeletionType } from '@/components/ui/approval-dialog';
import OrderSheet from '@/components/ui/sheets/OrderSheet';
import { motion } from 'framer-motion';
import { buttonHover } from '@/utils/animation-variants';
import { orderSchema } from '@/schemas/order-schema';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ComboboxOption } from '@/components/ui/combobox';
import ValidationSummary from '@/components/ui/form/ValidationSummary';
import useSWR from 'swr';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// Enhanced fetcher for SWR with error handling
const fetcher = async (url: string) => {
  try {
    const res = await fetch(url);

    // Handle HTTP errors
    if (!res.ok) {
      // For 404 errors, return an empty array instead of throwing
      if (res.status === 404) {
        console.warn(`Resource not found: ${url}, returning empty array`);
        return [];
      }

      // For other errors, throw
      const errorText = await res.text();
      throw new Error(`API error: ${res.status} ${errorText}`);
    }

    // Parse JSON response
    return res.json();
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    // Return empty array as fallback
    return [];
  }
};

// Import sub-components
import OrderGeneralInfoForm from './OrderFormModal/OrderGeneralInfoForm';
import OrderItemsForm from './OrderFormModal/OrderItemsForm';
import OrderPaymentsForm from './OrderFormModal/OrderPaymentsForm';
import OrderNotesForm from './OrderFormModal/OrderNotesForm';

interface OrderFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (order: Order) => void;
  initialOrder?: Order;
  title: string;
  isEditing: boolean;
}

/**
 * Order form sheet component for creating and editing orders
 * Uses the side panel sheet layout instead of a modal
 */
const OrderFormSheet: React.FC<OrderFormSheetProps> = ({
  open,
  onOpenChange,
  onSave,
  initialOrder,
  title,
  isEditing,
}) => {
  const { toast } = useToast();

  // Fetch data from API or context with SWR cache configuration to prevent excessive requests
  const { data: clientsData = [], isLoading: isClientsLoading } = useSWR<ComboboxOption[]>(
    '/api/clients',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minute
      focusThrottleInterval: 60000 // 1 minute
    }
  );

  const { data: categoriesData = [], isLoading: isCategoriesLoading } = useSWR<ComboboxOption[]>(
    '/api/categories',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
      focusThrottleInterval: 60000
    }
  );

  const { data: itemsData = [], isLoading: isItemsLoading } = useSWR<(ComboboxOption & { categoryId?: string })[]>(
    '/api/items',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
      focusThrottleInterval: 60000
    }
  );

  // Use memoized data to prevent unnecessary re-renders
  const clients = useMemo<ComboboxOption[]>(() => clientsData, [clientsData]);
  const categories = useMemo<ComboboxOption[]>(() => categoriesData, [categoriesData]);
  const items = useMemo<(ComboboxOption & { categoryId?: string })[]>(() => itemsData, [itemsData]);

  // Use our custom hooks for modal and form state
  const deleteDialog = useModalState();
  const confirmDialog = useModalState();
  const { order, updateOrderField, updateOrderFields, recalculateOrder, resetOrder, isDirty } = useOrderForm({
    initialOrder
  });

  // State for item to delete
  const [itemToDelete, setItemToDelete] = useState<{
    id: string;
    index: number;
    name: string;
    type: DeletionType;
  } | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
  const [activeTab, setActiveTab] = useState<string>('general-info');
  const [formStatus, setFormStatus] = useState<'idle' | 'validating' | 'saving' | 'success' | 'error'>('idle');

  // Use refs to track component mount state and timeouts
  const isMountedRef = useRef(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Enhanced form state management for all tabs
  // Using separate state objects for different parts of the form state to prevent maximum depth issues
  const [formIds, setFormIds] = useState({
    itemForms: [0], // Start with one form
    noteForms: [0], // Start with one form
    paymentForms: [0] // Start with one form
  });

  const [formIdCounters, setFormIdCounters] = useState({
    items: 1,
    payments: 1,
    notes: 1
  });

  // Use useRef for partial data to prevent excessive re-renders
  // This is especially important for complex nested objects
  const partialDataRef = useRef({
    items: {}, // Keyed by formIndex
    payments: {},
    notes: {}
  });

  // Create a memoized formState object that combines the separate state pieces
  // This prevents the need to update multiple components when only one part changes
  const formState = useMemo(() => ({
    itemForms: formIds.itemForms,
    noteForms: formIds.noteForms,
    paymentForms: formIds.paymentForms,
    formIdCounters,
    partialData: partialDataRef.current
  }), [formIds, formIdCounters]);

  // Clear any pending timeouts when component unmounts
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  // Initialize form state based on existing order data
  useEffect(() => {
    if (open) {
      // Ensure calculations are up-to-date when the form opens
      recalculateOrder();
    }
  }, [open, recalculateOrder]);

  // Safe state update functions that check if component is still mounted
  const safeSetFormStatus = useCallback((status: 'idle' | 'validating' | 'saving' | 'success' | 'error') => {
    if (isMountedRef.current) {
      setFormStatus(status);
    }
  }, []);

  const safeSetIsSaving = useCallback((saving: boolean) => {
    if (isMountedRef.current) {
      setIsSaving(saving);
    }
  }, []);

  const safeSetValidationErrors = useCallback((errors: Record<string, string[]>) => {
    if (isMountedRef.current) {
      setValidationErrors(errors);
    }
  }, []);

  // Simplified form state management - no longer needed

  const safeSetActiveTab = useCallback((tab: string) => {
    if (isMountedRef.current && tab !== activeTab) { // Only update if tab is different
      console.log('Switching from tab', activeTab, 'to', tab);

      // Set the new active tab
      setActiveTab(tab);

      // Recalculate order totals when switching to the general-info tab
      // This ensures the financial summary is always up-to-date
      if (tab === 'general-info') {
        recalculateOrder();
      }

      // We don't reset any form state when switching tabs
      // This ensures that user data is preserved across tab switches
    }
  }, [activeTab, recalculateOrder, isMountedRef]);



  // Validate the form and return true if valid
  const validateForm = useCallback(() => {
    if (!isMountedRef.current) return false;

    safeSetFormStatus('validating');

    try {
      // Validate the order against the schema
      const result = orderSchema.safeParse(order);

      if (!result.success) {
        // Format and store validation errors
        const formattedErrors: Record<string, string[]> = {};
        const errorSections: Record<string, boolean> = {
          'general-info': false,
          'items': false,
          'payments': false,
          'notes': false
        };

        // Process all errors
        result.error.errors.forEach((error) => {
          const path = error.path.join('.');
          if (!formattedErrors[path]) {
            formattedErrors[path] = [];
          }
          formattedErrors[path].push(error.message);

          // Mark which section has errors
          if (['client_id', 'date', 'client_type', 'status'].includes(error.path[0])) {
            errorSections['general-info'] = true;
          } else if (error.path[0] === 'items') {
            errorSections['items'] = true;
          } else if (error.path[0] === 'payments') {
            errorSections['payments'] = true;
          } else if (error.path[0] === 'notes') {
            errorSections['notes'] = true;
          }
        });

        if (isMountedRef.current) {
          safeSetValidationErrors(formattedErrors);

          // Set active section to the first one with errors
          for (const section of ['general-info', 'items', 'payments', 'notes']) {
            if (errorSections[section]) {
              safeSetActiveTab(section);
              break;
            }
          }

          safeSetFormStatus('error');

          // Show toast with error message and specific fields that need attention
          const errorSectionNames = Object.entries(errorSections)
            .filter(([_, hasError]) => hasError)
            .map(([section, _]) => {
              switch(section) {
                case 'general-info': return 'General Info';
                case 'items': return 'Items';
                case 'payments': return 'Payments';
                case 'notes': return 'Notes';
                default: return section;
              }
            });

          toast({
            title: "Validation Error",
            description: `Please fix the highlighted errors in: ${errorSectionNames.join(', ')}`,
            variant: "destructive",
          });
        }

        return false;
      }

      // Clear any previous validation errors
      if (isMountedRef.current) {
        safeSetValidationErrors({});
        safeSetFormStatus('idle');
      }
      return true;
    } catch (error) {
      console.error("Validation error:", error);

      if (isMountedRef.current) {
        safeSetFormStatus('error');

        toast({
          title: "Validation Error",
          description: "An unexpected error occurred during validation.",
          variant: "destructive",
        });
      }

      return false;
    }
  }, [order, safeSetFormStatus, safeSetValidationErrors, safeSetActiveTab, toast]);

  // Use our custom hook for order creation
  const { createOrder, loading: isCreatingOrder } = useOrderCreation({
    onSuccess: (orderId) => {
      if (!isMountedRef.current) return;

      safeSetFormStatus('success');
      toast({
        title: "Success",
        description: `Order ${isEditing ? 'updated' : 'created'} successfully.`,
      });

      // Reset the form for a new order if not editing
      if (!isEditing) {
        try {
          console.log('Resetting form for new entry');
          // Clear all form data from localStorage
          clearAllOrderFormData();
          resetOrder();
          // Reset form state
          setFormState({
            itemForms: [],
            paymentForms: [],
            noteForms: [],
            formIdCounters: {
              items: 1,
              payments: 1,
              notes: 1
            }
          });
          // Reset form sections
          if (isMountedRef.current) {
            safeSetActiveTab('general-info');
            safeSetValidationErrors({});
            safeSetFormStatus('idle');
            // Ensure calculations are up-to-date for the new form
            recalculateOrder();
          }
        } catch (resetError) {
          console.error('Error resetting form:', resetError);
          // If reset fails, just close the form
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }

          timeoutRef.current = setTimeout(() => {
            if (isMountedRef.current) {
              onOpenChange(false);
            }
          }, 1000);
        }
      } else {
        // Close the form after a short delay if editing
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            onOpenChange(false);
          }
        }, 1000);
      }
    }
  });

  const handleSave = useCallback(async () => {
    // Validate the form before saving
    if (!validateForm()) {
      return;
    }

    safeSetIsSaving(true);
    safeSetFormStatus('saving');

    try {
      console.log('Saving order:', {
        id: order.id,
        client_id: order.client_id,
        client_name: order.client_name,
        client_type: order.client_type,
        date: order.date,
        status: order.status,
        items: order.items?.length,
        itemsData: order.items
      });

      // If editing, use the original onSave function
      if (isEditing) {
        // Call the actual API through the onSave function and wait for the result
        const result = await onSave(order as Order);

        // Check if the save was successful
        if (result && result.success) {
          safeSetFormStatus('success');

          if (isMountedRef.current) {
            toast({
              title: "Success",
              description: `Order updated successfully.`,
            });

            // If editing, close the form after a short delay
            if (isEditing) {
              // Clear any existing timeout
              if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
              }

              // Set new timeout and store the reference
              timeoutRef.current = setTimeout(() => {
                if (isMountedRef.current) {
                  onOpenChange(false);
                }
              }, 1000);
            } else {
              // If creating a new order, reset the form for another entry
              try {
                console.log('Resetting form for new entry');
                resetOrder();
                // Reset form sections
                safeSetActiveTab('general-info');
                safeSetValidationErrors({});
                safeSetFormStatus('idle');
              } catch (resetError) {
                console.error('Error resetting form:', resetError);
                // If reset fails, just close the form
                if (timeoutRef.current) {
                  clearTimeout(timeoutRef.current);
                }

                timeoutRef.current = setTimeout(() => {
                  if (isMountedRef.current) {
                    onOpenChange(false);
                  }
                }, 1000);
              }
            }
          }
        } else {
          throw new Error('Failed to update order');
        }
      } else {
        // For new orders, use our new createOrder function
        console.log('Creating new order with items:', order.items);

        try {
          const result = await createOrder(order as Order);

          console.log('Create order result:', result);

          if (!result) {
            throw new Error('Failed to create order');
          }

          // Show a single success toast
          if (isMountedRef.current) {
            safeSetFormStatus('success');

            toast({
              title: "Order Created",
              description: `New order has been created successfully.`,
              variant: "default",
            });

            // Reset the form for another entry
            try {
              console.log('Resetting form for new entry');
              resetOrder();
              // Reset form sections
              safeSetActiveTab('general-info');
              safeSetValidationErrors({});
              safeSetFormStatus('idle');
            } catch (resetError) {
              console.error('Error resetting form:', resetError);
            }
          }
        } catch (createError) {
          console.error('Error in createOrder:', createError);
          throw createError;
        }
      }
    } catch (error) {
      console.error("Error saving order:", error);

      if (isMountedRef.current) {
        safeSetFormStatus('error');

        toast({
          title: "Error",
          description: `Failed to ${isEditing ? 'update' : 'create'} order. Please try again.`,
          variant: "destructive",
        });
      }
    } finally {
      if (isMountedRef.current) {
        safeSetIsSaving(false);
      }
    }
  }, [validateForm, order, isEditing, onSave, onOpenChange, createOrder, safeSetIsSaving, safeSetFormStatus, safeSetValidationErrors, safeSetActiveTab, toast, resetOrder]);

  const handleDeleteRequest = (request: Omit<DeletionRequest, 'id' | 'requestedAt' | 'status'>) => {
    if (!itemToDelete) return;

    // For now, we just remove the item from the UI
    if (request.type === 'item') {
      const newItems = [...(order.items || [])];
      newItems.splice(itemToDelete.index, 1);
      updateOrderFields({ items: newItems });
      recalculateOrder();
    } else if (request.type === 'payment') {
      // Cast to any to handle potential missing fields in the type
      const payments = (order as any).payments || [];
      const newPayments = [...payments];
      newPayments.splice(itemToDelete.index, 1);
      // Use type assertion to update the payments
      updateOrderFields({ payments: newPayments } as any);
      recalculateOrder();
    } else if (request.type === 'note') {
      const newNotes = [...(order.notes || [])];
      newNotes.splice(itemToDelete.index, 1);
      updateOrderFields({ notes: newNotes });
    }

    // Reset state
    setItemToDelete(null);
  };

  // Handle sheet close with unsaved changes
  const handleSheetClose = useCallback((isOpen: boolean) => {
    if (!isOpen && isDirty) {
      // Show a custom confirmation dialog instead of browser alert
      confirmDialog.setOpen(true);
    } else if (!isOpen) {
      // If not dirty, just close the sheet
      onOpenChange(false);
    } else {
      // If opening the sheet, just pass through
      onOpenChange(true);
    }
  }, [isDirty, onOpenChange, confirmDialog]);

  const openDeleteDialog = (id: string, index: number, name: string, type: DeletionType) => {
    setItemToDelete({ id, index, name, type });
    deleteDialog.setOpen(true);
  };

  return (
    <>
      <OrderSheet
        open={open}
        onOpenChange={handleSheetClose}
        title={title}
        size="lg"
        showCloseButton={false} // Remove the close button in the header
      >
        <div className="p-6 flex-1 overflow-y-auto overflow-x-hidden bg-background" style={{ maxHeight: 'calc(100vh - 140px)' }}>
          {/* Show validation summary when there are errors */}
          {Object.keys(validationErrors).length > 0 && formStatus === 'error' && (
            <ValidationSummary
              errors={validationErrors}
              title="Please fix the following errors:"
              onSectionClick={setActiveTab}
            />
          )}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6 transition-all duration-300 ease-in-out">
            <TabsList className="bg-card border border-border/60 rounded-lg p-3 mb-6 w-full flex flex-wrap justify-between gap-2 overflow-x-hidden min-h-[60px]">
              <TabsTrigger
                value="general-info"
                className="text-sm font-medium text-muted-foreground py-2.5 px-4 rounded-md data-[state=active]:bg-foreground data-[state=active]:text-background hover:bg-muted/10 transition-all flex-1 truncate"
              >
                <FileText className="mr-2 h-4 w-4" />
                General Info
                {validationErrors['client_id'] || validationErrors['date'] || validationErrors['client_type'] || validationErrors['status'] ? (
                  <AlertCircle className="ml-2 h-4 w-4 text-destructive" />
                ) : null}
              </TabsTrigger>
              <TabsTrigger
                value="items"
                className="text-sm font-medium text-muted-foreground py-2.5 px-4 rounded-md data-[state=active]:bg-foreground data-[state=active]:text-background hover:bg-muted/10 transition-all flex-1 truncate"
              >
                <Box className="mr-2 h-4 w-4" />
                Items
                {order.items && order.items.length > 0 && (
                  <span className="ml-2 min-w-5 bg-muted/30 px-1.5 py-0.5 text-xs font-medium text-muted-foreground rounded-full">{order.items.length}</span>
                )}
                {validationErrors['items'] ? (
                  <AlertCircle className="ml-2 h-4 w-4 text-destructive" />
                ) : null}
              </TabsTrigger>
              <TabsTrigger
                value="payments"
                className="text-sm font-medium text-muted-foreground py-2.5 px-4 rounded-md data-[state=active]:bg-foreground data-[state=active]:text-background hover:bg-muted/10 transition-all flex-1 truncate"
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Payments
                {order.payments && order.payments.length > 0 && (
                  <span className="ml-2 min-w-5 bg-muted/30 px-1.5 py-0.5 text-xs font-medium text-muted-foreground rounded-full">{order.payments.length}</span>
                )}
                {validationErrors['payments'] ? (
                  <AlertCircle className="ml-2 h-4 w-4 text-destructive" />
                ) : null}
              </TabsTrigger>
              <TabsTrigger
                value="notes"
                className="text-sm font-medium text-muted-foreground py-2.5 px-4 rounded-md data-[state=active]:bg-foreground data-[state=active]:text-background hover:bg-muted/10 transition-all flex-1 truncate"
              >
                <StickyNote className="mr-2 h-4 w-4" />
                Notes
                {order.notes && order.notes.length > 0 && (
                  <span className="ml-2 min-w-5 bg-muted/30 px-1.5 py-0.5 text-xs font-medium text-muted-foreground rounded-full">{order.notes.length}</span>
                )}
                {validationErrors['notes'] ? (
                  <AlertCircle className="ml-2 h-4 w-4 text-destructive" />
                ) : null}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general-info" className="mt-2 px-1 animate-in fade-in-50 slide-in-from-left-5 duration-300 transition-all overflow-x-hidden">
              <OrderGeneralInfoForm
                active={true} // Always set to true to ensure the form is interactive
                order={order}
                updateOrderField={updateOrderField}
                isEditing={isEditing}
                clients={clients}
                errors={validationErrors}
              />
            </TabsContent>

            <TabsContent value="items" className="mt-2 px-1 animate-in fade-in-50 slide-in-from-right-5 duration-300 transition-all overflow-x-hidden">
              <OrderItemsForm
                active={true} // Always set to true to ensure the form is interactive
                order={order}
                updateOrderFields={updateOrderFields}
                openDeleteDialog={openDeleteDialog}
                recalculateOrder={recalculateOrder}
                categories={categories}
                items={items}
                errors={validationErrors}
                formState={formState.itemForms}
                partialData={formState.partialData.items}
                onAddForm={() => {
                  // Update form IDs separately to prevent maximum depth issues
                  const counter = formIdCounters.items;
                  setFormIds(prev => ({
                    ...prev,
                    itemForms: [...prev.itemForms, counter]
                  }));

                  // Update counter separately
                  setFormIdCounters(prev => ({
                    ...prev,
                    items: prev.items + 1
                  }));
                }}
                onRemoveForm={(index) => {
                  // Update form IDs separately
                  setFormIds(prev => ({
                    ...prev,
                    itemForms: prev.itemForms.filter(formId => formId !== index)
                  }));

                  // Update partial data using ref to prevent re-renders
                  if (partialDataRef.current.items[index]) {
                    delete partialDataRef.current.items[index];
                  }
                }}
                onUpdatePartialData={(index, data) => {
                  // Update partial data directly in the ref to prevent re-renders
                  partialDataRef.current.items[index] = data;
                }}
              />
            </TabsContent>

            <TabsContent value="payments" className="mt-2 px-1 animate-in fade-in-50 slide-in-from-right-5 duration-300 transition-all overflow-x-hidden">
              <OrderPaymentsForm
                active={true} // Always set to true to ensure the form is interactive
                order={order}
                updateOrderFields={updateOrderFields}
                openDeleteDialog={openDeleteDialog}
                recalculateOrder={recalculateOrder}
                toast={toast}
                errors={validationErrors}
                formState={formState.paymentForms}
                partialData={formState.partialData.payments}
                onAddForm={() => {
                  // Update form IDs separately to prevent maximum depth issues
                  const counter = formIdCounters.payments;
                  setFormIds(prev => ({
                    ...prev,
                    paymentForms: [...prev.paymentForms, counter]
                  }));

                  // Update counter separately
                  setFormIdCounters(prev => ({
                    ...prev,
                    payments: prev.payments + 1
                  }));
                }}
                onRemoveForm={(index) => {
                  // Update form IDs separately
                  setFormIds(prev => ({
                    ...prev,
                    paymentForms: prev.paymentForms.filter(formId => formId !== index)
                  }));

                  // Update partial data using ref to prevent re-renders
                  if (partialDataRef.current.payments[index]) {
                    delete partialDataRef.current.payments[index];
                  }
                }}
                onUpdatePartialData={(index, data) => {
                  // Update partial data directly in the ref to prevent re-renders
                  partialDataRef.current.payments[index] = data;
                }}
              />
            </TabsContent>

            <TabsContent value="notes" className="mt-2 px-1 animate-in fade-in-50 slide-in-from-right-5 duration-300 transition-all overflow-x-hidden">
              <OrderNotesForm
                active={true} // Always set to true to ensure the form is interactive
                order={order}
                updateOrderFields={updateOrderFields}
                openDeleteDialog={openDeleteDialog}
                errors={validationErrors}
                formState={formState.noteForms}
                partialData={formState.partialData.notes}
                onAddForm={() => {
                  // Update form IDs separately to prevent maximum depth issues
                  const counter = formIdCounters.notes;
                  setFormIds(prev => ({
                    ...prev,
                    noteForms: [...prev.noteForms, counter]
                  }));

                  // Update counter separately
                  setFormIdCounters(prev => ({
                    ...prev,
                    notes: prev.notes + 1
                  }));
                }}
                onRemoveForm={(index) => {
                  // Update form IDs separately
                  setFormIds(prev => ({
                    ...prev,
                    noteForms: prev.noteForms.filter(formId => formId !== index)
                  }));

                  // Update partial data using ref to prevent re-renders
                  if (partialDataRef.current.notes[index]) {
                    delete partialDataRef.current.notes[index];
                  }
                }}
                onUpdatePartialData={(index, data) => {
                  // Update partial data directly in the ref to prevent re-renders
                  partialDataRef.current.notes[index] = data;
                }}
              />
            </TabsContent>
          </Tabs>
        </div>

        <div className="border-t border-border/40 p-6 flex justify-between bg-card sticky bottom-0 left-0 right-0">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="outline"
              className="border-border/40 bg-transparent hover:bg-muted/50 text-muted-foreground hover:text-foreground"
              onClick={() => {
                try {
                  // Clear form data from localStorage
                  clearAllOrderFormData();

                  // Reset form state - split into separate updates to prevent maximum depth issues
                  setFormIds({
                    itemForms: [0],
                    noteForms: [0],
                    paymentForms: [0]
                  });

                  setFormIdCounters({
                    items: 1,
                    payments: 1,
                    notes: 1
                  });

                  // Reset partial data ref
                  partialDataRef.current = {
                    items: {},
                    payments: {},
                    notes: {}
                  };

                  if (isEditing) {
                    // Close the form
                    onOpenChange(false);
                  } else {
                    // Reset the form for a new entry
                    resetOrder();
                    if (isMountedRef.current) {
                      safeSetActiveTab('general-info');
                      safeSetValidationErrors({});
                      // Ensure calculations are reset
                      recalculateOrder();
                    }
                  }
                } catch (error) {
                  console.error('Error during form clear/cancel:', error);
                  // Ensure we still close the form on error if in edit mode
                  if (isEditing) {
                    onOpenChange(false);
                  }
                }
              }}
              disabled={isSaving}
            >
              <Ban className="mr-2 h-4 w-4" />
              {isEditing ? 'Cancel' : 'Clear Form'}
            </Button>
          </motion.div>

          <motion.div whileHover={{ scale: isSaving ? 1 : 1.05 }} whileTap={{ scale: isSaving ? 1 : 0.95 }}>
            <Button
              className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[150px]"
              onClick={handleSave}
              disabled={isSaving}
            >
              {formStatus === 'saving' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : formStatus === 'success' ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  {isEditing ? 'Updated' : 'Created'}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {isEditing ? 'Update Order' : 'Create Order'}
                </>
              )}
            </Button>
          </motion.div>
        </div>
      </OrderSheet>

      {/* Approval Dialog */}
      {itemToDelete && (
        <ApprovalDialog
          open={deleteDialog.isOpen}
          onOpenChange={deleteDialog.setOpen}
          itemId={itemToDelete.id}
          itemName={itemToDelete.name}
          type={itemToDelete.type}
          onApprove={handleDeleteRequest}
          approvalNote="This action cannot be undone."
        />
      )}

      {/* Unsaved Changes Confirmation Dialog */}
      <Dialog open={confirmDialog.isOpen} onOpenChange={confirmDialog.setOpen}>
        <DialogContent className="sm:max-w-md bg-card border border-border/40 text-foreground">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Unsaved Changes
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              You have unsaved changes that will be lost if you close this form.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-between mt-4">
            <Button
              variant="outline"
              className="border-border/40 bg-transparent hover:bg-muted/50 text-muted-foreground hover:text-foreground"
              onClick={() => confirmDialog.setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                confirmDialog.setOpen(false);
                onOpenChange(false);
              }}
            >
              Discard Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default OrderFormSheet;