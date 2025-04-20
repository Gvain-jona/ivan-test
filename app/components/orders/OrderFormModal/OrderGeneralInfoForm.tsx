import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  SimpleSelect,
  SimpleSelectContent,
  SimpleSelectItem,
  SimpleSelectTrigger,
  SimpleSelectValue,
} from '@/components/ui/simple-select';
import { formatCurrency } from '@/utils/formatting.utils';
import { Order, OrderStatus, ClientType } from '@/types/orders';
import { FormSection } from '@/components/ui/form/FormSection';
import { ComboboxOption } from '@/components/ui/combobox';
import FieldError from '@/components/ui/form/FieldError';

interface OrderGeneralInfoFormProps {
  active: boolean;
  order: Partial<Order>;
  updateOrderField: <K extends keyof Order>(field: K, value: Order[K]) => void;
  clients?: ComboboxOption[];
  errors?: Record<string, string[]>;
}

/**
 * Component for the general info tab of the order form
 */
const OrderGeneralInfoForm: React.FC<OrderGeneralInfoFormProps> = ({
  active,
  order,
  updateOrderField,
  clients = [],
  errors = {},
}) => {
  // Debug order data received by the form
  console.log('OrderGeneralInfoForm received order:', order);
  // We're using a regular input for client name instead of a smart dropdown
  // Set default values for new orders - using a ref to prevent infinite loops
  const defaultsSetRef = React.useRef(false);

  React.useEffect(() => {
    if (!active || defaultsSetRef.current) return;

    // Only set defaults once when the component becomes active
    let needsUpdate = false;
    let updates: Partial<Order> = {};

    // Set default client type if not already set
    if (!order.client_type) {
      updates.client_type = 'regular' as ClientType;
      needsUpdate = true;
    }

    // Set default status if not already set
    if (!order.status) {
      updates.status = 'pending' as OrderStatus;
      needsUpdate = true;
    }

    // Only update if needed and only once
    if (needsUpdate) {
      // Use a timeout to prevent React update depth issues
      setTimeout(() => {
        Object.entries(updates).forEach(([key, value]) => {
          updateOrderField(key as keyof Order, value);
        });
      }, 0);
    }

    defaultsSetRef.current = true;
  }, [active]); // Only depend on active state

  return (
    <div className="space-y-6">
      <FormSection title="Order Details" titleClassName="text-lg font-semibold text-foreground mb-4">
        <div className="space-y-6">
          {/* Order ID field removed as per user request */}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="order_date" className="text-sm font-medium">
                Order Date
                {errors['date'] && <span className="text-destructive ml-1">*</span>}
              </Label>
              <Input
                id="order_date"
                type="date"
                value={order.date || ''}
                onChange={(e) => updateOrderField('date', e.target.value)}
                className={errors['date'] ? 'border-destructive bg-background border-input h-10' : 'bg-background border-input h-10'}
              />
              <FieldError errors={errors['date']} fieldName="date" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="client_name" className="text-sm font-medium">
                Client Name
                {errors['client_name'] && <span className="text-destructive ml-1">*</span>}
              </Label>
              <Input
                id="client_name"
                value={order.client_name || ''}
                onChange={(e) => updateOrderField('client_name', e.target.value)}
                placeholder="Enter client name"
                className={errors['client_name'] ? 'border-destructive bg-background border-input h-10' : 'bg-background border-input h-10'}
              />
              <FieldError errors={errors['client_name']} fieldName="client_name" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="client_type" className="text-sm font-medium">Client Type</Label>
              <SimpleSelect
                value={order.client_type || 'regular'}
                onValueChange={(value) => updateOrderField('client_type', value as ClientType)}
              >
                <SimpleSelectTrigger id="client_type" className="bg-background border-input">
                  <SimpleSelectValue placeholder="Select client type" />
                </SimpleSelectTrigger>
                <SimpleSelectContent>
                  <SimpleSelectItem value="regular">Regular</SimpleSelectItem>
                  <SimpleSelectItem value="contract">Contract</SimpleSelectItem>
                </SimpleSelectContent>
              </SimpleSelect>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status" className="text-sm font-medium">
                Status
                {errors['status'] && <span className="text-destructive ml-1">*</span>}
              </Label>
              <SimpleSelect
                value={order.status || 'pending'}
                onValueChange={(value) => updateOrderField('status', value as OrderStatus)}
              >
                <SimpleSelectTrigger
                  id="status"
                  className={errors['status'] ? 'border-destructive bg-background border-input' : 'bg-background border-input'}
                >
                  <SimpleSelectValue placeholder="Select status" />
                </SimpleSelectTrigger>
                <SimpleSelectContent>
                  <SimpleSelectItem value="pending">Pending</SimpleSelectItem>
                  <SimpleSelectItem value="paused">Paused</SimpleSelectItem>
                  <SimpleSelectItem value="in_progress">In Progress</SimpleSelectItem>
                  <SimpleSelectItem value="completed">Completed</SimpleSelectItem>
                  <SimpleSelectItem value="delivered">Delivered</SimpleSelectItem>
                  <SimpleSelectItem value="cancelled">Cancelled</SimpleSelectItem>
                </SimpleSelectContent>
              </SimpleSelect>
              <FieldError errors={errors['status']} fieldName="status" />
            </div>
          </div>
        </div>
      </FormSection>

      <FormSection title="Financial Summary" titleClassName="text-lg font-semibold text-foreground mb-4">
        <div className="space-y-6">
          <div className="mt-2 p-4 bg-muted/20 rounded-md border border-border/30">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <span className="text-sm font-medium mr-2">Total Amount:</span>
                <span className="text-lg font-semibold">
                  {formatCurrency(order.total_amount || 0)}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Amount Paid</Label>
              <Input
                disabled
                value={formatCurrency(order.amount_paid || 0)}
                className="bg-muted/30 border-muted text-foreground/90"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Balance</Label>
              <Input
                disabled
                value={formatCurrency(order.balance || 0)}
                className="bg-muted/30 border-muted text-foreground/90 font-medium"
              />
            </div>
          </div>
        </div>
      </FormSection>
    </div>
  );
};

export default OrderGeneralInfoForm;