import { useCallback } from 'react';
import { Order, OrderItem, OrderNote, OrderPayment } from '@/types/orders';
import { DeletionRequest, DeletionType } from '@/components/ui/approval-dialog';
import { OrderFormState } from './useOrderFormState';
import { clearAllOrderFormData } from '@/utils/form-storage';

interface UseOrderFormHandlersParams {
  order: Partial<Order>;
  updateOrderFields: (fields: Partial<Order>) => void;
  recalculateOrder: () => void;
  resetOrder: () => void;
  onOpenChange: (open: boolean) => void;
  validateForm: () => boolean;
  createOrder: (order: Order) => Promise<unknown>;
  showSuccess: (msg: string, title: string) => void;
  showError: (msg: string, title: string) => void;
  formStateResult: OrderFormState;
  confirmDialogSetOpen: (open: boolean) => void;
  deleteDialogSetOpen: (open: boolean) => void;
}

export function useOrderFormHandlers({
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
  confirmDialogSetOpen,
  deleteDialogSetOpen,
}: UseOrderFormHandlersParams) {
  const {
    activeTab,
    setActiveTab,
    isMountedRef,
    timeoutRef,
    partialDataRef,
    setItemToDelete,
    setFormIds,
    setFormIdCounters,
    safeSetFormStatus,
    safeSetIsSaving,
    safeSetValidationErrors,
  } = formStateResult;

  const safeSetActiveTab = useCallback((tab: string) => {
    if (isMountedRef.current && tab !== activeTab) {
      setActiveTab(tab);
      if (tab === 'general-info') recalculateOrder();
    }
  }, [activeTab, recalculateOrder, isMountedRef, setActiveTab]);

  const resetFormAfterSave = useCallback(() => {
    resetOrder();
    setFormIds({ itemForms: [0], noteForms: [0], paymentForms: [0] });
    setFormIdCounters({ items: 1, payments: 1, notes: 1 });
    partialDataRef.current = { items: {}, payments: {}, notes: {} };
    if (isMountedRef.current) {
      safeSetActiveTab('general-info');
      safeSetValidationErrors({});
      safeSetFormStatus('idle');
    }
  }, [resetOrder, setFormIds, setFormIdCounters, partialDataRef, isMountedRef, safeSetActiveTab, safeSetValidationErrors, safeSetFormStatus]);

  const handleSave = useCallback(async () => {
    if (!validateForm()) return;

    safeSetIsSaving(true);
    safeSetFormStatus('saving');

    try {
      const formattedOrder = {
        ...order,
        clientId: order.client_id,
        clientName: order.client_name,
        clientType: order.client_type,
        date: order.date,
        status: order.status,
        items: order.items?.map((item: Partial<OrderItem>) => ({
          ...item,
          item_id: item.item_id || crypto.randomUUID(),
          category_id: item.category_id || crypto.randomUUID(),
          item_name: item.item_name,
          category_name: item.category_name,
          size: item.size || 'Standard',
          quantity: item.quantity || 1,
          unit_price: item.unit_price || 0,
        })),
        payments: order.payments?.map((payment: Partial<OrderPayment>) => ({
          ...payment,
          payment_date: payment.date || new Date().toISOString().split('T')[0],
          payment_method: payment.payment_method || 'cash',
          amount: payment.amount || 0,
        })),
        notes: order.notes || [],
      };

      const result = await createOrder(formattedOrder as Order);
      if (!result) throw new Error('Failed to create order');

      if (isMountedRef.current) {
        safeSetFormStatus('success');
        showSuccess('New order has been created successfully.', 'Order Created');
        try {
          clearAllOrderFormData();
          resetFormAfterSave();
          recalculateOrder();
        } catch (resetError) {
          console.error('Error resetting form:', resetError);
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          timeoutRef.current = setTimeout(() => {
            if (isMountedRef.current) onOpenChange(false);
          }, 1000);
        }
      }
    } catch (error) {
      console.error('Error saving order:', error);
      if (isMountedRef.current) {
        safeSetFormStatus('error');
        showError('Failed to create order. Please try again.', 'Error');
      }
    } finally {
      if (isMountedRef.current) safeSetIsSaving(false);
    }
  }, [validateForm, order, createOrder, isMountedRef, safeSetIsSaving, safeSetFormStatus, showSuccess, showError, resetFormAfterSave, recalculateOrder, onOpenChange, timeoutRef]);

  const handleDeleteRequest = (request: Omit<DeletionRequest, 'id' | 'requestedAt' | 'status'>) => {
    if (!formStateResult.itemToDelete) return;
    const { index } = formStateResult.itemToDelete;

    if (request.type === 'item') {
      const newItems = [...(order.items || [])];
      newItems.splice(index, 1);
      updateOrderFields({ items: newItems });
      recalculateOrder();
    } else if (request.type === 'payment') {
      const newPayments = [...(order.payments ?? [])];
      newPayments.splice(index, 1);
      updateOrderFields({ payments: newPayments });
      recalculateOrder();
    } else if (request.type === 'note') {
      const newNotes = [...(order.notes || [])];
      newNotes.splice(index, 1);
      updateOrderFields({ notes: newNotes });
    }

    setItemToDelete(null);
  };

  const hasAnyFormData = useCallback(() => {
    const hasValue = (str?: string) => !!str && str.trim() !== '';
    const itemHasData = (item: Partial<OrderItem>) => item && (hasValue(item.item_name) || item.quantity || item.unit_price);
    const paymentHasData = (p: Partial<OrderPayment>) => p && ((p.amount ?? 0) > 0 || hasValue(p.payment_method) || hasValue(p.date));
    const noteHasData = (n: Partial<OrderNote>) => n && (hasValue(n.text) || hasValue(n.type));

    return (
      hasValue(order.client_name) ||
      (order.items?.some(itemHasData) ?? false) ||
      (order.payments?.some(paymentHasData) ?? false) ||
      (order.notes?.some(noteHasData) ?? false) ||
      Object.values(partialDataRef.current.items).some(itemHasData) ||
      Object.values(partialDataRef.current.payments).some(paymentHasData) ||
      Object.values(partialDataRef.current.notes).some(noteHasData)
    );
  }, [order, partialDataRef]);

  const handleSheetClose = useCallback((isOpen: boolean) => {
    if (isOpen) { onOpenChange(true); return; }
    if (hasAnyFormData()) {
      confirmDialogSetOpen(true);
    } else {
      onOpenChange(false);
    }
  }, [onOpenChange, confirmDialogSetOpen, hasAnyFormData]);

  const openDeleteDialog = (id: string, index: number, name: string, type: DeletionType) => {
    setItemToDelete({ id, index, name, type });
    deleteDialogSetOpen(true);
  };

  return {
    safeSetActiveTab,
    handleSave,
    handleDeleteRequest,
    hasAnyFormData,
    handleSheetClose,
    openDeleteDialog,
    resetFormAfterSave,
  };
}
