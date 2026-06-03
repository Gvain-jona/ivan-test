import React, { useEffect, useCallback, useRef, memo } from 'react';
import { clearAllOrderFormData } from '@/utils/form-storage';
import { Button } from '@/components/ui/button';
import { Order, OrderItem, OrderNote, OrderPayment } from '@/types/orders';
import { Ban, Save, FileText, Box, CreditCard, StickyNote, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useNotifications } from '@/components/ui/notification';
import { useModalState } from '@/hooks/ui/useModalState';
import { useOrderForm } from '@/hooks/orders/useOrderForm';
import { useOrderCreation } from '@/hooks/useOrderCreation';
import { useOrderFormState } from '@/hooks/orders/useOrderFormState';
import { useOrderFormValidation } from '@/hooks/orders/useOrderFormValidation';
import ApprovalDialog, { DeletionRequest, DeletionType } from '@/components/ui/approval-dialog';
import OrderSheet from '@/components/ui/sheets/OrderSheet';
import { motion } from 'framer-motion';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import ValidationSummary from '@/components/ui/form/ValidationSummary';
import { useReferenceData } from '@/hooks/useReferenceData';
import { UnsavedChangesDialog } from './OrderFormModal/UnsavedChangesDialog';

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
}: OrderFormSheetProps) {
  // This component now only handles creating new orders, not editing
  const { success: showSuccess, error: showError } = useNotifications();

  // Use our centralized reference data hook
  const { clients, categories, items, isLoading: isReferenceDataLoading } = useReferenceData();

  // Use our custom hooks for modal and form state
  const deleteDialog = useModalState();
  const confirmDialog = useModalState();

  const { order, updateOrderField, updateOrderFields, recalculateOrder, resetOrder, isDirty } = useOrderForm({
    initialOrder
  });

  // Use extracted form state hook
  const {
    itemToDelete,
    setItemToDelete,
    isSaving,
    validationErrors,
    activeTab,
    setActiveTab,
    formStatus,
    isMountedRef,
    timeoutRef,
    formIds,
    setFormIds,
    formIdCounters,
    setFormIdCounters,
    partialDataRef,
    safeSetFormStatus,
    safeSetIsSaving,
    safeSetValidationErrors,
    formState,
  } = useOrderFormState();

  // safeSetActiveTab stays here because it depends on recalculateOrder from useOrderForm
  const safeSetActiveTab = useCallback((tab: string) => {
    if (isMountedRef.current && tab !== activeTab) {
      setActiveTab(tab);
      if (tab === 'general-info') recalculateOrder();
    }
  }, [activeTab, recalculateOrder, isMountedRef, setActiveTab]);

  // Use extracted validation hook
  const { validateForm } = useOrderFormValidation({
    order,
    isMountedRef,
    safeSetFormStatus,
    safeSetValidationErrors,
    safeSetActiveTab,
    showError,
  });

  // Use a ref to track whether we've already initialized to prevent infinite loops
  const initializedRef = useRef(false);

  useEffect(() => {
    if (open && !initializedRef.current) {
      setTimeout(() => recalculateOrder(), 0);

      setFormIds({
        itemForms: [order.items?.length || 0],
        noteForms: [order.notes?.length || 0],
        paymentForms: [order.payments?.length || 0]
      });

      setFormIdCounters({
        items: (order.items?.length || 0) + 1,
        payments: (order.payments?.length || 0) + 1,
        notes: (order.notes?.length || 0) + 1
      });

      initializedRef.current = true;
    } else if (!open) {
      initializedRef.current = false;
    }
  }, [open, order.items, order.payments, order.notes]);

  // Use our custom hook for order creation
  const { createOrder, loading: isCreatingOrder } = useOrderCreation({
    onSuccess: (orderId) => {
      if (!isMountedRef.current) return;

      safeSetFormStatus('success');
      showSuccess(`Order created successfully.`, "Success");

      try {
        clearAllOrderFormData();
        resetOrder();
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

        partialDataRef.current = {
          items: {},
          payments: {},
          notes: {}
        };

        if (isMountedRef.current) {
          safeSetActiveTab('general-info');
          safeSetValidationErrors({});
          safeSetFormStatus('idle');
          recalculateOrder();
        }
      } catch (resetError) {
        console.error('Error resetting form:', resetError);
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
    if (!validateForm()) return;

    safeSetIsSaving(true);
    safeSetFormStatus('saving');

    try {
      try {
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
            item_name: item.item_name,
            category_name: item.category_name,
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

        const result = await createOrder(formattedOrder as Order);

        if (!result) {
          throw new Error('Failed to create order');
        }

        if (isMountedRef.current) {
          safeSetFormStatus('success');
          showSuccess(`New order has been created successfully.`, "Order Created");
          try {
            resetOrder();
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

    if (request.type === 'item') {
      const newItems = [...(order.items || [])];
      newItems.splice(itemToDelete.index, 1);
      updateOrderFields({ items: newItems });
      recalculateOrder();
    } else if (request.type === 'payment') {
      const newPayments = [...(order.payments ?? [])];
      newPayments.splice(itemToDelete.index, 1);
      updateOrderFields({ payments: newPayments });
      recalculateOrder();
    } else if (request.type === 'note') {
      const newNotes = [...(order.notes || [])];
      newNotes.splice(itemToDelete.index, 1);
      updateOrderFields({ notes: newNotes });
    }

    setItemToDelete(null);
  };

  const hasAnyFormData = useCallback(() => {
    const hasValue = (str?: string) => !!str && str.trim() !== '';
    const itemHasData = (item: Partial<OrderItem>) => item && (hasValue(item.item_name) || item.quantity || item.unit_price);
    const paymentHasData = (payment: Partial<OrderPayment>) => payment && ((payment.amount ?? 0) > 0 || hasValue(payment.payment_method) || hasValue(payment.date));
    const noteHasData = (note: Partial<OrderNote>) => note && (hasValue(note.text) || hasValue(note.type));

    const checks = {
      hasClientName: hasValue(order.client_name),
      hasItemData: order.items && order.items.some(itemHasData),
      hasPaymentData: order.payments && order.payments.some(paymentHasData),
      hasNoteData: order.notes && order.notes.some(noteHasData),
      hasPartialItemData: Object.values(partialDataRef.current.items).some(itemHasData),
      hasPartialPaymentData: Object.values(partialDataRef.current.payments).some(paymentHasData),
      hasPartialNoteData: Object.values(partialDataRef.current.notes).some(noteHasData)
    };

    console.log('Form data checks:', checks);
    return Object.values(checks).some(Boolean);
  }, [order, partialDataRef]);

  const handleSheetClose = useCallback((isOpen: boolean) => {
    if (isOpen) {
      onOpenChange(true);
      return;
    }

    if (hasAnyFormData()) {
      confirmDialog.setOpen(true);
    } else {
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
        showCloseButton={true}
      >
        <div className="p-6 flex-1 overflow-y-auto overflow-x-hidden bg-background" style={{ maxHeight: 'calc(100vh - 140px)' }}>
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
                active={true}
                order={order}
                updateOrderField={updateOrderField}
                clients={clients}
                errors={validationErrors}
              />
            </TabsContent>

            <TabsContent value="items" className="mt-2 px-1 animate-in fade-in-50 slide-in-from-right-5 duration-300 transition-all overflow-x-hidden">
              <OrderItemsForm
                active={true}
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
                  const counter = formIdCounters.items;
                  if (!formIds.itemForms.includes(counter)) {
                    setFormIds(prev => ({ ...prev, itemForms: [...prev.itemForms, counter] }));
                  }
                  setFormIdCounters(prev => ({ ...prev, items: prev.items + 1 }));
                }}
                onRemoveForm={(index) => {
                  setFormIds(prev => ({ ...prev, itemForms: prev.itemForms.filter(formId => formId !== index) }));
                  if (partialDataRef.current.items[index]) {
                    delete partialDataRef.current.items[index];
                  }
                }}
                onUpdatePartialData={(index, data) => {
                  partialDataRef.current.items[index] = data;
                }}
              />
            </TabsContent>

            <TabsContent value="payments" className="mt-2 px-1 animate-in fade-in-50 slide-in-from-right-5 duration-300 transition-all overflow-x-hidden">
              <OrderPaymentsForm
                active={true}
                order={order}
                updateOrderFields={updateOrderFields}
                openDeleteDialog={openDeleteDialog}
                recalculateOrder={recalculateOrder}
                errors={validationErrors}
                formState={formState.paymentForms}
                partialData={formState.partialData.payments}
                onAddForm={() => {
                  const counter = formIdCounters.payments;
                  if (!formIds.paymentForms.includes(counter)) {
                    setFormIds(prev => ({ ...prev, paymentForms: [...prev.paymentForms, counter] }));
                  }
                  setFormIdCounters(prev => ({ ...prev, payments: prev.payments + 1 }));
                }}
                onRemoveForm={(index) => {
                  setFormIds(prev => ({ ...prev, paymentForms: prev.paymentForms.filter(formId => formId !== index) }));
                  if (partialDataRef.current.payments[index]) {
                    delete partialDataRef.current.payments[index];
                  }
                }}
                onUpdatePartialData={(index, data) => {
                  partialDataRef.current.payments[index] = data;
                }}
              />
            </TabsContent>

            <TabsContent value="notes" className="mt-2 px-1 animate-in fade-in-50 slide-in-from-right-5 duration-300 transition-all overflow-x-hidden">
              <OrderNotesForm
                active={true}
                order={order}
                updateOrderFields={updateOrderFields}
                openDeleteDialog={openDeleteDialog}
                errors={validationErrors}
                formState={formState.noteForms}
                partialData={formState.partialData.notes}
                onAddForm={() => {
                  const counter = formIdCounters.notes;
                  if (!formIds.noteForms.includes(counter)) {
                    setFormIds(prev => ({ ...prev, noteForms: [...prev.noteForms, counter] }));
                  }
                  setFormIdCounters(prev => ({ ...prev, notes: prev.notes + 1 }));
                }}
                onRemoveForm={(index) => {
                  setFormIds(prev => ({ ...prev, noteForms: prev.noteForms.filter(formId => formId !== index) }));
                  if (partialDataRef.current.notes[index]) {
                    delete partialDataRef.current.notes[index];
                  }
                }}
                onUpdatePartialData={(index, data) => {
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
                  clearAllOrderFormData();
                  setFormIds({ itemForms: [0], noteForms: [0], paymentForms: [0] });
                  setFormIdCounters({ items: 1, payments: 1, notes: 1 });
                  partialDataRef.current = { items: {}, payments: {}, notes: {} };
                  resetOrder();
                  if (isMountedRef.current) {
                    safeSetActiveTab('general-info');
                    safeSetValidationErrors({});
                    recalculateOrder();
                  }
                } catch (error) {
                  console.error('Error during form clear/cancel:', error);
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

      {itemToDelete && (
        <ApprovalDialog
          open={deleteDialog.isOpen}
          onOpenChange={deleteDialog.setOpen}
          itemId={itemToDelete.id}
          itemName={itemToDelete.name}
          type={itemToDelete.type}
          linkedId={order.id ?? ''}
          linkedType="order"
          onSubmit={handleDeleteRequest}
          onCancel={() => {
            setItemToDelete(null);
            deleteDialog.setOpen(false);
          }}
        />
      )}

      <UnsavedChangesDialog
        open={confirmDialog.isOpen}
        onOpenChange={confirmDialog.setOpen}
        order={order}
        partialItems={partialDataRef.current.items}
        partialPayments={partialDataRef.current.payments}
        partialNotes={partialDataRef.current.notes}
        onContinueEditing={() => confirmDialog.setOpen(false)}
        onDiscard={() => {
          confirmDialog.setOpen(false);
          setTimeout(() => {
            console.log('Now closing the sheet after dialog closed');
            onOpenChange(false);
          }, 100);
        }}
      />
    </>
  );
});

export default OrderFormSheet;
