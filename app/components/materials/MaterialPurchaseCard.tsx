'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Edit, Trash2, Eye, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { MaterialPurchase, useDeleteMaterialPurchase } from '@/hooks/materials';
import { formatCurrency } from '@/lib/utils';

interface MaterialPurchaseCardProps {
  purchase: MaterialPurchase;
  onView?: (purchase: MaterialPurchase) => void;
  onEdit?: (purchase: MaterialPurchase) => void;
  onDelete?: () => void;
  onAddPayment?: (purchase: MaterialPurchase) => void;
}

export function MaterialPurchaseCard({
  purchase,
  onView,
  onEdit,
  onDelete,
  onAddPayment,
}: MaterialPurchaseCardProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();
  const { deletePurchase, isLoading } = useDeleteMaterialPurchase();

  const handleDelete = async () => {
    try {
      await deletePurchase(purchase.id);
      toast({
        title: 'Material purchase deleted',
        description: 'The material purchase has been deleted successfully.',
      });
      if (onDelete) {
        onDelete();
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'An error occurred while deleting the material purchase.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  // Determine badge color based on payment status
  const getBadgeVariant = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'partially_paid':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'unpaid':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return '';
    }
  };

  return (
    <>
      <Card className="overflow-hidden transition-all hover:shadow-md">
        <CardContent className="p-6">
          <div className="flex flex-col space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium text-lg">{purchase.material_name}</h3>
                <p className="text-muted-foreground text-sm">
                  Supplier: {purchase.supplier_name}
                </p>
              </div>
              <Badge variant="outline" className={getBadgeVariant(purchase.payment_status)}>
                {purchase.payment_status === 'paid'
                  ? 'Paid'
                  : purchase.payment_status === 'partially_paid'
                  ? 'Partially Paid'
                  : 'Unpaid'}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Date</p>
                <p>{format(new Date(purchase.date), 'PPP')}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Quantity</p>
                <p>{purchase.quantity}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total Amount</p>
                <p className="font-medium">{formatCurrency(purchase.total_amount)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Amount Paid</p>
                <p>{formatCurrency(purchase.amount_paid)}</p>
              </div>
            </div>

            {purchase.notes && (
              <div className="mt-2">
                <p className="text-muted-foreground text-sm">Notes</p>
                <p className="text-sm">{purchase.notes}</p>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="bg-muted/30 px-6 py-3 flex justify-end space-x-2">
          <Button variant="ghost" size="sm" onClick={() => onView && onView(purchase)}>
            <Eye className="h-4 w-4 mr-1" />
            View
          </Button>
          {purchase.payment_status !== 'paid' && (
            <Button variant="ghost" size="sm" onClick={() => onAddPayment && onAddPayment(purchase)}>
              <CreditCard className="h-4 w-4 mr-1" />
              Add Payment
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => onEdit && onEdit(purchase)}>
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-500 hover:text-red-600"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </CardFooter>
      </Card>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this material purchase and all associated payments. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={isLoading}
              className="bg-red-500 hover:bg-red-600"
            >
              {isLoading ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
