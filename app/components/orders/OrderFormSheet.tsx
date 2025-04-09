import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Order, OrderPayment, ClientType } from '@/types/orders';
import { Ban, Save, FileText, Box, CreditCard, StickyNote, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useModalState } from '@/hooks/ui/useModalState';
import { useOrderForm } from '@/hooks/orders/useOrderForm';
import ApprovalDialog, { DeletionRequest, DeletionType } from '@/components/ui/approval-dialog';
import OrderSheet from '@/components/ui/sheets/OrderSheet';
import { motion } from 'framer-motion';
import { buttonHover } from '@/utils/animation-variants';
import { orderSchema } from '@/schemas/order-schema';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent
} from '@/components/ui/accordion';
import { ComboboxOption } from '@/components/ui/combobox';

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
  const { order, updateOrderField, updateOrderFields, recalculateOrder } = useOrderForm({
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
  const [activeSection, setActiveSection] = useState<string>('general-info');
  const [formStatus, setFormStatus] = useState<'idle' | 'validating' | 'saving' | 'success' | 'error'>('idle');

  // Validate the form and return true if valid
  const validateForm = useCallback(() => {
    setFormStatus('validating');

    try {
      // Validate the order against the schema
      const result = orderSchema.safeParse(order);

      if (!result.success) {
        // Format and store validation errors
        const formattedErrors: Record<string, string[]> = {};

        result.error.errors.forEach((error) => {
          const path = error.path.join('.');
          if (!formattedErrors[path]) {
            formattedErrors[path] = [];
          }
          formattedErrors[path].push(error.message);
        });

        setValidationErrors(formattedErrors);

        // Determine which section has errors and set it as active
        if (result.error.errors.some(e => e.path[0] === 'client_id' || e.path[0] === 'date' || e.path[0] === 'client_type' || e.path[0] === 'status')) {
          setActiveSection('general-info');
        } else if (result.error.errors.some(e => e.path[0] === 'items')) {
          setActiveSection('items');
        } else if (result.error.errors.some(e => e.path[0] === 'payments')) {
          setActiveSection('payments');
        } else if (result.error.errors.some(e => e.path[0] === 'notes')) {
          setActiveSection('notes');
        }

        setFormStatus('error');

        // Show toast with error message
        toast({
          title: "Validation Error",
          description: "Please fix the highlighted errors before saving.",
          variant: "destructive",
        });

        return false;
      }

      // Clear any previous validation errors
      setValidationErrors({});
      setFormStatus('idle');
      return true;
    } catch (error) {
      console.error("Validation error:", error);
      setFormStatus('error');

      toast({
        title: "Validation Error",
        description: "An unexpected error occurred during validation.",
        variant: "destructive",
      });

      return false;
    }
  }, [order, setFormStatus, setValidationErrors, setActiveSection, toast]);

  const handleSave = useCallback(async () => {
    // Validate the form before saving
    if (!validateForm()) {
      return;
    }

    try {
      setIsSaving(true);
      setFormStatus('saving');

      // Simulate API call with a delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log('Saving order:', order);
      onSave(order as Order);

      setFormStatus('success');
      toast({
        title: "Success",
        description: `Order ${isEditing ? 'updated' : 'created'} successfully.`,
      });

      // Close the form after a short delay
      setTimeout(() => {
        onOpenChange(false);
      }, 1000);
    } catch (error) {
      console.error("Error saving order:", error);
      setFormStatus('error');

      toast({
        title: "Error",
        description: `Failed to ${isEditing ? 'update' : 'create'} order. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }, [validateForm, order, isEditing, onSave, onOpenChange, setIsSaving, setFormStatus, toast]);

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
        onOpenChange={onOpenChange}
        title={title}
        size="lg"
        showCloseButton={false} // Remove the close button in the header
      >
        <div className="p-6 flex-1 overflow-auto bg-background" style={{ maxHeight: 'calc(100vh - 140px)' }}>
          <Accordion
            type="single"
            collapsible
            value={activeSection}
            onValueChange={(value) => value && setActiveSection(value)}
            className="w-full"
          >
            <AccordionItem value="general-info">
              <AccordionTrigger className="py-4 text-lg font-medium">
                <div className="flex items-center justify-between w-full pr-4">
                  <div className="flex items-center">
                    <FileText className="mr-3 h-5 w-5 text-blue-500" />
                    General Information
                  </div>
                  {validationErrors['client_id'] || validationErrors['date'] || validationErrors['client_type'] || validationErrors['status'] ? (
                    <AlertCircle className="h-5 w-5 text-destructive" />
                  ) : null}
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-6">
                <OrderGeneralInfoForm
                  active={activeSection === 'general-info'}
                  order={order}
                  updateOrderField={updateOrderField}
                  isEditing={isEditing}
                  clients={mockClients}
                  errors={validationErrors}
                />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="items">
              <AccordionTrigger className="py-4 text-lg font-medium">
                <div className="flex items-center justify-between w-full pr-4">
                  <div className="flex items-center">
                    <Box className="mr-3 h-5 w-5 text-orange-500" />
                    Order Items
                    {order.items && order.items.length > 0 && (
                      <span className="ml-2 text-sm text-muted-foreground">({order.items.length})</span>
                    )}
                  </div>
                  {validationErrors['items'] ? (
                    <AlertCircle className="h-5 w-5 text-destructive" />
                  ) : null}
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-6">
                <OrderItemsForm
                  active={activeSection === 'items'}
                  order={order}
                  updateOrderFields={updateOrderFields}
                  openDeleteDialog={openDeleteDialog}
                  recalculateOrder={recalculateOrder}
                  categories={mockCategories}
                  items={mockItems}
                  errors={validationErrors}
                />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="payments">
              <AccordionTrigger className="py-4 text-lg font-medium">
                <div className="flex items-center justify-between w-full pr-4">
                  <div className="flex items-center">
                    <CreditCard className="mr-3 h-5 w-5 text-green-500" />
                    Payments
                    {order.payments && order.payments.length > 0 && (
                      <span className="ml-2 text-sm text-muted-foreground">({order.payments.length})</span>
                    )}
                  </div>
                  {validationErrors['payments'] ? (
                    <AlertCircle className="h-5 w-5 text-destructive" />
                  ) : null}
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-6">
                <OrderPaymentsForm
                  active={activeSection === 'payments'}
                  order={order}
                  updateOrderFields={updateOrderFields}
                  openDeleteDialog={openDeleteDialog}
                  recalculateOrder={recalculateOrder}
                  toast={toast}
                  errors={validationErrors}
                />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="notes">
              <AccordionTrigger className="py-4 text-lg font-medium">
                <div className="flex items-center justify-between w-full pr-4">
                  <div className="flex items-center">
                    <StickyNote className="mr-3 h-5 w-5 text-purple-500" />
                    Notes
                    {order.notes && order.notes.length > 0 && (
                      <span className="ml-2 text-sm text-muted-foreground">({order.notes.length})</span>
                    )}
                  </div>
                  {validationErrors['notes'] ? (
                    <AlertCircle className="h-5 w-5 text-destructive" />
                  ) : null}
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-6">
                <OrderNotesForm
                  active={activeSection === 'notes'}
                  order={order}
                  updateOrderFields={updateOrderFields}
                  openDeleteDialog={openDeleteDialog}
                  errors={validationErrors}
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        <div className="border-t border-border/40 p-6 flex justify-between bg-card sticky bottom-0 left-0 right-0">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="outline"
              className="border-border/40 bg-transparent hover:bg-muted/50 text-muted-foreground hover:text-foreground"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              <Ban className="mr-2 h-4 w-4" />
              Cancel
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