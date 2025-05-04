import React, { useState, useEffect } from 'react';
import { format, parseISO, isBefore } from 'date-fns';
import {
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  DollarSign,
  Bell,
  RefreshCw
} from 'lucide-react';
import { useSWRConfig } from 'swr';
import { API_ENDPOINTS } from '@/lib/api-endpoints';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  MaterialInstallment,
  MaterialPurchase,
  MaterialPayment
} from '@/types/materials';
import { useMaterialInstallments } from '@/hooks/materials';
import { formatCurrency } from '@/lib/utils';
import { MaterialPaymentForm } from './forms/MaterialPaymentForm';
import { useToast } from '@/components/ui/use-toast';

interface InstallmentPlanViewProps {
  purchase: MaterialPurchase;
  refreshPurchase?: () => void;
}

export function InstallmentPlanView({ purchase, refreshPurchase }: InstallmentPlanViewProps) {
  // Use installments from purchase prop if available, otherwise fetch them
  const { installments: fetchedInstallments, isLoading: isLoadingInstallments, mutate } = useMaterialInstallments(purchase.id);
  const [selectedInstallment, setSelectedInstallment] = useState<MaterialInstallment | null>(null);
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);
  const [isFetchingDirectly, setIsFetchingDirectly] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const { toast } = useToast();
  const { mutate: globalMutate } = useSWRConfig();

  // Ref to track if we've already fetched data for this purchase
  const didFetchRef = React.useRef(false);

  // Use installments from purchase prop if available, otherwise use fetched installments
  const installments = React.useMemo(() => {
    // If purchase has installments, use them
    if (purchase.installments && purchase.installments.length > 0) {
      return purchase.installments;
    }

    // Otherwise use fetched installments
    return fetchedInstallments;
  }, [purchase.installments, fetchedInstallments]);

  // Determine if we're loading installments
  const isLoading = (isLoadingInstallments || isFetchingDirectly) &&
    (!purchase.installments || purchase.installments.length === 0) &&
    (!fetchedInstallments || fetchedInstallments.length === 0);

  // Reset didFetchRef when purchase.id changes
  React.useEffect(() => {
    // Reset the didFetchRef when the purchase.id changes
    didFetchRef.current = false;

    // Only log in development to reduce console noise
    if (process.env.NODE_ENV === 'development') {
      console.log('InstallmentPlanView - purchase.id changed, resetting didFetchRef');
    }
  }, [purchase.id]);

  // Log installments for debugging - only in development
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('InstallmentPlanView - using installments:', installments?.length || 0);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [installments?.length]);

  // Separate effect for fetching installments to prevent infinite loops
  React.useEffect(() => {
    // Only run this effect once when the component mounts
    // Using a ref to ensure this only runs once per purchase.id
    if (didFetchRef.current || !purchase.installment_plan || isFetchingDirectly || isLoadingInstallments) {
      return;
    }

    // If we have installments already, don't fetch
    if (installments && installments.length > 0) {
      didFetchRef.current = true;
      return;
    }

    // If we've already retried too many times, don't fetch
    if (retryCount >= 3) {
      didFetchRef.current = true;
      return;
    }

    // Add a short delay before fetching to ensure API has time to process
    const timeoutId = setTimeout(() => {
      console.warn('Purchase has installment plan but no installments data. Fetching directly...');
      // Use mutate directly instead of fetchInstallmentsDirectly to avoid infinite loops
      mutate();
      didFetchRef.current = true;
    }, 1000);

    // Clean up the timeout if the component unmounts
    return () => clearTimeout(timeoutId);

    // Only depend on the purchase.id to prevent infinite loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [purchase.id]);

  // Fetch installments directly from the API
  const fetchInstallmentsDirectly = async () => {
    try {
      setIsFetchingDirectly(true);
      setLastFetchTime(Date.now());
      console.log('Fetching installments directly for purchase:', purchase.id);

      // Define all the cache keys that need to be invalidated
      const cacheKeys = [
        // Main purchase cache keys
        `${API_ENDPOINTS.MATERIALS}/${purchase.id}`,
        `${API_ENDPOINTS.MATERIALS}/${purchase.id}/optimized`,
        `${API_ENDPOINTS.MATERIALS}/${purchase.id}/optimized?include_installments=true`,
        `${API_ENDPOINTS.MATERIALS}/${purchase.id}/optimized?include_payments=true&include_notes=true&include_installments=true`,

        // Specific data type cache keys
        `${API_ENDPOINTS.MATERIALS}/${purchase.id}/installments`,

        // List cache keys (these might contain the purchase)
        `${API_ENDPOINTS.MATERIALS}/optimized`,
        `material-purchase-${purchase.id}`,
        `material-purchases-list`
      ];

      // Invalidate all cache keys first to ensure we get fresh data
      console.log('Invalidating the following cache keys:', cacheKeys);
      for (const key of cacheKeys) {
        await globalMutate(
          (cacheKey) => typeof cacheKey === 'string' && cacheKey.includes(key),
          undefined,
          { revalidate: false } // Don't revalidate yet, we'll do it manually
        );
      }

      // First try the optimized endpoint with a fresh fetch (no-cache)
      const optimizedResponse = await fetch(
        `${API_ENDPOINTS.MATERIALS}/${purchase.id}/optimized?include_installments=true`,
        { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } }
      );

      if (optimizedResponse.ok) {
        const optimizedResult = await optimizedResponse.json();
        console.log('Fetched from optimized endpoint:', optimizedResult);

        const optimizedPurchase = optimizedResult.data?.purchase || optimizedResult.purchase;

        if (optimizedPurchase && Array.isArray(optimizedPurchase.installments) && optimizedPurchase.installments.length > 0) {
          console.log('Successfully fetched installments from optimized endpoint:', optimizedPurchase.installments);

          // Update the SWR cache with this fresh data
          await globalMutate(
            `${API_ENDPOINTS.MATERIALS}/${purchase.id}/optimized?include_installments=true`,
            optimizedResult,
            { revalidate: false }
          );

          // Trigger a refresh to update the UI with the fetched data
          await mutate();

          // Don't call refreshPurchase here to avoid infinite loops
          console.log('Skipping refreshPurchase call to avoid infinite loops');

          toast({
            title: "Installment data refreshed",
            description: `Found ${optimizedPurchase.installments.length} installments`,
          });

          return;
        }
      }

      // If optimized endpoint fails or returns no installments, try the direct endpoint
      console.log('Optimized endpoint failed or returned no installments. Trying direct endpoint...');
      const response = await fetch(
        `${API_ENDPOINTS.MATERIALS}/${purchase.id}/installments`,
        { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch installments: ${response.status}`);
      }

      const result = await response.json();
      const installments = result.data?.installments || result.installments || [];

      console.log('Directly fetched installments:', installments);

      if (installments.length === 0) {
        console.warn('No installments found in direct fetch');
        toast({
          title: "No installments found",
          description: "The purchase has an installment plan but no installments were found",
          variant: "warning"
        });
        return;
      }

      // Update the SWR cache with this fresh data
      await globalMutate(
        `${API_ENDPOINTS.MATERIALS}/${purchase.id}/installments`,
        result,
        { revalidate: false }
      );

      // Manually update the purchase object with the fetched installments
      const updatedPurchase = {
        ...purchase,
        installments: installments
      };

      // Update the cache for the purchase with the updated data
      await globalMutate(
        `${API_ENDPOINTS.MATERIALS}/${purchase.id}`,
        { data: { purchase: updatedPurchase } },
        { revalidate: false }
      );

      // Trigger a refresh to update the UI with the fetched data
      await mutate();

      // Don't call refreshPurchase here to avoid infinite loops
      console.log('Skipping refreshPurchase call to avoid infinite loops');

      toast({
        title: "Installment data refreshed",
        description: `Successfully loaded ${installments.length} installments`,
      });
    } catch (error) {
      console.error('Error fetching installments directly:', error);
      toast({
        title: "Error",
        description: "Failed to load installment data",
        variant: "destructive"
      });
    } finally {
      setIsFetchingDirectly(false);
    }
  };

  // Handle refresh data with aggressive cache invalidation
  const refreshData = async () => {
    try {
      console.log('Refreshing installment data with aggressive cache invalidation...');
      setRetryCount(0); // Reset retry count

      // Define all the cache keys that need to be invalidated
      const cacheKeys = [
        // Main purchase cache keys
        `${API_ENDPOINTS.MATERIALS}/${purchase.id}`,
        `${API_ENDPOINTS.MATERIALS}/${purchase.id}/optimized`,
        `${API_ENDPOINTS.MATERIALS}/${purchase.id}/optimized?include_installments=true`,
        `${API_ENDPOINTS.MATERIALS}/${purchase.id}/optimized?include_payments=true&include_notes=true&include_installments=true`,

        // Specific data type cache keys
        `${API_ENDPOINTS.MATERIALS}/${purchase.id}/installments`,

        // List cache keys (these might contain the purchase)
        `${API_ENDPOINTS.MATERIALS}/optimized`,
        `material-purchase-${purchase.id}`,
        `material-purchases-list`
      ];

      // Invalidate all cache keys
      console.log('Invalidating the following cache keys:', cacheKeys);
      for (const key of cacheKeys) {
        await globalMutate(
          (cacheKey) => typeof cacheKey === 'string' && cacheKey.includes(key),
          undefined,
          { revalidate: true }
        );
      }

      // Trigger a refresh of the local data
      await mutate();

      // Don't call refreshPurchase here to avoid infinite loops
      console.log('Skipping refreshPurchase call to avoid infinite loops');

      // If we still don't have installments, fetch them directly
      if ((!installments || installments.length === 0) && purchase.installment_plan) {
        console.warn('Still no installments after refresh. Fetching directly...');
        await fetchInstallmentsDirectly();
      }

      console.log('Installment data refreshed successfully');

      toast({
        title: "Data refreshed",
        description: "Installment data has been refreshed",
      });
    } catch (error) {
      console.error('Error refreshing installment data:', error);
      toast({
        title: "Error",
        description: "Failed to refresh installment data",
        variant: "destructive"
      });
    }
  };

  // Handle add payment for installment
  const handleAddPayment = (installment: MaterialInstallment) => {
    setSelectedInstallment(installment);
    setIsAddPaymentOpen(true);
  };

  // Prepare default payment data for the selected installment
  const getDefaultPaymentData = (): Partial<MaterialPayment> => {
    if (!selectedInstallment) return {};

    return {
      amount: selectedInstallment.amount,
      date: new Date().toISOString(),
      payment_method: 'cash'
    };
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
            Paid
          </Badge>
        );
      case 'overdue':
        return (
          <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
            <AlertCircle className="h-3.5 w-3.5 mr-1" />
            Overdue
          </Badge>
        );
      case 'pending':
      default:
        return (
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
            <Clock className="h-3.5 w-3.5 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  // If there's no installment plan, show a message
  if (!purchase.installment_plan) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle>No Installment Plan</CardTitle>
          <CardDescription>
            This purchase doesn't have an installment payment plan.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // If loading, show a loading message with a refresh button
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Installment Plan</span>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchInstallmentsDirectly}
              disabled={isFetchingDirectly}
            >
              {isFetchingDirectly ? 'Loading...' : 'Refresh'}
            </Button>
          </CardTitle>
          <CardDescription>
            {isFetchingDirectly
              ? 'Fetching installment data...'
              : 'Loading installment plan...'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center space-y-2">
              <Clock className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {isFetchingDirectly
                  ? 'Fetching installment data from server...'
                  : 'Loading installment plan data...'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // If we have an installment plan but no installments data, show a message with a refresh button
  if (purchase.installment_plan && (!installments || installments.length === 0)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Installment Plan</span>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchInstallmentsDirectly}
              disabled={isFetchingDirectly}
            >
              {isFetchingDirectly ? 'Loading...' : 'Refresh'}
            </Button>
          </CardTitle>
          <CardDescription>
            Installment data is missing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center space-y-2">
              <AlertCircle className="h-12 w-12 mx-auto text-yellow-500" />
              <p className="text-sm text-muted-foreground">
                This purchase has an installment plan, but the installment data is missing.
              </p>
              <Button
                variant="default"
                size="sm"
                onClick={fetchInstallmentsDirectly}
                disabled={isFetchingDirectly}
              >
                {isFetchingDirectly ? 'Loading...' : 'Load Installment Data'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate progress
  const totalInstallments = purchase.total_installments || 0;
  const installmentsPaid = purchase.installments_paid || 0;
  const progress = totalInstallments > 0 ? (installmentsPaid / totalInstallments) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <span>Installment Plan</span>
            {getStatusBadge(
              installmentsPaid === totalInstallments
                ? 'paid'
                : installments.some(i => i.status === 'overdue')
                  ? 'overdue'
                  : 'pending'
            )}
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchInstallmentsDirectly}
            disabled={isFetchingDirectly}
          >
            {isFetchingDirectly ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
        <CardDescription>
          Payment plan for this purchase
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Total Installments</p>
            <p className="text-lg font-semibold">{totalInstallments}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Installments Paid</p>
            <p className="text-lg font-semibold">{installmentsPaid}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Payment Frequency</p>
            <p className="text-lg font-semibold capitalize">{purchase.payment_frequency}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Next Payment</p>
            <p className="text-lg font-semibold">
              {purchase.next_payment_date
                ? format(parseISO(purchase.next_payment_date), 'MMM d, yyyy')
                : 'N/A'}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <Separator />

        {/* Installments table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No.</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {installments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <AlertCircle className="h-8 w-8 text-yellow-500" />
                      <div className="text-sm text-muted-foreground">
                        No installments found for this purchase
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchInstallmentsDirectly}
                        disabled={isFetchingDirectly}
                      >
                        {isFetchingDirectly ? 'Loading...' : 'Refresh Installments'}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                installments.map((installment) => (
                  <TableRow key={installment.id}>
                    <TableCell>{installment.installment_number}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                        {format(parseISO(installment.due_date), 'MMM d, yyyy')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                        {formatCurrency(installment.amount)}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(installment.status)}</TableCell>
                    <TableCell className="text-right">
                      {installment.status !== 'paid' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAddPayment(installment)}
                        >
                          Pay Now
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Reminder info */}
        {purchase.reminder_days && (
          <div className="flex items-center text-sm text-muted-foreground">
            <Bell className="h-4 w-4 mr-2" />
            Reminders are set {purchase.reminder_days} days before each due date
          </div>
        )}
      </CardContent>

      {/* Add Payment Form */}
      {selectedInstallment && (
        <MaterialPaymentForm
          purchaseId={purchase.id}
          open={isAddPaymentOpen}
          onOpenChange={setIsAddPaymentOpen}
          defaultValues={{
            amount: selectedInstallment.amount,
            date: new Date(),
            payment_method: 'cash',
            notes: `Payment for installment #${selectedInstallment.installment_number}`
          }}
          onSuccess={async (paymentData) => {
            try {
              // Update the installment to link it to the payment
              const response = await fetch(`/api/material-purchases/${purchase.id}/installments/${selectedInstallment.id}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  status: 'paid',
                  payment_id: paymentData.id
                }),
              });

              if (!response.ok) {
                throw new Error('Failed to update installment status');
              }

              setIsAddPaymentOpen(false);
              // Use mutate directly instead of refreshData to avoid infinite loops
              mutate();
              toast({
                title: "Payment added",
                description: "Your payment has been added successfully and linked to the installment.",
              });
            } catch (error) {
              console.error('Error updating installment:', error);
              toast({
                title: "Warning",
                description: "Payment was added but could not be linked to the installment.",
                variant: "destructive"
              });
            }
          }}
          onCancel={() => setIsAddPaymentOpen(false)}
        >
          <span className="hidden" />
        </MaterialPaymentForm>
      )}
    </Card>
  );
}
