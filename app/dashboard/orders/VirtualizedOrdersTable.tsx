'use client';

import { useState } from 'react';
import { useOrders } from '@/hooks/use-data';
import { VirtualizedTable } from '@/components/ui/virtualized-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Edit, Trash } from 'lucide-react';

interface VirtualizedOrdersTableProps {
  initialData?: any[];
}

export function VirtualizedOrdersTable({ initialData }: VirtualizedOrdersTableProps) {
  // Use SWR for client-side data fetching, with initialData from the server
  const { orders, isLoading, isError } = useOrders();

  // Use the initialData if provided, otherwise use the data from SWR
  const displayOrders = orders || initialData || [];

  // Handle view order
  const handleViewOrder = (order: any) => {
    console.log('View order:', order);
  };

  // Edit functionality has been consolidated to use only inline editing in the OrderViewSheet

  // Handle delete order
  const handleDeleteOrder = (order: any) => {
    console.log('Delete order:', order);
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-500/10 text-green-500 hover:bg-green-500/20';
      case 'Processing':
        return 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20';
      case 'Pending':
        return 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20';
      case 'Cancelled':
        return 'bg-red-500/10 text-red-500 hover:bg-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20';
    }
  };

  // Define columns for the virtualized table
  const columns = [
    {
      header: 'Order ID',
      accessorKey: 'id' as const,
    },
    {
      header: 'Customer',
      accessorKey: 'customer' as const,
    },
    {
      header: 'Total',
      accessorKey: 'total' as const,
      cell: (order: any) => `$${order.total.toFixed(2)}`,
    },
    {
      header: 'Status',
      accessorKey: 'status' as const,
      cell: (order: any) => (
        <Badge className={getStatusColor(order.status)}>
          {order.status}
        </Badge>
      ),
    },
    {
      header: 'Date',
      accessorKey: 'date' as const,
      cell: (order: any) => new Date(order.date).toLocaleDateString(),
    },
    {
      header: 'Actions',
      accessorKey: 'id' as const,
      cell: (order: any) => (
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              handleViewOrder(order);
            }}
          >
            <Eye className="h-4 w-4" />
            <span className="sr-only">View</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              handleViewOrder(order); // Use view handler instead of edit handler
            }}
          >
            <Edit className="h-4 w-4" />
            <span className="sr-only">View/Edit</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteOrder(order);
            }}
          >
            <Trash className="h-4 w-4" />
            <span className="sr-only">Delete</span>
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <VirtualizedTable
        data={displayOrders}
        columns={columns}
        onRowClick={handleViewOrder}
      />
    </div>
  );
}
