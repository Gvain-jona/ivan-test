'use client';

import { useState, useEffect, useCallback } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  CalendarIcon,
  Loader2,
  CreditCard,
  CheckCircle,
  FileText,
  Package,
  DollarSign,
  CalendarClock,
  RotateCcw,
  Plus,
  Trash2
} from 'lucide-react';
import { format, addDays } from 'date-fns';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { MaterialPurchase } from '@/types/materials';
import { useMaterialPurchasesList } from '@/hooks/materials';
import { formatCurrency } from '@/utils/formatting.utils';
import {
  Card,
  CardContent
} from '@/components/ui/card';

// Form schema
const formSchema = z.object({
  supplier_name: z.string().min(1, 'Supplier name is required'),
  material_name: z.string().min(1, 'Material name is required'),
  date: z.date({
    required_error: 'Date is required',
  }),
  quantity: z.coerce.number().positive('Quantity must be positive'),
  unit: z.string().optional(), // Unit of measurement (e.g., kg, liters, pieces)
  // Unit price is now stored in the database
  unit_price: z.coerce.number().positive('Unit price must be positive'),
  total_amount: z.coerce.number().positive('Total amount must be positive'),
  notes: z.string().optional(),
  // Installment plan fields - match database schema
  installment_plan: z.boolean().default(false),
  total_installments: z.coerce.number().min(1, 'Must have at least 1 installment').optional(),
  payment_frequency: z.enum(['weekly', 'biweekly', 'monthly', 'quarterly']).optional(),
  first_payment_date: z.date().optional(), // This will be stored as next_payment_date in the database
  reminder_days: z.coerce.number().min(0).max(30).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface MaterialPurchaseFormProps {
  purchase?: MaterialPurchase;
  onSuccess?: () => void;
  onCancel?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}

export function MaterialPurchaseForm({
  purchase,
  onSuccess,
  onCancel,
  open,
  onOpenChange,
  children
}: MaterialPurchaseFormProps) {
  // Define payment type
  type Payment = {
    id: string;
    amount: number;
    date: Date;
    payment_method: string;
  };

  // State for form submission and UI controls
  const [showNotes, setShowNotes] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState<Date>(new Date());
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const { toast } = useToast();
  const {
    createMaterialPurchase,
    updateMaterialPurchase,
    isSubmitting
  } = useMaterialPurchasesList();
  const isLoading = isSubmitting;
  const isEditing = !!purchase;

  // Initialize form with default values or existing purchase data
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      supplier_name: purchase?.supplier_name || '',
      material_name: purchase?.material_name || '',
      date: purchase?.date ? new Date(purchase.date) : new Date(),
      quantity: purchase?.quantity || 1,
      unit: purchase?.unit || '', // Add unit field
      unit_price: purchase?.total_amount ? purchase.total_amount / (purchase.quantity || 1) : 0,
      total_amount: purchase?.total_amount || 0,
      notes: purchase?.notes || '',
      // Installment plan fields
      installment_plan: purchase?.installment_plan || false,
      total_installments: purchase?.total_installments || 3,
      payment_frequency: (purchase?.payment_frequency as any) || 'monthly',
      first_payment_date: purchase?.next_payment_date ? new Date(purchase.next_payment_date) : addDays(new Date(), 30),
      reminder_days: purchase?.reminder_days || 3,
    },
  });

  // Auto-calculate total amount when quantity or unit price changes
  const quantity = form.watch('quantity');
  const unitPrice = form.watch('unit_price');

  useEffect(() => {
    if (quantity && unitPrice) {
      const total = quantity * unitPrice;
      form.setValue('total_amount', total);
    }
  }, [quantity, unitPrice, form]);

  // Watch form values
  const totalInstallments = form.watch('total_installments');
  const totalAmount = form.watch('total_amount');
  const isInstallmentPlan = form.watch('installment_plan');

  // Calculate installment amount
  const installmentAmount = totalInstallments && totalInstallments > 0 && totalAmount > 0 && isInstallmentPlan
    ? (totalAmount / totalInstallments).toFixed(2)
    : '0.00';

  // Calculate total amount paid from payments
  const totalAmountPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);

  // Calculate remaining balance
  const remainingBalance = totalAmount - totalAmountPaid;

  // Handle adding a new payment
  const handleAddPayment = () => {
    // Validate payment amount
    if (paymentAmount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Payment amount must be greater than zero",
        variant: "destructive"
      });
      return;
    }

    // Validate against remaining balance
    if (paymentAmount > remainingBalance) {
      toast({
        title: "Amount exceeds balance",
        description: `Payment amount cannot exceed the remaining balance of ${formatCurrency(remainingBalance)}`,
        variant: "destructive"
      });
      return;
    }

    // Validate total amount
    if (totalAmount <= 0) {
      toast({
        title: "Invalid purchase amount",
        description: "Please enter a valid purchase amount before adding payments",
        variant: "destructive"
      });
      return;
    }

    // Create new payment
    const newPayment: Payment = {
      id: `temp-${Date.now()}`,
      amount: paymentAmount,
      date: paymentDate,
      payment_method: paymentMethod
    };

    // Add to payments array
    setPayments([...payments, newPayment]);

    // Reset form fields
    setPaymentAmount(0);
    setPaymentDate(new Date());
    setShowAddPayment(false);

    // Show success message
    toast({
      title: "Payment added",
      description: `Payment of ${formatCurrency(paymentAmount)} added successfully`,
    });
  };

  // Handle removing a payment
  const handleRemovePayment = (id: string) => {
    setPayments(payments.filter(payment => payment.id !== id));
  };

  const onSubmit = useCallback(async (data: FormValues) => {
    try {
      // Format data to match database schema
      // Format the base purchase data
      const formattedData = {
        supplier_name: data.supplier_name,
        material_name: data.material_name,
        date: format(data.date, 'yyyy-MM-dd'),
        quantity: data.quantity,
        unit: data.unit, // Add unit field
        unit_price: data.unit_price,
        total_amount: data.total_amount,
        notes: data.notes,
        // Installment plan fields - match database schema
        installment_plan: data.installment_plan,
        // If installment plan is not enabled, set amount_paid to total_amount (fully paid)
        // If installment plan is enabled, use the sum of payments
        amount_paid: data.installment_plan ? totalAmountPaid : data.total_amount,
        ...(data.installment_plan && {
          total_installments: data.total_installments,
          payment_frequency: data.payment_frequency,
          next_payment_date: data.first_payment_date ? format(data.first_payment_date, 'yyyy-MM-dd') : undefined,
          reminder_days: data.reminder_days,
        }),
      };

      // Prepare payments data if any exist
      const paymentsData = payments.length > 0 ? payments.map(payment => ({
        amount: payment.amount,
        date: format(payment.date, 'yyyy-MM-dd'),
        payment_method: payment.payment_method
      })) : [];

      try {
        let purchaseResult;
        let purchaseId;

        if (isEditing && purchase) {
          // Update existing purchase with optimistic update
          purchaseResult = await updateMaterialPurchase(purchase.id, formattedData);
          purchaseId = purchase.id;
        } else {
          // Create new purchase with optimistic update
          purchaseResult = await createMaterialPurchase(formattedData);
          purchaseId = purchaseResult?.id;
        }

        // If purchase was created/updated successfully and we have payments to add
        if (purchaseResult && purchaseId && data.installment_plan && paymentsData.length > 0) {
          // Add each payment
          for (const paymentData of paymentsData) {
            try {
              // Use the API to add the payment
              await fetch(`/api/material-purchases/${purchaseId}/payments`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ payment: paymentData }),
              });
            } catch (paymentError) {
              console.error('Error adding payment:', paymentError);
              // Continue with other payments even if one fails
            }
          }
        }

        // If purchase was created/updated successfully and it's an installment plan
        if (purchaseResult && purchaseId && data.installment_plan) {
          try {
            // Create the installment plan
            const installmentData = {
              total_installments: data.total_installments,
              payment_frequency: data.payment_frequency,
              first_payment_date: data.first_payment_date ? format(data.first_payment_date, 'yyyy-MM-dd') : format(addDays(new Date(), 30), 'yyyy-MM-dd'),
              reminder_days: data.reminder_days || 3,
            };

            console.log('Creating installment plan with data:', installmentData);

            // Use the API to create the installment plan
            const response = await fetch(`/api/material-purchases/${purchaseId}/installments`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(installmentData),
            });

            const result = await response.json();

            if (!response.ok) {
              throw new Error(result.error?.message || 'Failed to create installment plan');
            }

            console.log('Installment plan created successfully:', result);

            // Show success message
            toast({
              title: 'Installment plan created',
              description: 'The installment plan has been created successfully.',
            });
          } catch (installmentError) {
            console.error('Error creating installment plan:', installmentError);
            toast({
              title: 'Warning',
              description: 'The purchase was saved but the installment plan could not be created.',
              variant: 'destructive',
            });
          }
        }

        // Success handling
        if (purchaseResult) {
          // Success is handled by the hook with toast notification
          if (onSuccess) {
            onSuccess();
          }

          if (!isEditing) {
            // Reset form for new purchases
            form.reset({
              supplier_name: '',
              material_name: '',
              date: new Date(),
              quantity: 1,
              unit: '', // Add unit field
              unit_price: 0,
              total_amount: 0,
              notes: '',
              installment_plan: false,
            });
          }

          // Close the sheet after successful submission
          if (onOpenChange) {
            onOpenChange(false);
          }

          // Call onCancel if provided (for backward compatibility)
          if (onCancel && !isEditing) {
            onCancel();
          }
        }
      } catch (submitError) {
        console.error('Error in form submission:', submitError);
        toast({
          title: 'Error',
          description: 'An error occurred while saving the purchase. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Error submitting form:', error);
      // Error handling is done in the hook, but we can add additional UI feedback here
      toast({
        title: 'Form Error',
        description: 'Please check the form for errors and try again.',
        variant: 'destructive',
      });
    }
  }, [
    form,
    isEditing,
    purchase,
    createMaterialPurchase,
    updateMaterialPurchase,
    onSuccess,
    onOpenChange,
    onCancel,
    toast,
    totalAmountPaid,
    payments
  ]);

  // If children are provided, render them as a trigger for the sheet
  if (children) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetTrigger asChild>
          {children}
        </SheetTrigger>
        <SheetContent className="sm:max-w-md md:max-w-xl lg:max-w-2xl flex flex-col p-0">
          {isLoading && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  {isEditing ? 'Updating purchase...' : 'Creating purchase...'}
                </p>
              </div>
            </div>
          )}

          <SheetHeader className="border-b p-6">
            <SheetTitle className="text-xl font-semibold">{isEditing ? 'Edit Material Purchase' : 'Add Material Purchase'}</SheetTitle>
            <SheetDescription>
              {isEditing ? 'Update material purchase details' : 'Add a new material purchase to track your inventory'}
            </SheetDescription>
          </SheetHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
              <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-20">
                {/* Purchase Details Section */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <Package className="h-5 w-5 text-primary/80" />
                    <h3 className="text-lg font-medium">Purchase Details</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Material Name - Moved to top for better hierarchy */}
                    <FormField
                      control={form.control}
                      name="material_name"
                      render={({ field }) => (
                        <FormItem className="col-span-full">
                          <FormLabel>Material Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter material name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Supplier Name */}
                    <FormField
                      control={form.control}
                      name="supplier_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Supplier Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter supplier name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Date */}
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel>Purchase Date</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                type="date"
                                className="pl-10"
                                value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                                onChange={(e) => {
                                  const date = e.target.value ? new Date(e.target.value) : null;
                                  field.onChange(date);
                                }}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Pricing Section */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <DollarSign className="h-5 w-5 text-primary/80" />
                    <h3 className="text-lg font-medium">Pricing Details</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Quantity */}
                    <FormField
                      control={form.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantity</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Enter quantity"
                              {...field}
                              onChange={(e) => {
                                field.onChange(e.target.valueAsNumber || 0);
                              }}
                              min={1}
                              step={1}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Unit */}
                    <FormField
                      control={form.control}
                      name="unit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unit</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., kg, liters, pieces"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Unit Price */}
                    <FormField
                      control={form.control}
                      name="unit_price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unit Price</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">UGX</span>
                              <Input
                                type="number"
                                placeholder="Enter unit price"
                                {...field}
                                onChange={(e) => {
                                  field.onChange(e.target.valueAsNumber || 0);
                                }}
                                className="pl-12"
                                min={0}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Total Amount (calculated) */}
                  <FormField
                    control={form.control}
                    name="total_amount"
                    render={({ field }) => (
                      <FormItem>
                        <div className="rounded-lg border p-4 bg-muted/20">
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base font-medium">Total Amount</FormLabel>
                              <FormDescription>
                                Auto-calculated from quantity × unit price
                              </FormDescription>
                            </div>
                            <div className="text-2xl font-bold">
                              {formatCurrency(field.value || 0)}
                            </div>
                          </div>
                        </div>
                        <FormControl>
                          <Input
                            type="number"
                            className="hidden"
                            {...field}
                            readOnly
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>



                {/* Payment Section */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <CreditCard className="h-5 w-5 text-primary/80" />
                    <h3 className="text-lg font-medium">Payment Details</h3>
                  </div>

                  {/* Fully Paid Badge - Show when installment plan is disabled */}
                  {!isInstallmentPlan && (
                    <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-md text-sm text-green-600">
                      <p className="flex items-center">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        This purchase will be marked as fully paid
                      </p>
                    </div>
                  )}

                  {/* Installment Plan Toggle */}
                  <FormField
                    control={form.control}
                    name="installment_plan"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-muted/20">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Enable Installment Payments
                          </FormLabel>
                          <FormDescription>
                            Split the payment into multiple installments
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Installment Plan Configuration - Only show if installment plan is enabled */}
                {isInstallmentPlan && (
                  <div className="space-y-6 border rounded-lg p-5 bg-muted/10 mt-4">
                    <h4 className="text-base font-medium flex items-center gap-2 pb-2 border-b">
                      <CalendarClock className="h-4 w-4 text-primary/70" />
                      Installment Schedule
                    </h4>

                    {/* Payment Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 border rounded-md bg-muted/20">
                        <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
                        <p className="text-lg font-semibold">{formatCurrency(totalAmount)}</p>
                      </div>
                      <div className="p-4 border rounded-md bg-muted/20">
                        <p className="text-sm font-medium text-muted-foreground">Amount Paid</p>
                        <p className="text-lg font-semibold">{formatCurrency(totalAmountPaid)}</p>
                      </div>
                      <div className="p-4 border rounded-md bg-muted/20">
                        <p className="text-sm font-medium text-muted-foreground">Remaining Balance</p>
                        <p className="text-lg font-semibold">{formatCurrency(remainingBalance)}</p>
                      </div>
                    </div>

                    {/* Installment Amount (calculated) */}
                    <div className="p-4 border rounded-md bg-muted/20">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-muted-foreground">Installment Amount</p>
                        <p className="text-lg font-semibold">{formatCurrency(parseFloat(installmentAmount))}</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Each installment payment will be {formatCurrency(parseFloat(installmentAmount))}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Number of Installments */}
                      <FormField
                        control={form.control}
                        name="total_installments"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Number of Installments</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="Enter number of installments"
                                {...field}
                                onChange={(e) => {
                                  field.onChange(e.target.valueAsNumber || 1);
                                }}
                                min={1}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Payment Frequency */}
                      <FormField
                        control={form.control}
                        name="payment_frequency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Payment Frequency</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select payment frequency" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="weekly">Weekly</SelectItem>
                                <SelectItem value="biweekly">Bi-weekly</SelectItem>
                                <SelectItem value="monthly">Monthly</SelectItem>
                                <SelectItem value="quarterly">Quarterly</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* First Payment Date */}
                      <FormField
                        control={form.control}
                        name="first_payment_date"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel>First Payment Date</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  type="date"
                                  className="pl-10"
                                  value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                                  onChange={(e) => {
                                    const date = e.target.value ? new Date(e.target.value) : null;
                                    field.onChange(date);
                                  }}
                                  min={format(new Date(), "yyyy-MM-dd")}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Reminder Days */}
                      <FormField
                        control={form.control}
                        name="reminder_days"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Reminder Days Before Due Date</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="Enter days before due date for reminder"
                                {...field}
                                onChange={(e) => {
                                  field.onChange(e.target.valueAsNumber || 3);
                                }}
                                min={0}
                                max={30}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Payments Section */}
                    <div className="mt-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-base font-medium flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-primary/70" />
                          Payments
                        </h4>
                        <div className="flex items-center gap-2">
                          <div className="text-sm text-muted-foreground">
                            <span className="font-medium">{payments.length}</span> payments
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowAddPayment(!showAddPayment)}
                            className="text-xs"
                            disabled={remainingBalance <= 0 && !showAddPayment}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            {showAddPayment ? "Cancel" : "Add Payment"}
                          </Button>
                        </div>
                      </div>

                      {/* Payment Summary */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                        <div className="p-3 border rounded-md bg-muted/10">
                          <p className="text-xs font-medium text-muted-foreground">Total Paid</p>
                          <p className="text-base font-semibold">{formatCurrency(totalAmountPaid)}</p>
                        </div>
                        <div className="p-3 border rounded-md bg-muted/10">
                          <p className="text-xs font-medium text-muted-foreground">Remaining Balance</p>
                          <p className="text-base font-semibold">{formatCurrency(remainingBalance)}</p>
                        </div>
                      </div>

                      {/* Fully Paid Message */}
                      {totalAmount > 0 && remainingBalance <= 0 && (
                        <div className="p-3 border rounded-md bg-green-500/10 border-green-500/20 text-green-600 text-sm">
                          <p className="flex items-center">
                            <CheckCircle className="h-4 w-4 mr-2" />
                            This purchase is fully paid
                          </p>
                        </div>
                      )}

                      {/* Add Payment Form */}
                      {showAddPayment && (
                        <div className="border rounded-md p-4 space-y-4 bg-muted/20">
                          <h5 className="text-sm font-medium">New Payment</h5>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="payment-amount">Amount</Label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">UGX</span>
                                <Input
                                  id="payment-amount"
                                  type="number"
                                  placeholder="Enter amount"
                                  value={paymentAmount || ''}
                                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                                  className="pl-12"
                                  min={0}
                                  max={remainingBalance}
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="payment-date">Date</Label>
                              <div className="relative">
                                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  id="payment-date"
                                  type="date"
                                  className="pl-10"
                                  value={format(paymentDate, "yyyy-MM-dd")}
                                  onChange={(e) => {
                                    const date = e.target.value ? new Date(e.target.value) : new Date();
                                    setPaymentDate(date);
                                  }}
                                  max={format(new Date(), "yyyy-MM-dd")}
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="payment-method">Payment Method</Label>
                              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                <SelectTrigger id="payment-method">
                                  <SelectValue placeholder="Select payment method" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="cash">Cash</SelectItem>
                                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
                                  <SelectItem value="check">Check</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="flex justify-end mt-4">
                            <Button
                              type="button"
                              onClick={handleAddPayment}
                              className="text-xs"
                            >
                              Add Payment
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Payments List */}
                      {payments.length > 0 ? (
                        <div className="border rounded-md divide-y bg-muted/10">
                          {payments.map((payment) => (
                            <div key={payment.id} className="p-3 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="bg-muted/30 p-2 rounded-full">
                                  <CreditCard className="h-4 w-4" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium">{formatCurrency(payment.amount)}</p>
                                  <p className="text-xs text-muted-foreground">{format(payment.date, "PPP")} • {payment.payment_method}</p>
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemovePayment(payment.id)}
                                className="h-8 w-8 p-0 text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="border rounded-md p-6 text-center text-muted-foreground bg-muted/10">
                          {totalAmount > 0 ? (
                            <>
                              <p className="text-sm">No payments added yet</p>
                              <p className="text-xs mt-1">Click "Add Payment" to record a payment</p>
                            </>
                          ) : (
                            <>
                              <p className="text-sm">Enter purchase details first</p>
                              <p className="text-xs mt-1">Set quantity and unit price to calculate total amount</p>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Notes Section */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between pb-2 border-b">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary/80" />
                      <h3 className="text-lg font-medium">Notes</h3>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowNotes(!showNotes)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      {showNotes ? "Hide" : "Add"}
                    </Button>
                  </div>

                  {showNotes && (
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea
                              placeholder="Enter any additional notes about this purchase..."
                              className="resize-none min-h-[120px]"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Optional: Add any relevant details about this purchase
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </div>

              <div className="border-t p-6 bg-background sticky bottom-0 left-0 right-0">
                <div className="flex justify-between items-center w-full">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      form.reset();
                    }}
                    disabled={isLoading}
                    className="text-muted-foreground"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset Form
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="min-w-[160px] px-6"
                  >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isEditing ? 'Update Purchase' : 'Save Purchase'}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </SheetContent>
      </Sheet>
    );
  }

  // If no children are provided, still use the Sheet component but with a hidden trigger
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <span className="hidden" />
      </SheetTrigger>
      <SheetContent className="sm:max-w-md md:max-w-xl lg:max-w-2xl flex flex-col p-0">
        {isLoading && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                {isEditing ? 'Updating purchase...' : 'Creating purchase...'}
              </p>
            </div>
          </div>
        )}

        <SheetHeader className="border-b p-6">
          <SheetTitle className="text-xl font-semibold">{isEditing ? 'Edit Material Purchase' : 'Add Material Purchase'}</SheetTitle>
          <SheetDescription>
            {isEditing ? 'Update material purchase details' : 'Add a new material purchase to track your inventory'}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-20">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Supplier Name */}
                <FormField
                  control={form.control}
                  name="supplier_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supplier Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter supplier name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Date */}
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date > new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Material Name */}
              <FormField
                control={form.control}
                name="material_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Material Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter material name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Quantity */}
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter quantity"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e.target.valueAsNumber || 0);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Unit Price */}
                <FormField
                  control={form.control}
                  name="unit_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit Price</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">UGX</span>
                          <Input
                            type="number"
                            placeholder="Enter unit price"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e.target.valueAsNumber || 0);
                            }}
                            className="pl-12"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Total Amount (calculated) */}
              <FormField
                control={form.control}
                name="total_amount"
                render={({ field }) => (
                  <FormItem className="col-span-full">
                    <div className="rounded-lg border p-4 bg-muted/20">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base font-medium">Total Amount</FormLabel>
                          <FormDescription>
                            Auto-calculated from quantity × unit price
                          </FormDescription>
                        </div>
                        <div className="text-2xl font-bold">
                          {formatCurrency(field.value || 0)}
                        </div>
                      </div>
                    </div>
                    <FormControl>
                      <Input
                        type="number"
                        className="hidden"
                        {...field}
                        readOnly
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />


              {/* Notes Section */}
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-2 border-b">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary/80" />
                    <h3 className="text-lg font-medium">Notes</h3>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowNotes(!showNotes)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {showNotes ? "Hide" : "Add"}
                  </Button>
                </div>

                {showNotes && (
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            placeholder="Enter any additional notes about this purchase..."
                            className="resize-none min-h-[120px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Optional: Add any relevant details about this purchase
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              </div>

              <div className="border-t p-6 bg-background sticky bottom-0 left-0 right-0">
                <div className="flex justify-between items-center w-full">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      form.reset();
                    }}
                    disabled={isLoading}
                    className="text-muted-foreground"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset Form
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="min-w-[160px] px-6"
                  >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isEditing ? 'Update Purchase' : 'Save Purchase'}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
      </SheetContent>
    </Sheet>
  );
}
