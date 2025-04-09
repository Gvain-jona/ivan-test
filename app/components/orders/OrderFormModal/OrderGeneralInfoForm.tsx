import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatCurrency } from '@/utils/formatting.utils';
import { Order, OrderStatus, ClientType, PaymentMethod } from '@/types/orders';
import { FormSection } from '@/components/ui/form/FormSection';
import { Combobox, ComboboxOption } from '@/components/ui/combobox';
import { SmartCombobox } from '@/components/ui/smart-combobox';
import { useSmartDropdown } from '@/hooks/useSmartDropdown';

interface OrderGeneralInfoFormProps {
  active: boolean;
  order: Partial<Order>;
  updateOrderField: <K extends keyof Order>(field: K, value: Order[K]) => void;
  isEditing: boolean;
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
  isEditing,
  clients = [],
  errors = {},
}) => {
  // Use our smart dropdown hook for clients
  const {
    options: clientOptions,
    isLoading: clientsLoading,
    setSearchQuery: setClientSearch,
    createOption: createClient
  } = useSmartDropdown({
    entityType: 'clients',
    initialOptions: clients.map(c => ({ value: c.value, label: c.label })),
  });

  // Handle creating a new client
  const handleCreateClient = async (value: string) => {
    const newClient = await createClient(value);
    if (newClient) {
      updateOrderField('client_id', newClient.value);
      return newClient;
    }
    return null;
  };
  return (
    <div className="space-y-6">
      <FormSection title="Order Details" titleClassName="text-lg font-semibold text-foreground mb-4">
        <div className="space-y-6">
          {isEditing && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="order_id" className="text-sm font-medium">Order ID</Label>
                <Input
                  id="order_id"
                  disabled
                  value={order.id || ''}
                  className="bg-background border-input h-10"
                />
              </div>
              <div></div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="order_date" className="text-sm font-medium">Order Date</Label>
              <Input
                id="order_date"
                type="date"
                value={order.date || ''}
                onChange={(e) => updateOrderField('date', e.target.value)}
                className="bg-background border-input h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="client" className="text-sm font-medium">Client</Label>
              <SmartCombobox
                options={clientOptions}
                value={order.client_id || ''}
                onChange={(value) => updateOrderField('client_id', value)}
                onSearch={setClientSearch}
                isLoading={clientsLoading}
                placeholder="Select or search client"
                allowCreate={true}
                onCreateOption={handleCreateClient}
                entityName="Client"
                className="bg-background border-input"
                emptyMessage="No clients found. Create one?"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="client_type" className="text-sm font-medium">Client Type</Label>
              <Select
                value={order.client_type || 'regular'}
                onValueChange={(value) => updateOrderField('client_type', value as ClientType)}
              >
                <SelectTrigger id="client_type" className="bg-background border-input">
                  <SelectValue placeholder="Select client type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="regular">Regular</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status" className="text-sm font-medium">Status</Label>
              <Select
                value={order.status || 'paused'}
                onValueChange={(value) => updateOrderField('status', value as OrderStatus)}
              >
                <SelectTrigger id="status" className="bg-background border-input">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
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
                value={formatCurrency((order.total_amount || 0) - (order.amount_paid || 0))}
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