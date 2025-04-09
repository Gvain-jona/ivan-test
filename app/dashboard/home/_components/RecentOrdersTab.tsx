'use client';

import React from 'react';
import { 
  Package, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  ArrowRight,
  Eye
} from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../../../components/ui/table';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Skeleton } from '../../../components/ui/skeleton';
import { formatCurrency } from '../../../lib/utils';
import { useHomePage } from '../_context/HomePageContext';

/**
 * Tab content for the Recent Orders tab in the Home page
 */
const RecentOrdersTab: React.FC = () => {
  const { 
    recentOrders, 
    initialLoading, 
    handleViewOrder 
  } = useHomePage();

  // Function to render status badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
            <CheckCircle className="h-3.5 w-3.5 mr-1" />
            Completed
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/20">
            <Clock className="h-3.5 w-3.5 mr-1" />
            Pending
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
            <AlertCircle className="h-3.5 w-3.5 mr-1" />
            Cancelled
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
            <Package className="h-3.5 w-3.5 mr-1" />
            {status}
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border/40 overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/5">
            <TableRow>
              <TableHead className="w-[100px]">Order ID</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="w-[80px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialLoading ? (
              // Loading skeletons
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={`skeleton-${index}`}>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-28" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-5 w-20 ml-auto" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto rounded-md" /></TableCell>
                </TableRow>
              ))
            ) : (
              // Actual data
              recentOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.id}</TableCell>
                  <TableCell>{order.client_name}</TableCell>
                  <TableCell>{new Date(order.date).toLocaleDateString()}</TableCell>
                  <TableCell>{renderStatusBadge(order.status)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(order.total_amount)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleViewOrder(order.id)}
                      className="h-8 w-8"
                    >
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">View order</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          className="gap-1"
          onClick={() => window.location.href = '/dashboard/orders'}
        >
          <span>View All Orders</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default RecentOrdersTab;
