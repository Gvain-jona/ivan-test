import React, { useState, useMemo, useEffect, useCallback, useRef, memo } from 'react';
import { clearAllOrderFormData } from '@/utils/form-storage';
import { Button } from '@/components/ui/button';
import { Order, OrderPayment, ClientType } from '@/types/orders';
import { Ban, Save, FileText, Box, CreditCard, StickyNote, AlertCircle, CheckCircle, Loader2, AlertTriangle, X } from 'lucide-react';
import { useNotifications } from '@/components/ui/notification';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useReferenceData } from '@/hooks/useReferenceData';

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
}

/**
 * Order form sheet component for creating and editing orders
 * Uses the side panel sheet layout instead of a modal
 */
const OrderFormSheet = memo(function OrderFormSheet({
  open,
  onOpenChange,
  onSave,
  initialOrder,
  title,
}) {
  // This component now only handles creating new orders, not editing
  const { success: showSuccess, error: showError } = useNotifications();

  // Use our centralized reference data hook
  const { clients, categories, items, isLoading: isReferenceDataLoading } = useReferenceData();

  // Use our custom hooks for modal and form state
  const deleteDialog = useModalState();
  const confirmDialog = useModalState();

  // Debug initialOrder prop
  console.log('OrderFormSheet received initialOrder:', initialOrder);

  const { order, updateOrderField, updateOrderFields, recalculateOrder, resetOrder, isDirty } = useOrderForm({
    initialOrder
  });

  // Debug order state after initialization
  console.log('OrderFormSheet order state after initialization:', order);

  // Debug nested data structures
  console.log('OrderFormSheet items:', order.items);
  console.log('OrderFormSheet payments:', order.payments);
  console.log('OrderFormSheet notes:', order.notes);

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
  // Use a ref to track whether we've already initialized to prevent infinite loops
  const initializedRef = useRef(false);

  useEffect(() => {
    if (open && !initializedRef.current) {
      console.log('OrderFormSheet useEffect when form opens - initialOrder:', initialOrder);
      console.log('OrderFormSheet useEffect when form opens - current order state:', order);

      // Ensure calculations are up-to-date when the form opens
      // Use setTimeout to prevent React update depth issues
      setTimeout(() => {
        recalculateOrder();
      }, 0);

      // Initialize form state with a single empty form for each section
      // We'll handle existing items separately in the form components
      setFormIds({
        itemForms: [order.items?.length || 0], // Start with one form after existing items
        noteForms: [order.notes?.length || 0], // Start with one form after existing notes
        paymentForms: [order.payments?.length || 0] // Start with one form after existing payments
      });

      // Set counters to be higher than the number of existing items
      setFormIdCounters({
        items: (order.items?.length || 0) + 1,
        payments: (order.payments?.length || 0) + 1,
        notes: (order.notes?.length || 0) + 1
      });

      initializedRef.current = true;
    } else if (!open) {
      // Reset the initialization flag when the form closes
      initializedRef.current = false;
    }
  }, [open, order.items, order.payments, order.notes]);

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

          showError(`Please fix the highlighted errors in: ${errorSectionNames.join(', ')}`, "Validation Error");
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

        showError("An unexpected error occurred during validation.", "Validation Error");
      }

      return false;
    }
  }, [order, safeSetFormStatus, safeSetValidationErrors, safeSetActiveTab, showError]);

  // Use our custom hook for order creation
  const { createOrder, loading: isCreatingOrder } = useOrderCreation({
    onSuccess: (orderId) => {
      if (!isMountedRef.current) return;

      safeSetFormStatus('success');
      showSuccess(`Order created successfully.`, "Success");

      // Reset the form for a new order
      try {
        console.log('Resetting form for new entry');
        // Clear all form data from localStorage
        clearAllOrderFormData();
        resetOrder();
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

      // Create a new order
      // For new orders, use our new createOrder function
      console.log('Creating new order with items:', order.items);

      try {
        // Format the order data correctly for the API
        const formattedOrder = {
          ...order,
          clientId: order.client_id,
          clientName: order.client_name,
          clientType: order.client_type,
          date: order.date,
          status: order.status,
          items: order.items?.map(item => ({
            ...item,
            item_id: item.item_id || crypto.randomUUID(),
            category_id: item.category_id || crypto.randomUUID(),
            item_name: item.name || item.item_name,
            category_name: item.category || item.category_name,
            size: item.size || 'Standard',
            quantity: item.quantity || 1,
            unit_price: item.unit_price || 0
          })),
          payments: order.payments?.map(payment => ({
            ...payment,
            payment_date: payment.date || new Date().toISOString().split('T')[0],
            payment_method: payment.payment_method || 'cash',
            amount: payment.amount || 0
          })),
          notes: order.notes || []
        };

        console.log('Formatted order data:', formattedOrder);

        const result = await createOrder(formattedOrder as Order);

        console.log('Create order result:', result);

        if (!result) {
          throw new Error('Failed to create order');
        }

        // Show a single success toast
        if (isMountedRef.current) {
          safeSetFormStatus('success');

          showSuccess(`New order has been created successfully.`, "Order Created");

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
    } catch (error) {
      console.error("Error saving order:", error);

      if (isMountedRef.current) {
        safeSetFormStatus('error');

        showError(`Failed to create order. Please try again.`, "Error");
      }
    } finally {
      if (isMountedRef.current) {
        safeSetIsSaving(false);
      }
    }
  }, [validateForm, order, onSave, onOpenChange, createOrder, safeSetIsSaving, safeSetFormStatus, safeSetValidationErrors, safeSetActiveTab, showSuccess, showError, resetOrder]);

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

  // Helper function to check if the form has any data that would be lost on close
  const hasAnyFormData = useCallback(() => {
    // Helper to check if a string field has value
    const hasValue = (str?: string) => !!str && str.trim() !== '';

    // Helper to check if an item has any data
    const itemHasData = (item: any) => {
      return item && (
        hasValue(item.item_name) ||
        item.quantity ||
        item.unit_price ||
        hasValue(item.description)
      );
    };

    // Helper to check if a payment has any data
    const paymentHasData = (payment: any) => {
      return payment && (
        payment.amount > 0 ||
        hasValue(payment.payment_method) ||
        hasValue(payment.payment_date)
      );
    };

    // Helper to check if a note has any data
    const noteHasData = (note: any) => {
      return note && (
        hasValue(note.text) ||
        hasValue(note.type)
      );
    };

    // Check all data sources
    const checks = {
      // 1. Check client name
      hasClientName: hasValue(order.client_name),

      // 2. Check for ANY data in items
      hasItemData: order.items && order.items.some(itemHasData),

      // 3. Check for ANY data in payments
      hasPaymentData: order.payments && order.payments.some(paymentHasData),

      // 4. Check for ANY data in notes
      hasNoteData: order.notes && order.notes.some(noteHasData),

      // 5. Check for ANY partial data in form inputs
      hasPartialItemData: Object.values(partialDataRef.current.items).some(itemHasData),
      hasPartialPaymentData: Object.values(partialDataRef.current.payments).some(paymentHasData),
      hasPartialNoteData: Object.values(partialDataRef.current.notes).some(noteHasData)
    };

    // Log which checks passed for debugging
    console.log('Form data checks:', checks);

    // Return true if ANY check passed
    return Object.values(checks).some(Boolean);
  }, [order, partialDataRef]);

  // Simple function to handle sheet close request
  const handleSheetClose = useCallback((isOpen: boolean) => {
    console.log(`Sheet close requested, current open state: ${open}, requested state: ${isOpen}`);

    // If trying to open the sheet, just pass through
    if (isOpen) {
      console.log('Opening sheet');
      onOpenChange(true);
      return;
    }

    // If trying to close the sheet, check for data
    console.log('Checking for form data before closing');
    const hasData = hasAnyFormData();

    if (hasData) {
      // If there's data, show the confirmation dialog
      console.log('Form has data, showing confirmation dialog');
      confirmDialog.setOpen(true);
      // Don't close the sheet yet - wait for dialog response
    } else {
      // If no data, close immediately
      console.log('No form data, closing without confirmation');
      onOpenChange(false);
    }
  }, [open, onOpenChange, confirmDialog, hasAnyFormData]);

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
        showCloseButton={true} // Show the close button in the header for better UX
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
                isEditing={false}
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

                  // Only add a new form if it doesn't already exist
                  // This prevents duplicate forms
                  if (!formIds.itemForms.includes(counter)) {
                    setFormIds(prev => ({
                      ...prev,
                      itemForms: [...prev.itemForms, counter]
                    }));
                  }

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

                errors={validationErrors}
                formState={formState.paymentForms}
                partialData={formState.partialData.payments}
                onAddForm={() => {
                  // Update form IDs separately to prevent maximum depth issues
                  const counter = formIdCounters.payments;

                  // Only add a new form if it doesn't already exist
                  // This prevents duplicate forms
                  if (!formIds.paymentForms.includes(counter)) {
                    setFormIds(prev => ({
                      ...prev,
                      paymentForms: [...prev.paymentForms, counter]
                    }));
                  }

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

                  // Only add a new form if it doesn't already exist
                  // This prevents duplicate forms
                  if (!formIds.noteForms.includes(counter)) {
                    setFormIds(prev => ({
                      ...prev,
                      noteForms: [...prev.noteForms, counter]
                    }));
                  }

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

                  // Reset the form for a new entry
                  resetOrder();
                  if (isMountedRef.current) {
                    safeSetActiveTab('general-info');
                    safeSetValidationErrors({});
                    // Ensure calculations are reset
                    recalculateOrder();
                  }
                } catch (error) {
                  console.error('Error during form clear/cancel:', error);
                  // Log the error but keep the form open
                  console.error('Error during form reset:', error);
                }
              }}
              disabled={isSaving}
            >
              <Ban className="mr-2 h-4 w-4" />
              Clear Form
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
                  Created
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Create Order
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
      <Dialog
        open={confirmDialog.isOpen}
        onOpenChange={(open) => {
          console.log('Confirmation dialog state changing:', open);
          confirmDialog.setOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-md bg-card border border-border/40 text-foreground">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Unsaved Changes
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              You have unsaved changes. Your data will be lost if you close this form.
            </DialogDescription>
          </DialogHeader>

          {/* Show a summary of what will be lost */}
          <div className="py-3 text-sm">
            <p className="font-medium mb-2">The following information will be lost:</p>
            <ul className="space-y-1 text-muted-foreground">
              {/* Client information */}
              {order.client_name && (
                <li className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                  Client: {order.client_name}
                </li>
              )}

              {/* Order items */}
              {order.items && order.items.some(item =>
                item && (item.item_name || item.quantity || item.unit_price || (item.description && item.description.trim() !== ''))
              ) && (
                <li className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                  Order items: {order.items.filter(item =>
                    item && (item.item_name || item.quantity || item.unit_price || (item.description && item.description.trim() !== ''))
                  ).length}
                </li>
              )}

              {/* Payments */}
              {order.payments && order.payments.some(payment =>
                payment && (payment.amount > 0 || (payment.payment_method && payment.payment_method.trim() !== ''))
              ) && (
                <li className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                  Payments: {order.payments.filter(payment =>
                    payment && (payment.amount > 0 || (payment.payment_method && payment.payment_method.trim() !== ''))
                  ).length}
                </li>
              )}

              {/* Notes */}
              {order.notes && order.notes.some(note =>
                note && ((note.text && note.text.trim() !== '') || (note.type && note.type.trim() !== ''))
              ) && (
                <li className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                  Notes: {order.notes.filter(note =>
                    note && ((note.text && note.text.trim() !== '') || (note.type && note.type.trim() !== ''))
                  ).length}
                </li>
              )}

              {/* Partial data in forms */}
              {Object.values(partialDataRef.current.items).some(data =>
                data && ((data.item_name && data.item_name.trim() !== '') || data.quantity || data.unit_price)
              ) && (
                <li className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                  Unsaved item data
                </li>
              )}

              {Object.values(partialDataRef.current.payments).some(data =>
                data && (data.amount > 0 || (data.payment_method && data.payment_method.trim() !== ''))
              ) && (
                <li className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                  Unsaved payment data
                </li>
              )}

              {Object.values(partialDataRef.current.notes).some(data =>
                data && ((data.text && data.text.trim() !== '') || (data.type && data.type.trim() !== ''))
              ) && (
                <li className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                  Unsaved note data
                </li>
              )}
            </ul>
          </div>

          <DialogFooter className="sm:justify-between mt-4">
            <Button
              variant="outline"
              className="border-border/40 bg-transparent hover:bg-muted/50 text-muted-foreground hover:text-foreground"
              onClick={() => {
                console.log('User chose to continue editing');
                confirmDialog.setOpen(false);
              }}
            >
              Continue Editing
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                console.log('User confirmed discarding changes');
                // First close the dialog
                confirmDialog.setOpen(false);
                // Then close the sheet
                setTimeout(() => {
                  console.log('Now closing the sheet after dialog closed');
                  onOpenChange(false);
                }, 100);
              }}
            >
              Discard Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
});

export default OrderFormSheet;