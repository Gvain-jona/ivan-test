import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { clearAllOrderFormData } from '@/utils/form-storage';
import { Button } from '@/components/ui/button';
import { Order, OrderPayment, ClientType } from '@/types/orders';
import { Ban, Save, FileText, Box, CreditCard, StickyNote, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
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

  // Mock data for clients, categories, and items
  // In a real app, these would come from API calls or props
  const mockClients = useMemo<ComboboxOption[]>(() => [
    { value: 'client1', label: 'Acme Corp' },
    { value: 'client2', label: 'TechStart Inc' },
    { value: 'client3', label: 'Local Restaurant' },
  ], []);

  const mockCategories = useMemo<ComboboxOption[]>(() => [
    { value: 'cat1', label: 'Printing' },
    { value: 'cat2', label: 'Design' },
    { value: 'cat3', label: 'Marketing' },
  ], []);

  const mockItems = useMemo<(ComboboxOption & { categoryId?: string })[]>(() => [
    { value: 'item1', label: 'Business Cards', categoryId: 'cat1' },
    { value: 'item2', label: 'Flyers', categoryId: 'cat1' },
    { value: 'item3', label: 'Logo Design', categoryId: 'cat2' },
    { value: 'item4', label: 'Website Design', categoryId: 'cat2' },
    { value: 'item5', label: 'Social Media Campaign', categoryId: 'cat3' },
  ], []);

  // Use our custom hooks for modal and form state
  const deleteDialog = useModalState();
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

  // Track form state for each tab to prevent data loss when switching tabs
  const [formState, setFormState] = useState({
    itemForms: [] as number[],
    paymentForms: [] as number[],
    noteForms: [] as number[],
    formIdCounters: {
      items: 1,
      payments: 1,
      notes: 1
    }
  });

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
      // Initialize with empty forms if no data exists
      if ((order.items?.length || 0) === 0 && formState.itemForms.length === 0) {
        // Use a unique ID for the form to prevent duplicates
        const uniqueFormId = Date.now();
        setFormState(prev => ({
          ...prev,
          itemForms: [uniqueFormId],
          formIdCounters: {
            ...prev.formIdCounters,
            items: uniqueFormId + 1
          }
        }));
      }

      if ((order.payments?.length || 0) === 0 && formState.paymentForms.length === 0) {
        // Use a unique ID for the form to prevent duplicates
        const uniqueFormId = Date.now() + 1;
        setFormState(prev => ({
          ...prev,
          paymentForms: [uniqueFormId],
          formIdCounters: {
            ...prev.formIdCounters,
            payments: uniqueFormId + 1
          }
        }));
      }

      if ((order.notes?.length || 0) === 0 && formState.noteForms.length === 0) {
        // Use a unique ID for the form to prevent duplicates
        const uniqueFormId = Date.now() + 2;
        setFormState(prev => ({
          ...prev,
          noteForms: [uniqueFormId],
          formIdCounters: {
            ...prev.formIdCounters,
            notes: uniqueFormId + 1
          }
        }));
      }

      // Ensure calculations are up-to-date when the form opens
      recalculateOrder();
    }
  }, [open, order.items?.length, order.payments?.length, order.notes?.length, formState.itemForms.length, formState.paymentForms.length, formState.noteForms.length, recalculateOrder]);

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

  // Functions to manage form state for each tab
  const addItemForm = useCallback(() => {
    setFormState(prev => {
      const newFormId = prev.formIdCounters.items;
      return {
        ...prev,
        itemForms: [...prev.itemForms, newFormId],
        formIdCounters: {
          ...prev.formIdCounters,
          items: newFormId + 1
        }
      };
    });
  }, []);

  const removeItemForm = useCallback((formId: number) => {
    setFormState(prev => ({
      ...prev,
      itemForms: prev.itemForms.filter(id => id !== formId)
    }));
    // Clean up localStorage
    localStorage.removeItem(`item-form-${formId}`);
  }, []);

  const addPaymentForm = useCallback(() => {
    setFormState(prev => {
      const newFormId = prev.formIdCounters.payments;
      return {
        ...prev,
        paymentForms: [...prev.paymentForms, newFormId],
        formIdCounters: {
          ...prev.formIdCounters,
          payments: newFormId + 1
        }
      };
    });
  }, []);

  const removePaymentForm = useCallback((formId: number) => {
    setFormState(prev => ({
      ...prev,
      paymentForms: prev.paymentForms.filter(id => id !== formId)
    }));
    // Clean up localStorage
    localStorage.removeItem(`payment-form-${formId}`);
  }, []);

  const addNoteForm = useCallback(() => {
    setFormState(prev => {
      const newFormId = prev.formIdCounters.notes;
      return {
        ...prev,
        noteForms: [...prev.noteForms, newFormId],
        formIdCounters: {
          ...prev.formIdCounters,
          notes: newFormId + 1
        }
      };
    });
  }, []);

  const removeNoteForm = useCallback((formId: number) => {
    setFormState(prev => ({
      ...prev,
      noteForms: prev.noteForms.filter(id => id !== formId)
    }));
    // Clean up localStorage
    localStorage.removeItem(`note-form-${formId}`);
  }, []);

  const safeSetActiveTab = useCallback((tab: string) => {
    if (isMountedRef.current) {
      // Store the current tab's form data in localStorage before switching
      // This ensures data is preserved when switching back
      console.log('Switching from tab', activeTab, 'to', tab);

      // Set the new active tab
      setActiveTab(tab);

      // Recalculate order totals when switching to the general-info tab
      // This ensures the financial summary is always up-to-date
      if (tab === 'general-info') {
        recalculateOrder();
      }

      // When switching to the notes tab, ensure we have at least one empty form
      if (tab === 'notes' && formState.noteForms.length === 0 && (order.notes?.length || 0) === 0) {
        console.log('Adding empty note form when switching to notes tab');
        addNoteForm();
      }
    }
  }, [activeTab, recalculateOrder, formState.noteForms.length, order.notes?.length, addNoteForm]);



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

  const openDeleteDialog = (id: string, index: number, name: string, type: DeletionType) => {
    setItemToDelete({ id, index, name, type });
    deleteDialog.open();
  };

  return (
    <>
      <OrderSheet
        open={open}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            try {
              // Ask for confirmation if the form has unsaved changes
              // Use the isDirty function from the hook to check if there are actual changes
              if (isDirty()) {
                const confirmClose = window.confirm('You have unsaved changes. Are you sure you want to close this form?');
                if (!confirmClose) {
                  return;
                }

                // Clear all form data from localStorage only when explicitly closing
                clearAllOrderFormData();

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
              }

              // Reset form state if component is still mounted
              if (isMountedRef.current) {
                safeSetValidationErrors({});
                safeSetFormStatus('idle');
                resetOrder();
              }
            } catch (error) {
              console.error('Error during form close:', error);
            }
          }
          onOpenChange(isOpen);
        }}
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
                clients={mockClients}
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
                categories={mockCategories}
                items={mockItems}
                errors={validationErrors}
                emptyForms={formState.itemForms}
                onAddForm={addItemForm}
                onRemoveForm={removeItemForm}
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
                emptyForms={formState.paymentForms}
                onAddForm={addPaymentForm}
                onRemoveForm={removePaymentForm}
              />
            </TabsContent>

            <TabsContent value="notes" className="mt-2 px-1 animate-in fade-in-50 slide-in-from-right-5 duration-300 transition-all overflow-x-hidden">
              <OrderNotesForm
                active={true} // Always set to true to ensure the form is interactive
                order={order}
                updateOrderFields={updateOrderFields}
                openDeleteDialog={openDeleteDialog}
                errors={validationErrors}
                emptyForms={formState.noteForms}
                onAddForm={addNoteForm}
                onRemoveForm={removeNoteForm}
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
    </>
  );
};

export default OrderFormSheet;