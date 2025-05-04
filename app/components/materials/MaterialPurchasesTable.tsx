'use client';

import React from 'react';
import { FileX, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { MaterialPurchase } from '@/types/materials';
import { formatCurrency, formatDate } from '@/lib/utils';
import { StatusBadge } from './StatusBadge';
import { MaterialPurchaseActions } from './MaterialPurchaseActions';

interface MaterialPurchasesTableProps {
  purchases: MaterialPurchase[];
  isLoading: boolean;
  isEmpty: boolean;
  onViewPurchase: (purchase: MaterialPurchase) => void;
  onDeletePurchase: (id: string) => Promise<void>;
  onAddPurchase: () => void;
}

/**
 * Table component for displaying material purchases
 */
export function MaterialPurchasesTable({
  purchases = [],
  isLoading,
  isEmpty,
  onViewPurchase,
  onDeletePurchase,
  onAddPurchase,
}: MaterialPurchasesTableProps) {
  return (
    <div className="rounded-xl border border-border/40 overflow-hidden">
      <Table className="w-full table-auto">
        <TableHeader className="bg-muted/20">
          <TableRow className="border-b border-border/60">
            {/* Date column */}
            <TableHead className="w-[130px] py-3.5 px-4 font-medium text-foreground whitespace-nowrap">Date</TableHead>

            {/* Supplier column */}
            <TableHead className="py-3.5 px-4 font-medium text-foreground">Supplier</TableHead>

            {/* Material column */}
            <TableHead className="py-3.5 px-4 font-medium text-foreground">Material</TableHead>

            {/* Quantity column */}
            <TableHead className="w-[70px] py-3.5 px-4 text-right font-medium text-foreground">Qty</TableHead>

            {/* Unit Price column */}
            <TableHead className="w-[130px] py-3.5 px-4 text-right font-medium text-foreground whitespace-nowrap">Unit Price</TableHead>

            {/* Total Amount column */}
            <TableHead className="w-[130px] py-3.5 px-4 text-right font-medium text-foreground whitespace-nowrap">Total Amount</TableHead>

            {/* Amount Paid column */}
            <TableHead className="w-[130px] py-3.5 px-4 text-right font-medium text-foreground">Amount Paid</TableHead>

            {/* Balance column */}
            <TableHead className="w-[130px] py-3.5 px-4 text-right font-medium text-foreground">Balance</TableHead>

            {/* Status column */}
            <TableHead className="w-[120px] py-3.5 px-4 font-medium text-foreground">Status</TableHead>

            {/* Actions column */}
            <TableHead className="w-[110px] py-3.5 px-4 text-right font-medium text-foreground">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            // Loading state
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow
                key={index}
                className={`hover:bg-muted/10 ${index % 2 === 0 ? 'bg-muted/5' : ''} border-b border-border/30`}
              >
                <TableCell className="py-3.5 px-4 align-middle border-r border-border/10"><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell className="py-3.5 px-4 align-middle"><Skeleton className="h-4 w-full max-w-[200px]" /></TableCell>
                <TableCell className="py-3.5 px-4 align-middle"><Skeleton className="h-4 w-full max-w-[200px]" /></TableCell>
                <TableCell className="py-3.5 px-4 text-right align-middle"><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                <TableCell className="py-3.5 px-4 text-right align-middle"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                <TableCell className="py-3.5 px-4 text-right align-middle"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                <TableCell className="py-3.5 px-4 text-right align-middle"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                <TableCell className="py-3.5 px-4 text-right align-middle"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                <TableCell className="py-3.5 px-4 align-middle"><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                <TableCell className="py-3.5 px-4 text-right align-middle"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
              </TableRow>
            ))
          ) : isEmpty ? (
            // Empty state
            <TableRow className="border-b border-border/30">
              <TableCell colSpan={10} className="h-32 text-center">
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="rounded-full bg-muted/10 p-3 mb-3">
                    <FileX className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground mb-3">No material purchases found</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onAddPurchase}
                    className="border-border/60 hover:bg-muted/10"
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Purchase
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            // Data state
            purchases.map((purchase, index) => (
              <TableRow
                key={purchase.id}
                className={`hover:bg-muted/10 ${index % 2 === 0 ? 'bg-muted/5' : ''} border-b border-border/30`}
              >
                {/* Date */}
                <TableCell className="py-3.5 px-4 align-middle font-medium border-r border-border/10 whitespace-nowrap">
                  {formatDate(purchase.date)}
                </TableCell>

                {/* Supplier */}
                <TableCell className="py-3.5 px-4 align-middle max-w-[250px]">
                  <div className="flex flex-col">
                    <span className="font-medium truncate">{purchase.supplier_name}</span>
                  </div>
                </TableCell>

                {/* Material */}
                <TableCell className="py-3.5 px-4 align-middle max-w-[250px]">
                  <span className="truncate">{purchase.material_name}</span>
                </TableCell>

                {/* Quantity */}
                <TableCell className="py-3.5 px-4 text-right align-middle whitespace-nowrap border-l border-border/10">
                  {purchase.quantity || 1}
                </TableCell>

                {/* Unit Price */}
                <TableCell className="py-3.5 px-4 text-right align-middle whitespace-nowrap border-l border-border/10">
                  {formatCurrency(purchase.unit_price || (purchase.total_amount / (purchase.quantity || 1)))}
                </TableCell>

                {/* Total Amount */}
                <TableCell className="py-3.5 px-4 text-right align-middle whitespace-nowrap font-medium border-l border-border/10">
                  {formatCurrency(purchase.total_amount)}
                </TableCell>

                {/* Amount Paid */}
                <TableCell className="py-3.5 px-4 text-right align-middle whitespace-nowrap border-l border-border/10">
                  {formatCurrency(purchase.amount_paid)}
                </TableCell>

                {/* Balance */}
                <TableCell className="py-3.5 px-4 text-right align-middle whitespace-nowrap border-l border-border/10">
                  {purchase.balance < 0 ? (
                    <span className="text-green-500 font-medium">
                      {formatCurrency(Math.abs(purchase.balance))} (Overpaid)
                    </span>
                  ) : (
                    formatCurrency(purchase.balance)
                  )}
                </TableCell>

                {/* Status */}
                <TableCell className="py-3.5 px-4 align-middle border-l border-border/10">
                  <StatusBadge status={purchase.payment_status} />
                </TableCell>

                {/* Actions */}
                <TableCell className="py-3.5 px-4 text-right align-middle border-l border-border/10">
                  <MaterialPurchaseActions
                    purchase={purchase}
                    onView={onViewPurchase}
                    onDelete={onDeletePurchase}
                  />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
