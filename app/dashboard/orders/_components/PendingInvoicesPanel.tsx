'use client';

import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency } from '@/lib/utils';
import { formatDate } from '@/lib/utils';
import { Search, User, DollarSign, Calendar, Filter } from 'lucide-react';

interface PendingInvoice {
  id: string;
  clientName: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'delivered' | 'not_delivered';
}

interface PendingInvoicesPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pendingInvoices: PendingInvoice[];
}

const PendingInvoicesPanel: React.FC<PendingInvoicesPanelProps> = ({
  open,
  onOpenChange,
  pendingInvoices
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('amount');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filter and sort invoices
  const filteredInvoices = pendingInvoices
    .filter(invoice => {
      // Apply search filter
      const matchesSearch = invoice.clientName.toLowerCase().includes(searchTerm.toLowerCase());

      // Apply status filter
      const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      // Apply sorting
      if (sortBy === 'amount') {
        return sortOrder === 'desc' ? b.amount - a.amount : a.amount - b.amount;
      } else if (sortBy === 'dueDate') {
        return sortOrder === 'desc'
          ? new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()
          : new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      } else {
        return sortOrder === 'desc'
          ? b.clientName.localeCompare(a.clientName)
          : a.clientName.localeCompare(b.clientName);
      }
    });

  // Get status label
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'delivered': return 'Delivered';
      case 'not_delivered': return 'Not Delivered';
      default: return 'Unknown';
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'delivered': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'not_delivered': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md md:max-w-lg lg:max-w-xl overflow-y-auto">
        <SheetHeader className="mb-6 pb-4 border-b">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <DollarSign className="h-4 w-4 text-primary" />
            </div>
            <div>
              <SheetTitle>Pending Invoices</SheetTitle>
              <SheetDescription>
                View and filter all pending invoices
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* Search and filters */}
        <div className="space-y-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by client name..."
              className="pl-9 h-10 bg-muted/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-10 bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Filter by status" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="not_delivered">Not Delivered</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 flex gap-2">
              <Select value={sortBy} onValueChange={setSortBy} className="flex-1">
                <SelectTrigger className="h-10 bg-muted/50">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="amount">Amount</SelectItem>
                  <SelectItem value="dueDate">Due Date</SelectItem>
                  <SelectItem value="clientName">Client Name</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="flex-shrink-0 h-10 w-10 bg-muted/50"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </Button>
            </div>
          </div>
        </div>

        <div className="text-sm font-medium mb-3 text-muted-foreground flex items-center justify-between">
          <span>Found {filteredInvoices.length} invoice{filteredInvoices.length !== 1 ? 's' : ''}</span>
          {filteredInvoices.length > 0 && (
            <span>
              Total: {formatCurrency(filteredInvoices.reduce((sum, inv) => sum + inv.amount, 0))}
            </span>
          )}
        </div>

        {/* Invoices list */}
        <div className="space-y-3">
          {filteredInvoices.length > 0 ? (
            filteredInvoices.map((invoice) => (
              <div key={invoice.id} className="border border-border rounded-md p-4 hover:bg-muted/50 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full
                      ${invoice.status === 'delivered' ? 'bg-green-100 dark:bg-green-900/20' :
                        invoice.status === 'not_delivered' ? 'bg-purple-100 dark:bg-purple-900/20' :
                        'bg-primary/10'}`}>
                      <User className={`h-5 w-5
                        ${invoice.status === 'delivered' ? 'text-green-600 dark:text-green-400' :
                          invoice.status === 'not_delivered' ? 'text-purple-600 dark:text-purple-400' :
                          'text-primary'}`} />
                    </div>
                    <div>
                      <div className="font-medium">{invoice.clientName}</div>
                      <div className="text-xs text-muted-foreground">Order ID: {invoice.id}</div>
                    </div>
                  </div>
                  <div className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(invoice.status)}`}>
                    {getStatusLabel(invoice.status)}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted">
                      <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Amount</div>
                      <div className="font-medium">{formatCurrency(invoice.amount)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Due Date</div>
                      <div className="font-medium">{new Date(invoice.dueDate).toLocaleDateString()}</div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => window.location.href = `/dashboard/orders/${invoice.id}`}
                  >
                    View Order
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No invoices found matching your filters
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default PendingInvoicesPanel;
