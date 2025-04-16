import React, { useState, useCallback } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Order, OrderPayment } from '@/types/orders';
import { Ban, Save } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useModalState } from '@/hooks/ui/useModalState';
import { useOrderForm } from '@/hooks/orders/useOrderForm';
import ApprovalDialog, { DeletionRequest, DeletionType } from '@/components/ui/approval-dialog';

// Import sub-components
import OrderGeneralInfoForm from './OrderGeneralInfoForm';
import OrderItemsForm from './OrderItemsForm';
import OrderPaymentsForm from './OrderPaymentsForm';
import OrderNotesForm from './OrderNotesForm';

interface OrderFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (order: Order) => void;
  initialOrder?: Order;
  title: string;
  isEditing: boolean;
}

/**
 * Order form modal component for creating and editing orders
 * This is the main component that composes all the form sections
 */
const OrderFormModal: React.FC<OrderFormModalProps> = ({
  open,
  onOpenChange,
  onSave,
  initialOrder,
  title,
  isEditing,
}) => {
  const [activeTab, setActiveTab] = useState('general');

  // Unified form state management for all tabs
  const [formState, setFormState] = useState({
    itemForms: [0], // Start with one form
    noteForms: [0], // Start with one form
    paymentForms: [0], // Start with one form
    formIdCounters: {
      items: 1,
      payments: 1,
      notes: 1
    },
    // Store partial form data for each form
    partialData: {
      items: {}, // Keyed by formIndex
      payments: {},
      notes: {}
    }
  });
  const { toast } = useToast();

  // Use our custom hooks for modal and form state
  const deleteDialog = useModalState();
  const { order, updateOrderField, updateOrderFields, recalculateOrder } = useOrderForm({
    initialOrder
  });

  // Form state management functions
  const addForm = useCallback((formType: 'items' | 'payments' | 'notes') => {
    setFormState(prev => {
      const counter = prev.formIdCounters[formType];
      const formKey = `${formType}Forms` as 'itemForms' | 'paymentForms' | 'noteForms';

      return {
        ...prev,
        [formKey]: [...prev[formKey], counter],
        formIdCounters: {
          ...prev.formIdCounters,
          [formType]: counter + 1
        }
      };
    });
  }, []);

  const removeForm = useCallback((formType: 'items' | 'payments' | 'notes', index: number) => {
    setFormState(prev => {
      const formKey = `${formType}Forms` as 'itemForms' | 'paymentForms' | 'noteForms';

      // Remove the form from the array
      return {
        ...prev,
        [formKey]: prev[formKey].filter(formId => formId !== index),
        // Also clean up any partial data
        partialData: {
          ...prev.partialData,
          [formType]: {
            ...prev.partialData[formType],
            [index]: undefined
          }
        }
      };
    });
  }, []);

  const updatePartialData = useCallback((formType: 'items' | 'payments' | 'notes', index: number, data: any) => {
    setFormState(prev => ({
      ...prev,
      partialData: {
        ...prev.partialData,
        [formType]: {
          ...prev.partialData[formType],
          [index]: data
        }
      }
    }));
  }, []);

  // State for item to delete
  const [itemToDelete, setItemToDelete] = useState<{
    id: string;
    index: number;
    name: string;
    type: DeletionType;
  } | null>(null);

  const handleSave = () => {
    // Here you would validate the form before saving
    console.log('Saving order:', order);
    onSave(order as Order);
    onOpenChange(false);
  };

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
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[800px] bg-gray-950 border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">{title}</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab} className="mt-4">
            <TabsList className="bg-gray-900 border-b border-gray-800">
              <TabsTrigger
                value="general"
                className="data-[state=active]:bg-gray-800 data-[state=active]:text-white"
              >
                General Info
              </TabsTrigger>
              <TabsTrigger
                value="items"
                className="data-[state=active]:bg-gray-800 data-[state=active]:text-white"
              >
                Items
              </TabsTrigger>
              <TabsTrigger
                value="payments"
                className="data-[state=active]:bg-gray-800 data-[state=active]:text-white"
              >
                Payments
              </TabsTrigger>
              <TabsTrigger
                value="notes"
                className="data-[state=active]:bg-gray-800 data-[state=active]:text-white"
              >
                Notes
              </TabsTrigger>
            </TabsList>

            {/* General Info Tab */}
            <OrderGeneralInfoForm
              active={activeTab === 'general'}
              order={order}
              updateOrderField={updateOrderField}
              isEditing={isEditing}
            />

            {/* Items Tab */}
            <OrderItemsForm
              active={activeTab === 'items'}
              order={order}
              updateOrderFields={updateOrderFields}
              openDeleteDialog={openDeleteDialog}
              recalculateOrder={recalculateOrder}
              formState={formState.itemForms}
              partialData={formState.partialData.items}
              onAddForm={() => addForm('items')}
              onRemoveForm={(index) => removeForm('items', index)}
              onUpdatePartialData={(index, data) => updatePartialData('items', index, data)}
            />

            {/* Payments Tab */}
            <OrderPaymentsForm
              active={activeTab === 'payments'}
              order={order}
              updateOrderFields={updateOrderFields}
              openDeleteDialog={openDeleteDialog}
              recalculateOrder={recalculateOrder}
              toast={toast}
              formState={formState.paymentForms}
              partialData={formState.partialData.payments}
              onAddForm={() => addForm('payments')}
              onRemoveForm={(index) => removeForm('payments', index)}
              onUpdatePartialData={(index, data) => updatePartialData('payments', index, data)}
            />

            {/* Notes Tab */}
            <OrderNotesForm
              active={activeTab === 'notes'}
              order={order}
              updateOrderFields={updateOrderFields}
              openDeleteDialog={openDeleteDialog}
              formState={formState.noteForms}
              partialData={formState.partialData.notes}
              onAddForm={() => addForm('notes')}
              onRemoveForm={(index) => removeForm('notes', index)}
              onUpdatePartialData={(index, data) => updatePartialData('notes', index, data)}
            />
          </Tabs>

          <DialogFooter className="sm:justify-between">
            <Button
              variant="outline"
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
              onClick={() => onOpenChange(false)}
            >
              <Ban className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button
              className="bg-orange-600 text-white hover:bg-orange-700"
              onClick={handleSave}
            >
              <Save className="mr-2 h-4 w-4" />
              {isEditing ? 'Update Order' : 'Create Order'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approval Dialog */}
      {itemToDelete && (
        <ApprovalDialog
          open={deleteDialog.isOpen}
          onOpenChange={deleteDialog.setOpen}
          itemId={itemToDelete.id}
          itemName={itemToDelete.name}
          type={itemToDelete.type}
          linkedId={order.id || ''}
          linkedType="order"
          onSubmit={handleDeleteRequest}
          onCancel={() => setItemToDelete(null)}
        />
      )}
    </>
  );
};

export default OrderFormModal;