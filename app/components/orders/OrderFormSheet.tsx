import React, { useEffect, useRef, memo } from 'react';
import { clearAllOrderFormData } from '@/utils/form-storage';
import { Button } from '@/components/ui/button';
import { Order } from '@/types/orders';
import { Ban, Save, FileText, Box, CreditCard, StickyNote, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useNotifications } from '@/components/ui/notification';
import { useModalState } from '@/hooks/ui/useModalState';
import { useOrderForm } from '@/hooks/orders/useOrderForm';
import { useOrderCreation } from '@/hooks/useOrderCreation';
import { useOrderFormState } from '@/hooks/orders/useOrderFormState';
import { useOrderFormValidation } from '@/hooks/orders/useOrderFormValidation';
import { useOrderFormHandlers } from '@/hooks/orders/useOrderFormHandlers';
import ApprovalDialog from '@/components/ui/approval-dialog';
import OrderSheet from '@/components/ui/sheets/OrderSheet';
import { motion } from 'framer-motion';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import ValidationSummary from '@/components/ui/form/ValidationSummary';
import { useReferenceData } from '@/hooks/useReferenceData';
import { UnsavedChangesDialog } from './OrderFormModal/UnsavedChangesDialog';
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

const OrderFormSheet = memo(function OrderFormSheet({
  open,
  onOpenChange,
  onSave,
  initialOrder,
  title,
}: OrderFormSheetProps) {
  const { success: showSuccess, error: showError } = useNotifications();
  const { clients, categories, items, isLoading: isReferenceDataLoading } = useReferenceData();

  const deleteDialog = useModalState();
  const confirmDialog = useModalState();

  const { order, updateOrderField, updateOrderFields, recalculateOrder, resetOrder } = useOrderForm({ initialOrder });

  const formStateResult = useOrderFormState();
  const {
    itemToDelete,
    isSaving,
    validationErrors,
    activeTab,
    setActiveTab,
    formStatus,
    isMountedRef,
    formIds,
    setFormIds,
    formIdCounters,
    setFormIdCounters,
    partialDataRef,
    safeSetFormStatus,
    safeSetIsSaving,
    safeSetValidationErrors,
    formState,
  } = formStateResult;

  const { createOrder } = useOrderCreation({
    onSuccess: () => {
      if (!isMountedRef.current) return;
      safeSetFormStatus('success');
      showSuccess('Order created successfully.', 'Success');
    },
  });

  const { validateForm } = useOrderFormValidation({
    order,
    isMountedRef,
    safeSetFormStatus,
    safeSetValidationErrors,
    safeSetActiveTab: (tab: string) => {
      if (isMountedRef.current && tab !== activeTab) {
        setActiveTab(tab);
        if (tab === 'general-info') recalculateOrder();
      }
    },
    showError,
  });

  const {
    safeSetActiveTab,
    handleSave,
    handleDeleteRequest,
    handleSheetClose,
    openDeleteDialog,
  } = useOrderFormHandlers({
    order,
    updateOrderFields,
    recalculateOrder,
    resetOrder,
    onOpenChange,
    validateForm,
    createOrder,
    showSuccess,
    showError,
    formStateResult,
    confirmDialogSetOpen: confirmDialog.setOpen,
    deleteDialogSetOpen: deleteDialog.setOpen,
  });

  const initializedRef = useRef(false);
  useEffect(() => {
    if (open && !initializedRef.current) {
      setTimeout(() => recalculateOrder(), 0);
      setFormIds({
        itemForms: [order.items?.length || 0],
        noteForms: [order.notes?.length || 0],
        paymentForms: [order.payments?.length || 0],
      });
      setFormIdCounters({
        items: (order.items?.length || 0) + 1,
        payments: (order.payments?.length || 0) + 1,
        notes: (order.notes?.length || 0) + 1,
      });
      initializedRef.current = true;
    } else if (!open) {
      initializedRef.current = false;
    }
  }, [open, order.items, order.payments, order.notes]);

  return (
    <>
      <OrderSheet open={open} onOpenChange={handleSheetClose} title={title} size="lg" showCloseButton={true}>
        <div className="p-6 flex-1 overflow-y-auto overflow-x-hidden bg-background" style={{ maxHeight: 'calc(100vh - 140px)' }}>
          {Object.keys(validationErrors).length > 0 && formStatus === 'error' && (
            <ValidationSummary errors={validationErrors} title="Please fix the following errors:" onSectionClick={setActiveTab} />
          )}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6 transition-all duration-300 ease-in-out">
            <TabsList className="bg-card border border-border/60 rounded-lg p-3 mb-6 w-full flex flex-wrap justify-between gap-2 overflow-x-hidden min-h-[60px]">
              <TabsTrigger value="general-info" className="text-sm font-medium text-muted-foreground py-2.5 px-4 rounded-md data-[state=active]:bg-foreground data-[state=active]:text-background hover:bg-muted/10 transition-all flex-1 truncate">
                <FileText className="mr-2 h-4 w-4" />
                General Info
                {(validationErrors['client_id'] || validationErrors['date'] || validationErrors['client_type'] || validationErrors['status']) && (
                  <AlertCircle className="ml-2 h-4 w-4 text-destructive" />
                )}
              </TabsTrigger>
              <TabsTrigger value="items" className="text-sm font-medium text-muted-foreground py-2.5 px-4 rounded-md data-[state=active]:bg-foreground data-[state=active]:text-background hover:bg-muted/10 transition-all flex-1 truncate">
                <Box className="mr-2 h-4 w-4" />
                Items
                {order.items && order.items.length > 0 && (
                  <span className="ml-2 min-w-5 bg-muted/30 px-1.5 py-0.5 text-xs font-medium text-muted-foreground rounded-full">{order.items.length}</span>
                )}
                {validationErrors['items'] && <AlertCircle className="ml-2 h-4 w-4 text-destructive" />}
              </TabsTrigger>
              <TabsTrigger value="payments" className="text-sm font-medium text-muted-foreground py-2.5 px-4 rounded-md data-[state=active]:bg-foreground data-[state=active]:text-background hover:bg-muted/10 transition-all flex-1 truncate">
                <CreditCard className="mr-2 h-4 w-4" />
                Payments
                {order.payments && order.payments.length > 0 && (
                  <span className="ml-2 min-w-5 bg-muted/30 px-1.5 py-0.5 text-xs font-medium text-muted-foreground rounded-full">{order.payments.length}</span>
                )}
                {validationErrors['payments'] && <AlertCircle className="ml-2 h-4 w-4 text-destructive" />}
              </TabsTrigger>
              <TabsTrigger value="notes" className="text-sm font-medium text-muted-foreground py-2.5 px-4 rounded-md data-[state=active]:bg-foreground data-[state=active]:text-background hover:bg-muted/10 transition-all flex-1 truncate">
                <StickyNote className="mr-2 h-4 w-4" />
                Notes
                {order.notes && order.notes.length > 0 && (
                  <span className="ml-2 min-w-5 bg-muted/30 px-1.5 py-0.5 text-xs font-medium text-muted-foreground rounded-full">{order.notes.length}</span>
                )}
                {validationErrors['notes'] && <AlertCircle className="ml-2 h-4 w-4 text-destructive" />}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general-info" className="mt-2 px-1 animate-in fade-in-50 slide-in-from-left-5 duration-300 transition-all overflow-x-hidden">
              <OrderGeneralInfoForm active={true} order={order} updateOrderField={updateOrderField} clients={clients} errors={validationErrors} />
            </TabsContent>
            <TabsContent value="items" className="mt-2 px-1 animate-in fade-in-50 slide-in-from-right-5 duration-300 transition-all overflow-x-hidden">
              <OrderItemsForm
                active={true} order={order} updateOrderFields={updateOrderFields} openDeleteDialog={openDeleteDialog}
                recalculateOrder={recalculateOrder} categories={categories} items={items} errors={validationErrors}
                formState={formState.itemForms} partialData={formState.partialData.items}
                onAddForm={() => {
                  const counter = formIdCounters.items;
                  if (!formIds.itemForms.includes(counter)) setFormIds(prev => ({ ...prev, itemForms: [...prev.itemForms, counter] }));
                  setFormIdCounters(prev => ({ ...prev, items: prev.items + 1 }));
                }}
                onRemoveForm={(index) => {
                  setFormIds(prev => ({ ...prev, itemForms: prev.itemForms.filter(id => id !== index) }));
                  if (partialDataRef.current.items[index]) delete partialDataRef.current.items[index];
                }}
                onUpdatePartialData={(index, data) => { partialDataRef.current.items[index] = data; }}
              />
            </TabsContent>
            <TabsContent value="payments" className="mt-2 px-1 animate-in fade-in-50 slide-in-from-right-5 duration-300 transition-all overflow-x-hidden">
              <OrderPaymentsForm
                active={true} order={order} updateOrderFields={updateOrderFields} openDeleteDialog={openDeleteDialog}
                recalculateOrder={recalculateOrder} errors={validationErrors}
                formState={formState.paymentForms} partialData={formState.partialData.payments}
                onAddForm={() => {
                  const counter = formIdCounters.payments;
                  if (!formIds.paymentForms.includes(counter)) setFormIds(prev => ({ ...prev, paymentForms: [...prev.paymentForms, counter] }));
                  setFormIdCounters(prev => ({ ...prev, payments: prev.payments + 1 }));
                }}
                onRemoveForm={(index) => {
                  setFormIds(prev => ({ ...prev, paymentForms: prev.paymentForms.filter(id => id !== index) }));
                  if (partialDataRef.current.payments[index]) delete partialDataRef.current.payments[index];
                }}
                onUpdatePartialData={(index, data) => { partialDataRef.current.payments[index] = data; }}
              />
            </TabsContent>
            <TabsContent value="notes" className="mt-2 px-1 animate-in fade-in-50 slide-in-from-right-5 duration-300 transition-all overflow-x-hidden">
              <OrderNotesForm
                active={true} order={order} updateOrderFields={updateOrderFields} openDeleteDialog={openDeleteDialog}
                errors={validationErrors} formState={formState.noteForms} partialData={formState.partialData.notes}
                onAddForm={() => {
                  const counter = formIdCounters.notes;
                  if (!formIds.noteForms.includes(counter)) setFormIds(prev => ({ ...prev, noteForms: [...prev.noteForms, counter] }));
                  setFormIdCounters(prev => ({ ...prev, notes: prev.notes + 1 }));
                }}
                onRemoveForm={(index) => {
                  setFormIds(prev => ({ ...prev, noteForms: prev.noteForms.filter(id => id !== index) }));
                  if (partialDataRef.current.notes[index]) delete partialDataRef.current.notes[index];
                }}
                onUpdatePartialData={(index, data) => { partialDataRef.current.notes[index] = data; }}
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
                  console.error('Error during form clear:', error);
                }
              }}
              disabled={isSaving}
            >
              <Ban className="mr-2 h-4 w-4" />
              Clear Form
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: isSaving ? 1 : 1.05 }} whileTap={{ scale: isSaving ? 1 : 0.95 }}>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[150px]" onClick={handleSave} disabled={isSaving}>
              {formStatus === 'saving' ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>
              ) : formStatus === 'success' ? (
                <><CheckCircle className="mr-2 h-4 w-4" />Created</>
              ) : (
                <><Save className="mr-2 h-4 w-4" />Create Order</>
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
          onCancel={() => { formStateResult.setItemToDelete(null); deleteDialog.setOpen(false); }}
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
          setTimeout(() => onOpenChange(false), 100);
        }}
      />
    </>
  );
});

export default OrderFormSheet;
